const async = require('async');
const moment = require('moment-timezone');
const PitneyBowesClient = require('pitney-bowes');

const geography = require('../util/geography');

function PitneyBowes(options) {
    const pitneyBowesClient = new PitneyBowesClient(options);

    this.isTrackingNumberValid = function (trackingNumber) {
        //https://www.trackingmore.com/tracking-status-detail-en-240.html
        if ([/^\d{34}$/, /^420\d{31}$/, /^420\d{21}$/, /^420\d{19}$/].some(regex => regex.test(trackingNumber))) {
            return true;
        }

        return false;
    };

    this.track = function(trackingNumber, callback) {
        pitneyBowesClient.tracking({ trackingNumber }, function(err, data) {
            if (err) {
                return callback(err);
            }

            const results = {
                events: []
            };

            // Set address and location of each scan detail
            data.scanDetailsList.forEach(scanDetail => {
                scanDetail.address = {
                    city: scanDetail.eventCity,
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
                geography.parseLocation(location, function(err, address) {
                    if (err) {
                        return callback(err);
                    }

                    address.location = location;

                    callback(null, address);
                });
            }, function(err, addresses) {
                if (err) {
                    return callback(err);
                }

                data.scanDetailsList.forEach(scanDetail => {
                    const address = addresses.find(a => a.location === scanDetail.location);
                    let timezone = 'America/New_York';

                    if (address && address.timezone) {
                        timezone = address.timezone;
                    }

                    const event = {
                        address: scanDetail.address,
                        date: moment.tz(`${scanDetail.eventDate} ${scanDetail.eventTime}`, 'YYYY-MM-DD HH:mm:ss', timezone).toDate(),
                        description: scanDetail.scanDescription
                    };

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

                callback(null, results);
            });
        });
    }
}

module.exports = PitneyBowes;