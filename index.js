const async = require('async');
const FedEx = require('shipping-fedex');
const moment = require('moment-timezone');
const PitneyBowes = require('pitney-bowes');

// Remove these words from cities to turn cities like `FEDEX SMARTPOST INDIANAPOLIS` into `INDIANAPOLIS`
const CITY_BLACKLIST = /fedex|smartpost/ig;

// https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const FEDEX_DELIVERED_TRACKING_STATUS_CODES = ['DL'];
const FEDEX_SHIPPED_TRACKING_STATUS_CODES = ['AR', 'DP', 'IT', 'OD'];

function Bloodhound(options) {
    const fedEx = new FedEx(options && options.fedEx);
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);

    this.track = function(trackingNumber, carrier, callback) {
        if (!trackingNumber) {
            return callback(new Error('Tracking number is not specified'));
        }

        if (!carrier) {
            return callback(new Error('Carrier is not specified'));
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
                    if (FEDEX_DELIVERED_TRACKING_STATUS_CODES.includes(e.EventType)) {
                        results.deliveredAt = new Date(e.Timestamp);
                    }

                    if (FEDEX_SHIPPED_TRACKING_STATUS_CODES.includes(e.EventType)) {
                        results.shippedAt = new Date(e.Timestamp);
                    }

                    const event = {
                        date: new Date(e.Timestamp),
                        description: e.EventDescription
                    };

                    if (e.Address) {
                        event.address = {
                            city: e.Address.City,
                            country: e.Address.CountryCode,
                            state: e.Address.StateOrProvinceCode,
                            zip: e.Address.PostalCode
                        }

                        // Remove blacklisted words
                        if (event.address.city) {
                            event.address.city = event.address.city.replace(CITY_BLACKLIST, '').trim();
                        }
                    }

                    if (e.StatusExceptionDescription) {
                        event.details = e.StatusExceptionDescription;
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
        } else {
            return callback(new Error(`Carrier ${carrier} is not supported.`));
        }
    };
}

module.exports = Bloodhound;