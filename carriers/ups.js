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

    if (activitiesList.length != undefined) {
        activitiesList.forEach(activity => {
            if (activity.ActivityLocation != undefined) {
                activity.address = {
                    city:  activity.ActivityLocation.City || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.City),
                    state:  activity.ActivityLocation.StateProvinceCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.StateProvinceCode),
                    country:  activity.ActivityLocation.CountryCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.CountryCode),
                    zipcode:  activity.ActivityLocation.PostalCode || (activity.ActivityLocation.Address && activity.ActivityLocation.Address.PostalCode)
                }
                activity.location = geography.addressToString(activity.address);
            } else {
                activity.address = {
                    city: undefined,
                    state: undefined,
                    country: undefined,
                    zipcode: undefined
                }

                activity.location = undefined;
            }
        })
    } else {
        activitiesList.address = {
            city:  activitiesList.ActivityLocation.City || (activitiesList.ActivityLocation.Address && activitiesList.ActivityLocation.Address.City),
            state:  activitiesList.ActivityLocation.StateProvinceCode || (activitiesList.ActivityLocation.Address && activitiesList.ActivityLocation.Address.StateProvinceCode),
            country:  activitiesList.ActivityLocation.CountryCode || (activitiesList.ActivityLocation.Address && activitiesList.ActivityLocation.Address.CountryCode),
            zipcode:  activitiesList.ActivityLocation.PostalCode || (activitiesList.ActivityLocation.Address && activitiesList.ActivityLocation.Address.PostalCode)
        }

        activitiesList.location = geography.addressToString(activitiesList.address);
    }

    return activitiesList;
}

function filter(res) {
    const packageInfo = res.body.TrackResponse.Shipment.Package;
    var activitiesList = [];
    if(packageInfo === undefined){
        activitiesList.push(getActivities(res.body.TrackResponse.Shipment));
    } else {
        if (packageInfo.length === undefined) {
            activitiesList.push(getActivities(packageInfo));
        } else {
            packageInfo.forEach((package) => {
                activitiesList.push(getActivities(package));
            })
        }
    }
    return activitiesList;
}

function getResults(locations, callback, results, activitiesList) {
    async.mapLimit(locations, 10, function(location, callback) {
        if (location === null) {
            callback(null, null);
        } else {
            geography.parseLocation(location, function (err, address) {
                if (err || !address) {
                    return callback(err, null);
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
            let description = '';

            if (address && address.timezone) {
                timezone = address.timezone;
            }

            if (activity.Status === undefined ) {
                description = activity.Description;
            } else {
                description = activity.Status.Description;
            }

            const event = {
                address: activity.address,
                date: moment.tz(`${activity.Date} ${activity.Time}`, 'YYYYMMDD HHmmss', timezone).toDate(),
                description: description
            };

            if (DELIVERED_DESCRIPTIONS.includes(description.toUpperCase())) {
                results.deliveredAt = event.date;
            }

            if (SHIPPED_DESCRIPTIONS.includes(description.toUpperCase())) {
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

        callback(null, results);
    });
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
            request(req, function(err, res) {
                if (err) {
                    return callback(err);
                }

                if (res && res.body && !res.body.TrackResponse) {
                    if (res.body.Fault && res.body.Fault.detail && res.body.Fault.detail.Errors && res.body.Fault.detail.Errors.ErrorDetail && res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode && res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description) {
                        return callback(new Error(res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description));
                    }
                }

                callback(null, res);
            });
        }, function (err, res) {
            const results = {
                events: []
            };

            if (err) {
                if (err.message === 'No tracking information available') {
                    return callback(null, results);
                }

                return callback(err);
            }

            const activitiesList = filter(res);
            var locations = [];

            if (activitiesList[0].length === undefined) {
                locations = Array.from(new Set(activitiesList.map(activity => activity.location)));
                getResults(locations, callback, results, activitiesList);
            } else {
                activitiesList.forEach(activities => {
                    locations = Array.from(new Set(activities.map(activity => activity.location)));
                    getResults(locations, callback, results, activities);
                })
            }
        })
    }
}

module.exports = UPS;