const async = require('async');
const moment = require('moment-timezone');
const request = require('request');
const xml2json = require('fast-xml-parser');

const geography = require('../util/geography');
const USPS = require('./usps');

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
                        RequestOption: 'activity',
                        SubVersion: '1907',
                    }
                }
            },
            method: 'POST',
            timeout: 5000,
            url: '/rest/Track'
        };

        // The REST API doesn't support UPS Mail Innovations. Use the XML API instead.
        if (usps.isTrackingNumberValid(trackingNumber)) {
            delete req.json;

            req.body = `<?xml version="1.0"?><AccessRequest xml:lang="en-US"><AccessLicenseNumber>${options.accessKey}</AccessLicenseNumber><UserId>${options.username}</UserId><Password>${options.password}</Password></AccessRequest><?xml version="1.0"?><TrackRequest xml:lang="en-US"><Request><RequestAction>Track</RequestAction><RequestOption>1</RequestOption></Request><TrackingNumber>${trackingNumber}</TrackingNumber><TrackingOption>03</TrackingOption></TrackRequest>`;
            req.url = '/ups.app/xml/Track';
        }

        async.retry(function(callback) {
            request(req, function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                // Convert XML to JSON if necessary
                if (body && body.startsWith && body.startsWith('<?xml version="1.0"?>')) {
                    body = xml2json.parse(body, { parseNodeValue: false });
                }

                if (body && !body.TrackResponse) {
                    if (body.Fault && body.Fault.detail && body.Fault.detail.Errors && body.Fault.detail.Errors.ErrorDetail && body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode && body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description) {
                        return callback(new Error(body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description));
                    }
                }

                if (body && body.TrackResponse && body.TrackResponse.Response && body.TrackResponse.Response.Error) {
                    return callback(new Error(body.TrackResponse.Response.Error.ErrorDescription))
                }

                callback(null, body);
            });
        }, function(err, body) {
            const results = {
                carrier: 'UPS',
                events: []
            };

            if (err) {
                if (usps.isTrackingNumberValid(trackingNumber)) {
                    return usps.track(trackingNumber, callback);
                }

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
                    /*
                    geography.parseLocation(location, options, function(err, address) {
                        if (err || !address) {
                            return callback(err);
                        }

                        address.location = location;

                        callback(null, address);
                    });
                     */
                    callback(null, location);
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

                    let timezone = 'UTC';

                    //if (address && address.timezone) {
                        //timezone = address.timezone;
                    //}

                    const event = {
                        address: activity.address,
                        date: moment.tz(`${activity.GMTDate} ${activity.GMTTime}`, 'YYYYMMDD HHmmss', timezone).toDate(),
                        description: activity.Description || (activity.Status && activity.Status.Description) || (activity.Status && activity.Status.StatusType && activity.Status.StatusType.Description)
                    };

                    // Ensure event is after minDate (used to prevent data from reused tracking numbers)
                    if (event.date < _options.minDate) {
                        return;
                    }

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
