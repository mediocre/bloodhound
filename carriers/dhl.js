const async = require('async');
const request = require('request');

const checkDigit = require('../util/checkDigit');
const USPS = require('./usps');

// These tracking descriptions indicate the shipment was delivered
const DELIVERED_TRACKING_DESCRIPTIONS = ['DELIVERED'];

// These tracking descriptions should indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_DESCRIPTIONS = ['ARRIVAL DESTINATION DHL ECOMMERCE FACILITY', 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY', 'ARRIVED USPS SORT FACILITY', 'ARRIVAL AT POST OFFICE', 'OUT FOR DELIVERY', 'PROCESSED THROUGH SORT FACILITY'];

// In an IMpb number, an initial '420' followed by ZIP or ZIP+4 is part of the barcode but is not supposed to be printed. If the tracking number comes from a barcode scanner, it will have that info.
// 109124 is a Mailer ID provided by DHL. See https://postalpro.usps.com/shipping/impb/BarcodePackageIMSpec for full IMpb specs.
const DHL_IMPB_REGEX = new RegExp(/^(?:420(?:\d{9}|\d{5}))?(93\d{3}109124(?:\d{14}|\d{10})\d)$/);

function DHL(options) {
    const usps = new USPS(options && options.usps);

    this.isTrackingNumberValid = function(trackingNumber) {
        // Remove spaces and uppercase
        trackingNumber = trackingNumber.replace(/\s/g, '').toUpperCase();

        if (DHL_IMPB_REGEX.test(trackingNumber)) {
            // Strip off the IMpb routing code and ZIP
            trackingNumber = trackingNumber.replace(DHL_IMPB_REGEX, '$1');

            return checkDigit(trackingNumber, [3, 1], 10);
        }

        return false;
    };

    this.track = function(trackingNumber, _options, callback) {
        // Options are optional
        if (typeof _options === 'function') {
            callback = _options;
            _options = {};
        }

        if (!_options.minDate) {
            _options.minDate = new Date(0);
        }

        // This is the API being used from: https://developer.dhl.com/api-reference/shipment-tracking
        const req = {
            forever: true,
            gzip: true,
            headers: {
                'DHL-API-Key': options.apiKey
            },
            json: true,
            method: 'GET',
            timeout: 5000,
            url: `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`
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
                // If DHL fails, try USPS
                if (options.usps && usps.isTrackingNumberValid(trackingNumber)) {
                    return usps.track(trackingNumber, callback);
                }

                return callback(err);
            }

            const results = {
                carrier: 'DHL',
                events: [],
                raw: body
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

                // Ensure event is after minDate (used to prevent data from reused tracking numbers)
                if (_event.date < _options.minDate) {
                    return;
                }

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