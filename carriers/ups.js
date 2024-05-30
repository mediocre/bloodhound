const async = require('async');
const moment = require('moment-timezone');
const request = require('request');
const xml2json = require('fast-xml-parser');

const geography = require('../util/geography');
const USPS = require('./usps');

function getActivities(package) {
    var activitiesList = package.activity;

    if (!Array.isArray(package.activity)) {
        activitiesList = [package.activity];
    }

    // Filter undefined activities
    activitiesList = activitiesList.filter(a => a);

    if (activitiesList.length) {
        activitiesList.forEach(activity => {
            if (activity.activityLocation) {
                activity.address = {
                    city: activity.activityLocation.city || (activity.activityLocation.address && activity.activityLocation.address.city),
                    country: activity.activityLocation.countryCode || (activity.activityLocation.address && activity.activityLocation.Address.countryCode),
                    state: activity.activityLocation.stateProvinceCode || (activity.activityLocation.address && activity.activityLocation.address.stateProvinceCode),
                    zip: activity.activityLocation.postalCode || (activity.activityLocation.address && activity.activityLocation.address.postalCode)
                }

                if ((activity.address.city && activity.address.state) || activity.address.zip) {
                    activity.location = geography.addressToString(activity.address);
                }
            } else {
                activity.address = {};
                activity.location = undefined;
            }
        });

        return activitiesList;
    }
}

function makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function UPS(options) {
    const usps = new USPS(options && options.usps);

    this.isTrackingNumberValid = function(trackingNumber) {
        // Remove whitespace
        trackingNumber = trackingNumber.replace(/\s/g, '');
        trackingNumber = trackingNumber.toUpperCase();

        // https://www.ups.com/us/en/tracking/help/tracking/tnh.page
        if (/^1Z[0-9A-Z]{16}$/.test(trackingNumber)) {
            return true;
        }

        if (/^(H|T|J|K|F|W|M|Q|A)\d{10}$/.test(trackingNumber)) {
            return true;
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

        const transId = makeId(25);

        const baseUrl = options.baseUrl || 'https://onlinetools.ups.com';

        const req = {
            'method': 'GET',
            'url': `${baseUrl}/api/track/v1/details/${trackingNumber}?locale=en_US&returnSignature=false&returnMilestones=false&returnPOD=false`,
            'headers': {
                'transId': `${transId}`,
                'transactionSrc': `${options.applicationName}`,
                'Authorization': `Bearer ${options.token}`
            }
        };

        console.log(req);

        async.retry(function(callback) {
            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                console.log('body', body);

                body = JSON.parse(body);

                if (body && !body.trackResponse) {
                    if (body?.fault?.detail?.errors?.errorDetail?.primaryErrorCode?.description) {
                        return callback(new Error(body.fault.detail.errors.errorDetail.primaryErrorCode.description));
                    } else {
                        return callback(new Error('Invalid or missing trackResponse'));
                    }
                }

                if (body?.trackResponse?.response?.error) {
                    return callback(new Error(body.trackResponse.response.error.errorDescription))
                }

                callback(null, body);
            });
        }, function(err, body) {
            const results = {
                carrier: 'UPS',
                events: [],
                raw: body
            };

            if (err) {
                if (options.usps && usps.isTrackingNumberValid(trackingNumber)) {
                    return usps.track(trackingNumber, _options, callback);
                }

                if (err.message === 'No tracking information available') {
                    return callback(null, results);
                }

                return callback(err);
            }

            const packageInfo = body?.trackResponse?.shipment?.package ?? body.trackResponse.shipment;
            var activitiesList = [];

            if (Array.isArray(packageInfo)) {
                activitiesList = packageInfo.map(package => getActivities(package)).flat();
            } else {
                activitiesList = getActivities(packageInfo);
            }

            // Filter undefined activities
            activitiesList = activitiesList.filter(a => a);

            // UPS Mail Innovations doesn't import USPS data reliably. Fallback to USPS when UPS doesn't provide enough data.
            if (options.usps && activitiesList.length <= 1 && usps.isTrackingNumberValid(trackingNumber)) {
                return usps.track(trackingNumber, _options, callback);
            }

            // Get the activity locations for all activities that don't have a GMTDate or GMTTime
            async.mapLimit(Array.from(new Set(activitiesList.filter(activity => (!activity.gmtDate || !activity.gmtTime) && activity.location).map(activity => activity.location))), 10, function(location, callback) {
                geography.parseLocation(location, options, function(err, address) {
                    if (err || !address) {
                        return callback(err);
                    }

                    address.location = location;

                    callback(null, address);
                });
            }, function(err, addresses) {
                if (err) {
                    return callback(err);
                }

                let address = null;

                activitiesList.forEach(activity => {
                    if (addresses) {
                        address = addresses.find(a => a && a.location === activity.location);
                    }

                    let timezone = 'America/New_York';

                    if (address && address.timezone) {
                        timezone = address.timezone;
                    }

                    const event = {
                        address: activity.address,
                        description: activity.description || (activity.status && activity.status.description) || (activity.status && activity.status.statusType && activity.status.statusType.description)
                    };

                    if (activity.gmtDate && activity.gmtTime) {
                        event.date = moment.tz(`${activity.gmtDate} ${activity.gmtTime}`, 'YYYY-MM-DD HH.mm.ss', 'UTC').toDate();
                    } else {
                        event.date = moment.tz(`${activity.date} ${activity.time}`, 'YYYYMMDD HHmmss', timezone).toDate();
                    }

                    // Ensure event is after minDate (used to prevent data from reused tracking numbers)
                    if (event.date < _options.minDate) {
                        return;
                    }

                    if (activity.status && activity.status.type === 'D' || activity.status && activity.status.statusType && activity.status.statusType.code === 'D' || activity.status && activity.status.statusCode && activity.status.statusCode.code === 'D') {
                        results.deliveredAt = event.date;
                    } else if (activity.status && activity.status.type === 'I' || activity.status && activity.status.statusType && activity.status.statusType.code === 'I' || activity.status && activity.status.statusCode && activity.status.statusCode.code === 'I') {
                        results.shippedAt = event.date;
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

                // Add URL to carrier tracking page
                results.url = `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;

                if (!results.shippedAt && results.deliveredAt) {
                    results.shippedAt = results.deliveredAt;
                }

                callback(null, results);
            });
        })
    }
}

module.exports = UPS;
