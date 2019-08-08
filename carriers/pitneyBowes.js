const async = require('async');
const moment = require('moment-timezone');
const PitneyBowesClient = require('pitney-bowes');

// Remove these words from cities to turn cities like `DISTRIBUTION CENTER INDIANAPOLIS` into `INDIANAPOLIS`
const CITY_BLACKLIST = /DISTRIBUTION CENTER|INTERNATIONAL DISTRIBUTION CENTER|NETWORK DISTRIBUTION CENTER/ig;

// These tracking status codes indicate the shipment was delivered
const DELIVERED_TRACKING_STATUS_CODES = ['01', 'DEL'];

// These tracking status codes indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_STATUS_CODES = ['02', '07', '10', '14', '30', '81', '82', 'AD', 'OF', 'OFD', 'PC'];

const geography = require('../util/geography');

function PitneyBowes(options) {
    const pitneyBowesClient = new PitneyBowesClient(options);

    this.track = function(trackingNumber, callback) {
        async.retry(function(callback) {
            pitneyBowesClient.tracking({ carrier: 'FDR', trackingNumber }, callback);
        }, function(err, data) {
            if (err) {
                return callback(err);
            }

            const results = {
                carrier: 'Newgistics',
                events: []
            };

            if (!data | !data.scanDetailsList) {
                return callback(null, results);
            }

            data.scanDetailsList = data.scanDetailsList.filter(scanDetail => {
                // Remove scan details without cities
                if (!scanDetail.eventCity) {
                    return false;
                }

                return true;
            });

            // Set address and location of each scan detail
            data.scanDetailsList.forEach(scanDetail => {
                scanDetail.address = {
                    city: scanDetail.eventCity.replace(CITY_BLACKLIST, '').trim(),
                    country: scanDetail.country,
                    state: scanDetail.eventStateOrProvince,
                    zip: scanDetail.postalCode
                };

                scanDetail.location = geography.addressToString(scanDetail.address);
            });

            // Get unqiue array of locations
            const locations = Array.from(new Set(data.scanDetailsList.map(scanDetail => scanDetail.location)));

            // Lookup each location
            async.mapLimit(locations, 10, function(location, callback) {
                geography.parseLocation(location, options, function(err, address) {
                    if (err || !address) {
                        return callback(err, address);
                    }

                    address.location = location;

                    callback(null, address);
                });
            }, function(err, addresses) {
                if (err) {
                    return callback(err);
                }

                data.scanDetailsList.reverse().forEach(scanDetail => {
                    const address = addresses.find(a => a && a.location === scanDetail.location);
                    let timezone = 'America/New_York';

                    if (address && address.timezone) {
                        timezone = address.timezone;
                    }

                    const event = {
                        address: scanDetail.address,
                        date: moment.tz(`${scanDetail.eventDate} ${scanDetail.eventTime}`, 'YYYY-MM-DD HH:mm:ss', timezone).toDate(),
                        description: scanDetail.scanDescription
                    };

                    if (DELIVERED_TRACKING_STATUS_CODES.includes(scanDetail.scanType.toString())) {
                        results.deliveredAt = new Date(event.date);
                    }

                    if (SHIPPED_TRACKING_STATUS_CODES.includes(scanDetail.scanType.toString())) {
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

                // Add url to carrier tracking page
                results.url = `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${encodeURIComponent(trackingNumber)}`;

                if (!results.shippedAt && results.deliveredAt) {
                    results.shippedAt = results.deliveredAt;
                }
                results.events = results.events.reverse();
                callback(null, results);
            });
        });
    }
}

module.exports = PitneyBowes;