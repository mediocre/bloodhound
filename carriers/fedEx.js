const async = require('async');

const request = require('request');

const checkDigit = require('../util/checkDigit');

// Remove these words from cities to turn cities like `FEDEX SMARTPOST INDIANAPOLIS` into `INDIANAPOLIS`
const CITY_BLACKLIST = /fedex|smartpost/ig;

// These tracking status codes indicate the shipment was delivered: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const DELIVERED_TRACKING_STATUS_CODES = ['DL'];

// These tracking status codes indicate the shipment was shipped (shows movement beyond a shipping label being created): https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const SHIPPED_TRACKING_STATUS_CODES = ['AR', 'DP', 'IT', 'OD'];

// The events from these tracking status codes are filtered because their timestamps are nonsensical: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const TRACKING_STATUS_CODES_BLACKLIST = ['PU', 'PX'];

let fedex_credentials = undefined;

function FedEx(options) {
    this.authenticate = function(callback) {
        if (fedex_credentials?.access_token && fedex_credentials?.expires_at < Date.now()) {
            return callback();
        }

        let trackOptions = {
            form: {
                grant_type: 'client_credentials',
                client_id: options.api_key,
                client_secret: options.secret_key
            },
            method: 'POST',
            url: `${options.url}/oauth/token`
        };

        request(trackOptions, function(err, response, body) {
            if (err) {
                return callback(err);
            }

            let credentials = JSON.parse(body);
            credentials.expires_at = Date.now() + ((credentials.expires_in - 100) * 1000);

            fedex_credentials = credentials;
            return callback();
        });
    };

    this.isTrackingNumberValid = function(trackingNumber) {
        // Remove whitespace
        trackingNumber = trackingNumber.replace(/\s/g, '');

        if ([/^6129\d{16}$/, /^7489\d{16}$/, /^926129\d{16}$/, /^927489\d{16}$/].some(regex => regex.test(trackingNumber))) {
            return true;
        }

        if (/^02\d{18}$/.test(trackingNumber)) {
            return checkDigit(`91${trackingNumber}`, [3, 1], 10);
        }

        if (/^96\d{20}$/.test(trackingNumber)) {
            if (checkDigit(trackingNumber, [3, 1, 7], 11)) {
                return true;
            }

            if (checkDigit(trackingNumber.slice(7), [1, 3], 10)) {
                return true;
            }

            return false;
        }

        if (/^DT\d{12}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber.match(/^DT(\d{12})$/)[1], [3, 1, 7], 11);
        }

        if (/^\d{12}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber, [3, 1, 7], 11);
        }

        if (/^\d{15}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber, [1, 3], 10);
        }

        if (/^\d{20}$/.test(trackingNumber)) {
            if (checkDigit(trackingNumber, [3, 1, 7], 11)) {
                return true;
            }

            if (checkDigit(`92${trackingNumber}`, [3, 1], 10)) {
                return true;
            }

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

        this.authenticate(function(err) {
            if (err) {
                return callback(err);
            }

            const trackRequestOptions = {
                gzip: true,
                headers: {
                    Authorization: `Bearer ${fedex_credentials.access_token}`
                },
                json: {
                    includeDetailedScans: true,
                    trackingInfo: [
                        {
                            trackingNumberInfo: {
                                trackingNumber: trackingNumber
                            }
                        }
                    ]
                },
                method: 'POST',
                url: `${options.url}/track/v1/trackingnumbers`
            };

            async.retry(function(callback) {
                request(trackRequestOptions, function(err, response, trackResponse) {
                    if (err) {
                        return callback(err);
                    }

                    if (trackResponse?.output?.alerts?.length) {
                        let alerts = trackResponse.output.alerts;
                        let warnings = alerts.filter(alert => alert.alertType === 'WARNING');
                        if (warnings.length) {
                            return callback(new Error(warnings.map(warning => `${warning.code}: ${warning.message}`).join(', ')));
                        }
                    }

                    // Return if only one track detail is returned
                    if (trackResponse?.output?.completeTrackResults?.trackResults?.scanEvents?.length === 1) {
                        return callback(null, trackResponse);
                    }

                    callback(null, trackResponse);
                });
            }, function(err, trackReply) {
                if (err) {
                    return callback(err);
                }

                const results = {
                    carrier: 'FedEx',
                    events: [],
                    raw: trackReply
                };

                // Ensure track reply has events
                if (!trackReply?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents?.length) {
                    return callback(null, results);
                }

                trackReply?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents.forEach(e => {
                    if (TRACKING_STATUS_CODES_BLACKLIST.includes(e.eventType)) {
                        return;
                    }

                    const event = {
                        address: {
                            city: e?.scanLocation?.city,
                            country: e?.scanLocation?.countryCode,
                            state: e?.scanLocation?.stateOrProvinceCode,
                            zip: e?.scanLocation?.postalCode
                        },
                        date: new Date(e.date),
                        description: e.eventDescription
                    };

                    // Ensure event is after minDate (used to prevent data from reused tracking numbers)
                    if (event.date < _options.minDate) {
                        return;
                    }

                    if (e.exceptionDescription) {
                        event.details = e.exceptionDescription;
                    }

                    // Remove blacklisted words
                    if (event.address.city) {
                        event.address.city = event.address.city.replace(CITY_BLACKLIST, '').trim();
                    }

                    if (DELIVERED_TRACKING_STATUS_CODES.includes(e.eventType)) {
                        results.deliveredAt = new Date(e.date);
                    }

                    if (SHIPPED_TRACKING_STATUS_CODES.includes(e.eventType)) {
                        results.shippedAt = new Date(e.date);
                    }

                    results.events.push(event);
                });

                // Add url to carrier tracking page
                results.url = `https://www.fedex.com/apps/fedextrack/?tracknumbers=${encodeURIComponent(trackingNumber)}`;

                if (!results.shippedAt && results.deliveredAt) {
                    results.shippedAt = results.deliveredAt;
                }

                // console.log(typeof callback);
                // console.dir(callback, { color: true, depth: null });
                callback(null, results);
            });
        });
    };
}

module.exports = FedEx;