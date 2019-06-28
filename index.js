const async = require('async');
const builder = require('xmlbuilder');
const FedEx = require('shipping-fedex');
const moment = require('moment-timezone');
const parser = require('xml2js');
const PitneyBowes = require('pitney-bowes');
const request = require('request');

// Remove these words from cities to turn cities like `FEDEX SMARTPOST INDIANAPOLIS` into `INDIANAPOLIS`
const CITY_BLACKLIST = /fedex|smartpost|DISTRIBUTION CENTER/ig;

// These tracking status codes indicate the shipment was delivered: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const FEDEX_DELIVERED_TRACKING_STATUS_CODES = ['DL'];

// These tracking status codes indicate the shipment was shipped (shows movement beyond a shipping label being created): https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const FEDEX_SHIPPED_TRACKING_STATUS_CODES = ['AR', 'DP', 'IT', 'OD'];

// The events from these tracking status codes are filtered because their timestamps are nonsensical: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const FEDEX_TRACKING_STATUS_CODES_BLACKLIST = ['PU', 'PX'];

function Bloodhound(options) {
    const fedEx = new FedEx(options && options.fedEx);
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);
    const usps = options && options.usps;

    this.track = function(trackingNumber, carrier, callback) {
        if (!trackingNumber) {
            return callback(new Error('Tracking number is not specified.'));
        }

        if (!carrier) {
            return callback(new Error('Carrier is not specified.'));
        }

        const results = {
            events: []
        };

        carrier = carrier.toLowerCase();

        if (carrier === 'fedex') {
            // Create a FedEx track request: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Service_Optionsbc-3&rhtocid=_26_0_2
            const trackRequest = {
                SelectionDetails: {
                    PackageIdentifier: {
                        Type: 'TRACKING_NUMBER_OR_DOORTAG',
                        Value: trackingNumber
                    }
                },
                ProcessingOptions: 'INCLUDE_DETAILED_SCANS'
            };

            // FedEx Web Services requests occasionally fail. Timeout after 5 seconds and retry.
            async.retry(function(callback) {
                async.timeout(fedEx.track, 5000)(trackRequest, callback);
            }, function(err, trackReply) {
                if (err) {
                    return callback(err);
                }

                // Ensure track reply has events
                if (!trackReply.CompletedTrackDetails || !trackReply.CompletedTrackDetails.length || !trackReply.CompletedTrackDetails[0] || !trackReply.CompletedTrackDetails[0].TrackDetails || !trackReply.CompletedTrackDetails[0].TrackDetails.length || !trackReply.CompletedTrackDetails[0].TrackDetails[0] || !trackReply.CompletedTrackDetails[0].TrackDetails[0].Events || !trackReply.CompletedTrackDetails[0].TrackDetails[0].Events.length) {
                    return callback(null, results);
                }

                trackReply.CompletedTrackDetails[0].TrackDetails[0].Events.forEach(e => {
                    if (FEDEX_TRACKING_STATUS_CODES_BLACKLIST.includes(e.EventType)) {
                        return;
                    }

                    if (FEDEX_DELIVERED_TRACKING_STATUS_CODES.includes(e.EventType)) {
                        results.deliveredAt = new Date(e.Timestamp);
                    }

                    if (FEDEX_SHIPPED_TRACKING_STATUS_CODES.includes(e.EventType)) {
                        results.shippedAt = new Date(e.Timestamp);
                    }

                    const event = {
                        address: {
                            city: e.Address.City,
                            country: e.Address.CountryCode,
                            state: e.Address.StateOrProvinceCode,
                            zip: e.Address.PostalCode
                        },
                        date: new Date(e.Timestamp),
                        description: e.EventDescription
                    };

                    if (e.StatusExceptionDescription) {
                        event.details = e.StatusExceptionDescription;
                    }

                    // Remove blacklisted words
                    if (event.address.city) {
                        event.address.city = event.address.city.replace(CITY_BLACKLIST, '').trim();
                    }

                    results.events.push(event);
                });

                callback(null, results);
            });
        } else if (carrier === 'newgistics') {
            pitneyBowes.tracking({ trackingNumber }, function(err, data) {
                if (err) {
                    return callback(err);
                }

                const statuses = data.scanDetailsList.map(scanDetails => {
                    return {
                        address: {
                            city: scanDetails.eventCity,
                            state: scanDetails.eventStateOrProvince
                        },
                        date: moment(`${scanDetails.eventDate} ${scanDetails.eventTime}`, 'YYYY-MM-DD HH:mm:ss').toDate(),
                        description: scanDetails.scanDescription
                    };
                });

                callback(null, statuses);
            });
        } else if (carrier == 'usps') {

            const host = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=';

            const obj = {
                TrackFieldRequest: {
                    '@USERID': usps.USERID,
                    Revision: '1',
                    ClientIp: usps.ClientIp || '127.0.0.1',
                    SourceId: usps.SourceId || 'Mediocre/bloodhound',
                    TrackID: {
                        '@ID': trackingNumber
                    }
                }
            }

            var xml = builder.create(obj, { headless: true }).end({ pretty: false });
            const url = host + encodeURIComponent(xml);

            request(url, function(err, res) {
                if (err) {
                    return callback(err);
                }

                parser.parseString(res.body, function(err, data) {
                    // Kind of like checking status code?
                    // 1. Invalid XML in parser
                    // 2. Invalid credentials
                    // 3. Invalid tracking number
                    if(err) {
                        return callback(err);
                    } else if (data.Error) {
                        return callback(data.Error.Description[0]);
                    } else if (data.TrackResponse.TrackInfo[0].Error) {
                        return callback(data.TrackResponse.TrackInfo[0].Error[0].Description[0]);
                    }

                    var statuses = [];

                    // TrackSummary[0] exists for every item (with valid tracking number)
                    const summary = data.TrackResponse.TrackInfo[0].TrackSummary[0];

                    // If we have tracking details, push them into statuses
                    // Tracking details only exist if the item has more than one status update
                    if (data.TrackResponse.TrackInfo[0].TrackDetail) {
                        statuses = data.TrackResponse.TrackInfo[0].TrackDetail.map(scanDetails => {
                            return {
                                address: {
                                    city: scanDetails.EventCity[0].replace(CITY_BLACKLIST, '').trim(),
                                    state: scanDetails.EventState[0],
                                    zip: scanDetails.EventZIPCode[0]
                                },
                                date: moment(`${scanDetails.EventDate[0]} ${scanDetails.EventTime[0]}`, 'MMMM D, YYYY h:mm a').toDate(),
                                description: scanDetails.Event[0]
                            };
                        });
                    }

                    // Push TrackSummary since it always exists
                    statuses.push({
                        address: {
                            city: summary.EventCity[0],
                            state: summary.EventState[0]
                        },
                        date: moment(`${summary.EventDate[0]} ${summary.EventTime[0]}`, 'MMMM D, YYYY h:mm a').toDate(),
                        description: data.TrackResponse.TrackInfo[0].StatusSummary[0]
                    });

                    return callback(null, statuses);
                });
            });
        } else {
            return callback(new Error(`Carrier ${carrier} is not supported.`));
        }
    };
}

module.exports = Bloodhound;