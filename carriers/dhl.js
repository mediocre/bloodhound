const async = require('async');
const moment = require('moment-timezone');
const request = require('request');

const checkDigit = require('../util/checkDigit');
const geography = require('../util/geography');

function DHL(options) {
    this.isTrackingNumberValid = function(trackingNumber) {
        trackingNumber = trackingNumber.replace(/\s/g, '').toUpperCase();

        if ([/^93612\d{17}$/, /^92612\d{17}$/, /^94748\d{17}$/, /^93748\d{17}$/, /^92748\d{17}$/].some(regex => regex.test(trackingNumber))) {
            return checkDigit(trackingNumber, [3, 1], 10);
        }

        if (/^420\d{27}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber.match(/^420\d{5}(\d{22})$/)[1], [3, 1], 10);
        }

        if (/^420\d{31}$/.test(trackingNumber)) {
            if (checkDigit(trackingNumber.match(/^420\d{9}(\d{22})$/)[1], [3, 1], 10)) {
                return true;
            } else if (checkDigit(trackingNumber.match(/^420\d{5}(\d{26})$/)[1], [3, 1], 10)) {
                return true;
            }
        }

        return false;
    };

    this.track = function(trackingNumber, callback) {
        const req = {
            url: `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
            method: 'GET',
            json: true,
            headers: {
                'DHL-API-Key': options.apiKey
            },
            timeout: 5000
        };

        async.retry(function(callback) {
            request(req, callback);
        }, function(err, res) {
            const response = res.body;

            if (err) {
                return callback(err);
            } else if (response.status === 401 || response.status === 404) {
                return callback(new Error(response.detail));
            }

            const results = {
                events: []
            };

            var scanDetails = res.body.shipments[0].events;

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

                callback(null, results);
            });
        });
    }
}

module.exports = DHL;