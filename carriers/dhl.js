const async = require('async');
const request = require('request');
const geography = require('../util/geography');
const moment = require('moment-timezone');

function DHL(options) {
    this.isTrackingNumberValid = function(trackingNumber) {
        return false;
    };

    this.track = function(trackingNumber, callback) {
        const req = {
            url: `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
            method: 'GET',
            headers: {
                'DHL-API-Key': `${options.DHL_API_Key}`
            },
            timeout: 5000
        };

        async.retry(function(callback) {
            request(req, callback);
        }, function(err, res) {
            if (err) {
                return callback(err);
            }

            const results = {
                events: []
            };

            const scanDetails = JSON.parse(res.body).shipments[0].events;

            scanDetails.forEach(scanDetail => {
                scanDetail.address = {
                    city: scanDetail.location != undefined ? scanDetail.location.address.addressLocality : '',
                    zip: scanDetail.location != undefined ? scanDetail.location.address.postalCode : ''
                }
                scanDetail.location = geography.addressToString(scanDetail.address);
            });

            // Get unqiue array of locations
            const locations = Array.from(new Set(scanDetails.map(scanDetail => scanDetail.location)));

            // Lookup each location
            async.mapLimit(locations, 10, function (location, callback) {
                geography.parseLocation(location, options, function (err, address) {
                    if (err || !address) {
                        return callback(err, address);
                    }

                    address.location = location;

                    callback(null, address);
                });
            }, function (err, addresses) {
                if (err) {
                    return callback(err);
                }

                scanDetails.forEach(scanDetail => {
                    const address = addresses.find(a => a && a.location === scanDetail.location);
                    let timezone = 'America/New_York';

                    if (address && address.timezone) {
                        timezone = address.timezone;
                    }

                    const event = {
                        address: scanDetail.address,
                        date: new Date(moment.tz(`${scanDetail.timestamp}`, timezone).format('YYYY-MM-DDTHH:mm:ss')),
                        description: scanDetail.status
                    };

                    if (scanDetail.statusCode === 'transit') {
                        results.shippedAt = event.date;
                    }

                    if (scanDetail.statusCode === 'delivered') {
                        results.deliveredAt = event.date;
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

                callback(null, JSON.stringify(results, null, 4));
            });
        });
    }
}

module.exports = DHL;