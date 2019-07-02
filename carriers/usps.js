const async = require('async');
const builder = require('xmlbuilder');
const moment = require('moment-timezone');
const parser = require('xml2js');
const request = require('request');

const geography = require('../util/geography');

const CITY_BLACKLIST = /DISTRIBUTION CENTER/ig;

// These tracking status codes indicate the shipment was delivered: https://about.usps.com/publications/pub97/pub97_appi.htm
const DELIVERED_TRACKING_STATUS_CODES = ['01'];

// These tracking status codes indicate the shipment was shipped (shows movement beyond a shipping label being created): https://about.usps.com/publications/pub97/pub97_appi.htm
const SHIPPED_TRACKING_STATUS_CODES = ['80', '81', '82', 'OF'];

function USPS(options) {
    this.isTrackingNumberValid = function(trackingNumber) {
        // remove whitespace
        trackingNumber = trackingNumber.replace(/\s/g, '');

        if (/^(94001)\d{17}$/.test(trackingNumber)){
            return true;
        }
        if (/^(92055)\d{17}$/.test(trackingNumber)){
            return true;
        }
        if (/^(94073)\d{17}$/.test(trackingNumber)){
            return true;
        }
        if (/^(93033)\d{17}$/.test(trackingNumber)){
            return true;
        }
        if (/^(92701)\d{17}$/.test(trackingNumber)){
            return true;
        }
        if (/^(92088)\d{17}$/.test(trackingNumber)){
            return true;
        }
        if (/^(92021)\d{17}$/.test(trackingNumber)){
            return true;
        }

        return false;
    };
    this.track = function(trackingNumber, callback) {
        const baseUrl = options.baseUrl || 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=';

        const obj = {
            TrackFieldRequest: {
                '@USERID': options.USPS_USERID,
                Revision: '1',
                ClientIp: options.ClientIp || '127.0.0.1',
                SourceId: options.SourceId || '@mediocre/bloodhound (+https://github.com/mediocre/bloodhound)',
                TrackID: {
                    '@ID': trackingNumber
                }
            }
        }

        var xml = builder.create(obj, { headless: true }).end({ pretty: false });
        const url = baseUrl + encodeURIComponent(xml);

        request(url, function (err, res) {
            if (err) {
                return callback(err);
            }

            parser.parseString(res.body, function (err, data) {
                // 1. Invalid XML in parser
                // 2. Invalid credentials
                // 3. Invalid tracking number
                if (err) {
                    return callback(err);
                } else if (data.Error) {
                    return callback(new Error(data.Error.Description[0]));
                } else if (data.TrackResponse.TrackInfo[0].Error) {
                    return callback(new Error(data.TrackResponse.TrackInfo[0].Error[0].Description[0]));
                }

                const results = {
                    events: []
                };

                var scanDetailsList = [];

                // TrackSummary[0] exists for every item (with valid tracking number)
                const summary = data.TrackResponse.TrackInfo[0].TrackSummary[0];

                scanDetailsList.push(summary);
                var trackDetailList = data.TrackResponse.TrackInfo[0].TrackDetail;

                // If we have tracking details, push them into statuses
                // Tracking details only exist if the item has more than one status update
                if (trackDetailList) {
                    trackDetailList.forEach((trackDetail) => {
                        scanDetailsList.push(trackDetail);
                    });
                }

                // Set address and location of each scan detail
                scanDetailsList.forEach(scanDetail => {
                    scanDetail.address = {
                        city: scanDetail.EventCity[0].replace(CITY_BLACKLIST, '').trim(),
                        country: scanDetail.EventCountry[0],
                        state: scanDetail.EventState[0],
                        zip: scanDetail.EventZIPCode[0]
                    };

                    scanDetail.location = geography.addressToString(scanDetail.address);
                });

                // Get unqiue array of locations
                const locations = Array.from(new Set(scanDetailsList.map(scanDetail => scanDetail.location)));

                // Lookup each location
                async.mapLimit(locations, 10, function (location, callback) {
                    geography.parseLocation(location, function (err, address) {
                        if (err) {
                            return callback(err);
                        }

                        address.location = location;

                        callback(null, address);
                    });
                }, function (err, addresses) {
                    if (err) {
                        return callback(err);
                    }

                    scanDetailsList.forEach(scanDetail => {
                        const address = addresses.find(a => a.location === scanDetail.location);
                        let timezone = 'America/New_York';

                        if (address && address.timezone) {
                            timezone = address.timezone;
                        }

                        const event = {
                            address: scanDetail.address,
                            date: moment.tz(`${scanDetail.EventDate[0]} ${scanDetail.EventTime[0]}`, 'MMMM D, YYYY h:mm a', timezone).toDate(),
                            description: scanDetail.Event[0]
                        };

                        if (DELIVERED_TRACKING_STATUS_CODES.includes(scanDetail.EventCode[0])) {
                            results.deliveredAt = new Date(event.date);
                        }

                        if (SHIPPED_TRACKING_STATUS_CODES.includes(scanDetail.EventCode[0])) {
                            results.shippedAt = new Date(event.date);
                        }

                        // Use the city and state from the parsed address (for scenarios where the city includes the state like "New York, NY")
                        if (address) {
                            if (address.city) {
                                event.address.city = address.city;
                            }

                            if (address.state) {
                                event.address.state = address.state;
                            }
                        }

                        results.events.push(event);
                    });

                    // Change description of most recent event to be StatusSummary (more descriptive)
                    results.events[0].details = data.TrackResponse.TrackInfo[0].StatusSummary[0];

                    callback(null, results);
                });
            });
        });
    }
}

module.exports = USPS;