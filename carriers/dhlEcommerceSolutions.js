const async = require('async');
const moment = require('moment-timezone');
const DhlEcommerceClient = require('dhl-ecommerce-solutions');

const checkDigit = require('../util/checkDigit');

// These tracking codes indicate the shipment was delivered
const DELIVERED_TRACKING_DESCRIPTIONS = ['DELIVERED', 'SECOND DELIVERY ATTEMPT SUCCESSFUL'];

// These tracking codes should indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_DESCRIPTIONS = ['ARRIVAL AT POST OFFICE', 'ARRIVAL DESTINATION DHL ECOMMERCE FACILITY', 'ARRIVED USPS SORT FACILITY', 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY', 'OUT FOR DELIVERY', 'OUT FOR SECOND DELIVERY ATTEMPT', 'PACKAGE RECEIVED AT DHL ECOMMERCE DISTRIBUTION CENTER', 'PROCESSED', 'PROCESSED THROUGH USPS SORT FACILITY', 'TENDERED TO DELIVERY SERVICE PROVIDER'];

// EST is listed as an abbreviation for the America/Chicago timezone. America/Boise lists MST, MDT, PST and PDT, and alphabetically comes before any other timezone that lists those abbreviations. The whole abbreviation situation is a mess in Moment Timezone.
// Further, the generic 'ET', 'CT', etc. are not listed at all. Instead, we are just going to maintain our own mapping.
let timezoneList;

function getTimezoneName(abbr) {
    // Attempt to look up a timezone with the same name as the abbreviation provided
    let timezoneByName = moment.tz.zone(abbr);

    if (timezoneByName) {
        return abbr;
    }

    let timezone = 'America/New_York';

    switch (abbr) {
        case 'CT':
        case 'CST':
        case 'CDT':
            timezone = 'America/Chicago';
            break;
        // America/Boise and America/Denver seem to mean the same thing. https://en.wikipedia.org/wiki/List_of_tz_database_time_zones maps US/Mountain to America/Denver.
        case 'MT':
        case 'MST':
        case 'MDT':
            timezone = 'America/Denver';
            break;
        case 'PT':
        case 'PST':
        case 'PDT':
            timezone = 'America/Los_Angeles';
            break;
        case 'AKST':
        case 'AKDT':
            timezone = 'America/Anchorage';
            break;
        // HST and HDT are part of the Hawaii-Aleutian Time Zone. Hawaii does not observe DST, while the Aleutian portion of the timezone does.
        case 'HST':
            timezone = 'Pacific/Honolulu';
            break;
        case 'HDT':
            timezone = 'America/Adak';
            break;
        default: {
            // Don't build this list every time
            if (!timezoneList) {
                timezoneList = moment.tz.names().map(tzName => moment.tz.zone(tzName));
            }

            // Use the first timezone that lists the provided abbreviation
            let tz = timezoneList.find(tz => tz.abbrs.includes(abbr));
            if (tz) {
                timezone = tz.name;
            }
        }
    }

    return timezone;
}

// In an IMpb number, an initial '420' followed by ZIP or ZIP+4 is part of the barcode but is not supposed to be printed. If the tracking number comes from a barcode scanner, it will have that info.
// 109124 is a Mailer ID provided by DHL. See https://postalpro.usps.com/shipping/impb/BarcodePackageIMSpec for full IMpb specs.
const DHL_IMPB_REGEX = new RegExp(/^(?:420(?:\d{9}|\d{5}))?(93\d{3}109124(?:\d{14}|\d{10})\d)$/);

function DhlEcommerceSolutions(options) {
    const dhlEcommerceClient = new DhlEcommerceClient(options);

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

        async.retry(function(callback) {
            dhlEcommerceClient.getTrackingByTrackingId(trackingNumber, callback);
        }, function(err, body) {
            const results = {
                carrier: 'DHL',
                events: [],
                raw: body
            };

            if (err) {
                if (err.message === 'Not Found') {
                    return callback(null, results);
                }

                return callback(err);
            }

            if (!body?.packages?.length) {
                return callback(null, results);
            }

            // We only support the first package
            const package = body.packages[0];

            // Reverse the array to get events in order Least Recent - Most Recent
            const events = package.events.reverse();

            // Used when there is no address data present
            var previousAddress = package.pickupDetail?.pickupAddress;

            events.forEach(event => {
                if (!event.location || !event.country || event.postalCode === '0') {
                    event.address = previousAddress;
                } else {
                    const locationTokens = event.location.split(',').map(t => t.trim());

                    if (!locationTokens || locationTokens.length !== 3) {
                        event.address = previousAddress;
                    } else {
                        event.address = {
                            city: locationTokens[0],
                            country: event.country,
                            state: locationTokens[1],
                            postalCode: event.postalCode
                        }

                        // Save the current address as the previousAddress
                        previousAddress = event.address;
                    }
                }

                const _event = {
                    address: {
                        city: event.address?.city,
                        country: event.address?.country,
                        state: event.address?.state,
                        zip: event.address?.postalCode
                    },
                    date: moment.tz(`${event.date} ${event.time}`, 'YYYY-MM-DD HH:mm:ss', getTimezoneName(event.timeZone)).toDate(),
                    description: event.primaryEventDescription
                };

                // Ensure event is after minDate (used to prevent data from reused tracking numbers)
                if (_event.date < _options.minDate) {
                    return;
                }

                if (event.secondaryEventDescription) {
                    _event.details = event.secondaryEventDescription;
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
            results.url = `https://webtrack.dhlecs.com/orders?trackingNumber=${encodeURIComponent(trackingNumber)}`;

            // Reverse results again to get events in order Most Recent - Least Recent
            results.events.reverse();

            if (!results.shippedAt && results.deliveredAt) {
                results.shippedAt = results.deliveredAt;
            }

            callback(null, results);
        });
    }
}

module.exports = DhlEcommerceSolutions;