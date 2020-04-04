const async = require('async');
const request = require('request');

const checkDigit = require('../util/checkDigit');

// These tracking descriptions indicate the shipment was delivered
const DELIVERED_TRACKING_DESCRIPTIONS = ['DELIVERED'];

// These tracking descriptions should indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_DESCRIPTIONS = ['ARRIVAL DESTINATION DHL ECOMMERCE FACILITY', 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY', 'ARRIVED USPS SORT FACILITY', 'ARRIVAL AT POST OFFICE', 'OUT FOR DELIVERY', 'PROCESSED THROUGH SORT FACILITY'];

function DHL() {
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
        // This is the API being used from: https://www.dhl.com/global-en/home/tracking/tracking-ecommerce.html
        const req = {
            forever: true,
            gzip: true,
            json: true,
            method: 'GET',
            timeout: 5000,
            url: `https://www.dhl.com/utapi?trackingNumber=${trackingNumber}`
        };

        async.retry(function(callback) {
            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode !== 200) {
                    return callback(new Error(`${res.statusCode} ${res.request.method} ${res.request.href} ${body || ''}`.trim()));
                }

                callback(null, body);
            });
        }, function(err, body) {
            if (err) {
                return callback(err);
            }

            const results = {
                carrier: 'DHL',
                events: []
            };

            if (!body || !body.shipments || !body.shipments.length) {
                return callback(null, results);
            }

            // We only support the first shipment
            const shipment = body.shipments[0];

            // Reverse the array to get events in order Least Recent - Most Recent
            const events = shipment.events.reverse();

            // Used when there is no address data present
            var previousAddress = shipment.origin && shipment.origin.address;

            events.forEach(event => {
                // If the event doesn't have a location, make one up using the previousAddress
                if (!event.location) {
                    event.location = {
                        address: previousAddress
                    }
                }

                // If the event's location contains an address without a comma (UNITED STATES), use the previousAddress instead
                if (event.location && event.location.address && event.location.address.addressLocality && !event.location.address.addressLocality.includes(',')) {
                    event.location.address = previousAddress;
                }

                // Save the current address as the previousAddress
                previousAddress = event.location.address;

                const addressTokens = event.location.address.addressLocality.split(',').map(t => t.trim());

                const _event = {
                    address: {
                        city: addressTokens[0],
                        country: event.location.address.countryCode,
                        state: addressTokens[1],
                        zip: event.location.address.postalCode
                    },
                    date: new Date(event.timestamp),
                    description: event.status
                };

                if (event.description) {
                    _event.details = event.description;
                }

                if (!results.deliveredAt && _event.description && DELIVERED_TRACKING_DESCRIPTIONS.includes(_event.description.toUpperCase())) {
                    results.deliveredAt = _event.date;
                }

                if (!results.shippedAt && _event.description && SHIPPED_TRACKING_DESCRIPTIONS.includes(_event.description.toUpperCase())) {
                    results.shippedAt = _event.date;
                }

                results.events.push(_event);
            });

            // Add url to carrier tracking page
            results.url = `http://webtrack.dhlglobalmail.com/?trackingnumber=${encodeURIComponent(trackingNumber)}`;

            // Reverse results again to get events in order Most Recent - Least Recent
            results.events.reverse();

            if (!results.shippedAt && results.deliveredAt) {
                results.shippedAt = results.deliveredAt;
            }

            callback(null, results);
        });
    }
}

module.exports = DHL;