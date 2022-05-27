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
        // https://mydhl.express.dhl/es/en/forms/tracking-number-not-10-digits.html mentions a few specifics for DHL Ecommerce, but doesn't seem exhaustive.
        // A few other (https://parcelsapp.com/en/carriers/dhl-ecommerce, https://elextensions.com/track-dhl-ecommerce-shipments-using-dhl-tracking-numbers/) places mention more explicit formats but:
        //    * also list 10-39 characters
        //    * are not authoritative
        let length = trackingNumber?.length ?? 0;
        return length >= 10 && length <= 39
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

            events.forEach(event => {
                const _event = {
                    // TODO: Events may have a 'location' which has an example value like 'Hebron, KY, US' and also 'postalCode' and 'country'. None of the example results actually include these fields.
                    address: {},
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

                if (!results.deliveredAt && _event.description && DELIVERED_TRACKING_STATUS_CODES.includes(_event.primaryEventId)) {
                    results.deliveredAt = _event.date;
                }

                if (!results.shippedAt && _event.description && SHIPPED_TRACKING_STATUS_CODES.includes(_event.primaryEventId)) {
                    results.shippedAt = _event.date;
                }

                results.events.push(_event);
            });

            // Add url to carrier tracking page
            results.url = `https://www.dhl.com/global-en/home/tracking/tracking-ecommerce.html?tracking-id=${encodeURIComponent(trackingNumber)}`;

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