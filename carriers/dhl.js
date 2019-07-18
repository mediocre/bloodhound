const async = require('async');
const moment = require('moment-timezone');
const request = require('request');
const checkDigit = require('../util/checkDigit');

// These tracking descriptions indicate the shipment was delivered
const DELIVERED_TRACKING_DESCRIPTIONS = ['DELIVERED'];

// These tracking descriptions should indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_DESCRIPTIONS = ['ARRIVAL DESTINATION DHL ECOMMERCE FACILITY', 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY', 'ARRIVED USPS SORT FACILITY', 'ARRIVAL AT POST OFFICE', 'OUT FOR DELIVERY'];

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
            forever: true,
            gzip: true,
            json: true,
            method: 'GET',
            timeout: 5000,
            url: `https://www.logistics.dhl/v1/mailitems/track?number=${trackingNumber}`
        };

        async.retry(function(callback) {
            request(req, callback);
        }, function(err, res, body) {

            if (err) {
                return callback(err);
            } else if (body.meta.code === 400) {
                return callback(new Error(body.meta.error[0].error_message));
            }

            const results = {
                events: []
            };

            // Reverse the array to get events in order Least Recent - Most Recent
            var scanDetails = body.data.mailItems[0].events.reverse();

            // Used when there is no location data present
            var previousLocation = body.data.mailItems[0].pickup;

            scanDetails.forEach((scanDetail) => {
                // Filter out duplicate events
                if (scanDetail.timeZone === 'LT') {
                    return;
                }

                const splitLocation = scanDetail.location.split(',');

                const loc = {
                    city: splitLocation[0],
                    country: scanDetail.country,
                    state: splitLocation[1],
                    postalCode: scanDetail.postalCode
                }

                scanDetail.address = {
                    city: scanDetail.location === '' ? previousLocation.city : loc.city,
                    country: scanDetail.country === '' ? previousLocation.country : loc.country,
                    state: scanDetail.location === '' ? previousLocation.state.trim() : loc.state.trim(),
                    zip: scanDetail.postalCode === '' ? previousLocation.postalCode.toString() : loc.postalCode.toString()
                }

                // Update previous location
                previousLocation = {
                    city: scanDetail.address.city,
                    country: scanDetail.address.country,
                    postalCode: scanDetail.address.zip,
                    state: scanDetail.address.state
                }

                const event = {
                    address: scanDetail.address,
                    date: new Date(moment.tz(`${scanDetail.date}${scanDetail.time}`, 'YYYY-MM-DDHH:mm:ss', scanDetail.timezone)),
                    description: scanDetail.description
                };

                if (DELIVERED_TRACKING_DESCRIPTIONS.includes(scanDetail.description)) {
                    results.deliveredAt = event.date;
                }

                if (SHIPPED_TRACKING_DESCRIPTIONS.includes(scanDetail.description)) {
                    results.shippedAt = event.date;
                }

                results.events.push(event);
            });

            // Reverse results again to get events in order Most Recent - Least Recent
            results.events.reverse();

            callback(null, results);
        });
    }
}

module.exports = DHL;