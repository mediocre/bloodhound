const async = require('async');
const moment = require('moment-timezone');
const DhlClient = require('dhl-ecommerce-solutions');

// These tracking codes indicate the shipment was delivered
const DELIVERED_TRACKING_STATUS_CODES = ['600', '607'];

// These tracking codes should indicate the shipment was shipped (shows movement beyond a shipping label being created)
const SHIPPED_TRACKING_STATUS_CODES = ['520', '526', '540', '580', '598'];
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

function DhlEcommerceSolutions(options) {
    const dhlClient = new DhlClient(options);

    this.isTrackingNumberValid = function(trackingNumber) {
        // 10-39 characters is as definite as I could find... https://www.dhl.com/us-en/home/customer-service/ecommerce-solutions-tracking-faq.html
        // For US domestic mail, DHL eCommerce Solutions tracking numbers will be USPS IMpb numbers.
        // IMpb numbers that start with 93 expect a 6-digit Mailer ID. If they start with 92, it's a 9-digit Mailer ID. 109124 is the 6-digit Mailer ID for DHL eCommerce Solutions.
        // Minus the digits that are meant to be suppressed in printed form, the numbers are all either 22 or 26 digits long.
        if (/^93/.test(trackingNumber)) {
            return /^93\d{3}109124\d{11}(?:\d{4})?$/.test(trackingNumber);
        } else if (/^92/.test(trackingNumber)) {
            // For now, we don't have a 9-digit Mailer ID to look for for DHL eCommerce Solutions.
            //return /^92\d{3}000000000\d{8}(?:\d{4})?$/.test(trackingNumber);
            return false;
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
            dhlClient.getTrackingByTrackingId(trackingNumber, callback);
        }, function(err, body) {
            const results = {
                carrier: 'DHL eCommerce Solutions',
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
                        // TODO: Geolocate??
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

                if (!results.deliveredAt && _event.description && DELIVERED_TRACKING_STATUS_CODES.includes(event.primaryEventId.toString())) {
                    results.deliveredAt = _event.date;
                }

                if (!results.shippedAt && _event.description && SHIPPED_TRACKING_STATUS_CODES.includes(event.primaryEventId.toString())) {
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