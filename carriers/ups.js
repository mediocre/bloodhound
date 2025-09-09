const async = require('async');
const moment = require('moment-timezone');
const UPS = require('@mediocre/ups');

const geography = require('../util/geography');
const USPS = require('./usps');

function getActivities(package) {
    var activitiesList = package.Activity;

    if (!Array.isArray(package.Activity)) {
        activitiesList = [package.Activity];
    }

    // Filter undefined activities
    activitiesList = activitiesList.filter(a => a);

    if (activitiesList.length) {
        activitiesList.forEach(activity => {
            if (activity.ActivityLocation) {
                activity.address = {
                    city: activity.ActivityLocation.City || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.City),
                    country: activity.ActivityLocation.CountryCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.CountryCode),
                    state: activity.ActivityLocation.StateProvinceCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.StateProvinceCode),
                    zip: activity.ActivityLocation.PostalCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.PostalCode)
                };

                if ((activity.address.city && activity.address.state) || activity.address.zip) {
                    activity.location = geography.addressToString(activity.address);
                }
            } else {
                activity.address = {};
                activity.location = undefined;
            }
        });
    }

    return activitiesList;
}

module.exports = function(options) {
    const ups = new UPS(options?.ups);
    const usps = new USPS(options?.usps);

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

    this.track = async function(trackingNumber, _options, callback) {
        // Options are optional
        if (typeof _options === 'function') {
            callback = _options;
            _options = {};
        }

        if (!_options.minDate) {
            _options.minDate = new Date(0);
        }

        try {
            const trackingData = await ups.track(trackingNumber, _options);

            const results = {
                carrier: 'UPS',
                events: [],
                raw: trackingData
            };

            callback(null, results);
        } catch (err) {
            if (options.usps && usps.isTrackingNumberValid(trackingNumber)) {
                return usps.track(trackingNumber, _options, callback);
            }

            callback(err);
        }


        async.retry(function(callback) {

        }, function(err, body) {
            


            if (err) {
                if (options.usps && usps.isTrackingNumberValid(trackingNumber)) {
                    return usps.track(trackingNumber, _options, callback);
                }

                if (err.message === 'No tracking information available') {
                    return callback(null, results);
                }

                return callback(err);
            }

            const packageInfo = body?.TrackResponse?.Shipment?.Package ?? body.TrackResponse.Shipment;

            // Add estimatedDeliveryDate if DeliveryDetail.Date is present
            if (packageInfo?.DeliveryDetail?.Date) {
                const dateStr = packageInfo.DeliveryDetail.Date;
                const isoDate = new Date(
                    `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}T00:00:00Z`
                );
                results.estimatedDeliveryDate = {
                    earliest: isoDate,
                    latest: isoDate
                };
            }

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
            async.mapLimit(Array.from(new Set(activitiesList.filter(activity => (!activity.GMTDate || !activity.GMTTime) && activity.location).map(activity => activity.location))), 10, function(location, callback) {
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
                        description: activity.Description || (activity.Status && activity.Status.Description) || (activity.Status && activity.Status.StatusType && activity.Status.StatusType.Description)
                    };

                    if (activity.GMTDate && activity.GMTTime) {
                        event.date = moment.tz(`${activity.GMTDate} ${activity.GMTTime}`, 'YYYY-MM-DD HH.mm.ss', 'UTC').toDate();
                    } else {
                        event.date = moment.tz(`${activity.Date} ${activity.Time}`, 'YYYYMMDD HHmmss', timezone).toDate();
                    }

                    // Ensure event is after minDate (used to prevent data from reused tracking numbers)
                    if (event.date < _options.minDate) {
                        return;
                    }

                    if (activity.Status && activity.Status.Type === 'D' || activity.Status && activity.Status.StatusType && activity.Status.StatusType.Code === 'D' || activity.Status && activity.Status.StatusCode && activity.Status.StatusCode.Code === 'D') {
                        results.deliveredAt = event.date;
                    } else if (activity.Status && activity.Status.Type === 'I' || activity.Status && activity.Status.StatusType && activity.Status.StatusType.Code === 'I' || activity.Status && activity.Status.StatusCode && activity.Status.StatusCode.Code === 'I') {
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
        });
    };
};