const async = require('async');
const moment = require('moment-timezone');
const request = require('request');

const geography = require('../util/geography');

// These are all of the status descriptions related to delivery provided by UPS.
const DELIVERED_DESCRIPTIONS = ['DELIVERED', 'DELIVERED BY LOCAL POST OFFICE', 'DELIVERED TO UPS ACCESS POINT AWAITING CUSTOMER PICKUP'];

// These are all of the status descriptions related to shipping provided by UPS.
const SHIPPED_DESCRIPTIONS = ['ARRIVAL SCAN', 'DELIVERED', 'DEPARTURE SCAN', 'DESTINATION SCAN', 'ORIGIN SCAN', 'OUT FOR DELIVERY', 'OUT FOR DELIVERY TODAY', 'PACKAGE DEPARTED UPS MAIL INNOVATIONS FACILITY ENROUTE TO USPS FOR INDUCTION', 'PACKAGE PROCESSED BY UPS MAIL INNOVATIONS ORIGIN FACILITY', 'PACKAGE RECEIVED FOR PROCESSING BY UPS MAIL INNOVATIONS', 'PACKAGE RECEIVED FOR SORT BY DESTINATION UPS MAIL INNOVATIONS FACILITY', 'PACKAGE TRANSFERRED TO DESTINATION UPS MAIL INNOVATIONS FACILITY', 'PACKAGE OUT FOR POST OFFICE DELIVERY', 'PACKAGE SORTED BY POST OFFICE', 'RECEIVED BY THE POST OFFICE', 'SHIPMENT ACCEPTANCE AT POST OFFICE', 'YOUR PACKAGE IS IN TRANSIT TO THE UPS FACILITY.', 'LOADED ON DELIVERY VEHICLE'];

function getActivities(package) {
    var activitiesList = package.Activity;

    if (!Array.isArray(package.Activity)) {
        activitiesList = [package.Activity];
    } else {
        activitiesList = package.Activity;
    }

    if (activitiesList.length) {
        activitiesList.forEach(activity => {
            if (activity.ActivityLocation) {
                activity.address = {
                    city: activity.ActivityLocation.City || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.City),
                    country: activity.ActivityLocation.CountryCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.CountryCode),
                    state: activity.ActivityLocation.StateProvinceCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.StateProvinceCode),
                    zip: activity.ActivityLocation.PostalCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.PostalCode)
                }

                activity.location = geography.addressToString(activity.address);
            } else {
                activity.address = {};
                activity.location = undefined;
            }
        });

        return activitiesList;
    }
}

function UPS(options) {
    this.isTrackingNumberValid = function(trackingNumber) {
        // Remove whitespace
        trackingNumber = trackingNumber.replace(/\s/g, '');

        // https://www.ups.com/us/en/tracking/help/tracking/tnh.page
        if (/^1Z[0-9A-Z]{16}$/.test(trackingNumber)) {
            return true;
        }

        if (/^(H|T|J|K|F|W|M|Q|A)\d{10}$/.test(trackingNumber)) {
            return true;
        }

        return false;
    };

    this.track = function(trackingNumber, callback) {
        const req = {
            baseUrl: options.baseUrl || 'https://onlinetools.ups.com',
            forever: true,
            gzip: true,
            json: {
                Security: {
                    UPSServiceAccessToken: {
                        AccessLicenseNumber: options.accessKey
                    },
                    UsernameToken: {
                        Username: options.username,
                        Password: options.password
                    }
                },
                TrackRequest: {
                    InquiryNumber: trackingNumber,
                    Request: {
                        RequestAction: 'Track',
                        RequestOption: 'activity'
                    }
                }
            },
            method: 'POST',
            timeout: 5000,
            url: '/rest/Track'
        };

        async.retry(function(callback) {
            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (body && !body.TrackResponse) {
                    if (body.Fault && body.Fault.detail && body.Fault.detail.Errors && body.Fault.detail.Errors.ErrorDetail && body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode && body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description) {
                        return callback(new Error(body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description));
                    }
                }

                callback(null, body);
            });
        }, function(err, body) {
            const results = {
                events: []
            };

            if (err) {
                if (err.message === 'No tracking information available') {
                    return callback(null, results);
                }

                return callback(err);
            }

            const packageInfo = body.TrackResponse.Shipment.Package || body.TrackResponse.Shipment;
            var activitiesList = [];

            if (Array.isArray(packageInfo)) {
                activitiesList = packageInfo.map(package => getActivities(package)).flat();
            } else {
                activitiesList = getActivities(packageInfo);
            }

            async.mapLimit(Array.from(new Set(activitiesList.map(activity => activity.location))), 10, function(location, callback) {
                if (!location) {
                    callback();
                } else {
                    geography.parseLocation(location, function(err, address) {
                        if (err || !address) {
                            return callback(err);
                        }

                        address.location = location;

                        callback(null, address);
                    });
                }
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
                        date: moment.tz(`${activity.Date} ${activity.Time}`, 'YYYYMMDD HHmmss', timezone).toDate(),
                        description: activity.Description || (activity.Status && activity.Status.Description)
                    };

                    if (DELIVERED_DESCRIPTIONS.includes(event.description.toUpperCase())) {
                        results.deliveredAt = event.date;
                    }

                    if (SHIPPED_DESCRIPTIONS.includes(event.description.toUpperCase())) {
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

                // Add url to carrier tracking page
                results.url = `http://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=${encodeURIComponent(trackingNumber)}`;

                callback(null, results);
            });
        })
    }
}

module.exports = UPS;