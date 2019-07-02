const async = require('async');
const moment = require('moment-timezone');
const PitneyBowesClient = require('pitney-bowes');

// These tracking status codes indicate the shipment was delivered
const DELIVERED_TRACKING_STATUS_CODES = ['01'];

// These tracking status codes indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_STATUS_CODES = ['07', '80', '81', '82', 'AD', 'OF'];

const geography = require('../util/geography');

function PitneyBowes(options) {
    const pitneyBowesClient = new PitneyBowesClient(options);

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

                    if (DELIVERED_TRACKING_STATUS_CODES.includes(scanDetail.scanType)) {
                        results.deliveredAt = new Date(event.date);
                    }

                    if (SHIPPED_TRACKING_STATUS_CODES.includes(scanDetail.scanType)) {
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

                callback(null, results);
            });
        });
    }
}

module.exports = PitneyBowes;