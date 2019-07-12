const async = require('async');
const geography = require('../util/geography');
const moment = require('moment-timezone');
const request = require('request');
const confirmUpsFreight = require('../util/confirmUpsFreight');
const confirmUps = require('../util/confirmUps');

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
                    city: activity.ActivityLocation.Address === undefined ? (activity.ActivityLocation.City === undefined ? '' : activity.ActivityLocation.City) : (activity.ActivityLocation.Address.City === undefined ? '' : activity.ActivityLocation.Address.City),
                    state: activity.ActivityLocation.Address === undefined ? (activity.ActivityLocation.StateProvinceCode === undefined ? '' : activity.ActivityLocation.StateProvinceCode) : (activity.ActivityLocation.Address.StateProvinceCode === undefined ? '' : activity.ActivityLocation.Address.StateProvinceCode),
                    country: activity.ActivityLocation.Address === undefined ? (activity.ActivityLocation.CountryCode === undefined ? '' : activity.ActivityLocation.CountryCode) : (activity.ActivityLocation.Address.CountryCode === undefined ? '' : activity.ActivityLocation.Address.CountryCode),
                    zipcode: activity.ActivityLocation.Address === undefined ? (activity.ActivityLocation.PostalCode === undefined ? '' : activity.ActivityLocation.PostalCode) : (activity.ActivityLocation.Address.PostalCode === undefined ? '' : activity.ActivityLocation.Address.PostalCode)
                }
                activity.location = geography.addressToString(activity.address);
            } else {
                activity.address = {
                    city: '',
                    state: '',
                    country: '',
                    zipcode: ''
                }

                activity.location = '';
            }
        })
    } else {
        activitiesList.address = {
            city: activitiesList.ActivityLocation.Address === undefined ? (activitiesList.ActivityLocation.City === undefined ? '' : activitiesList.ActivityLocation.City) : (activitiesList.ActivityLocation.Address.City === undefined ? '' : activitiesList.ActivityLocation.Address.City),
            state: activitiesList.ActivityLocation.Address === undefined ? (activitiesList.ActivityLocation.StateProvinceCode === undefined ? '' : activitiesList.ActivityLocation.StateProvinceCode) : (activitiesList.ActivityLocation.Address.StateProvinceCode === undefined ? '' : activitiesList.ActivityLocation.Address.StateProvinceCode),
            country: activitiesList.ActivityLocation.Address === undefined ? (activitiesList.ActivityLocation.CountryCode === undefined ? '' : activitiesList.ActivityLocation.CountryCode) : (activitiesList.ActivityLocation.Address.CountryCode === undefined ? '' : activitiesList.ActivityLocation.Address.CountryCode),
            zipcode: activitiesList.ActivityLocation.Address === undefined ? (activitiesList.ActivityLocation.PostalCode === undefined ? '' : activitiesList.ActivityLocation.PostalCode) : (activitiesList.ActivityLocation.Address.PostalCode === undefined ? '' : activitiesList.ActivityLocation.Address.PostalCode)
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
        geography.parseLocation(location, function (err, address) {
            if (err || !address) {
                return callback(err, '');
            }
            address.location = location;

            callback(null, address);
        });
    }, function (err, addresses) {
        if (err) {
            return callback(err);
        }

        activitiesList.forEach(activity => {
            const address = addresses.find(a => a.location === activity.location);
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

            if (DELIVERED_DESCRIPTIONS.includes(description.toUpperCase())){
                results.deliveredAt = event.date;
            }
            if (SHIPPED_DESCRIPTIONS.includes(description.toUpperCase())){
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
        // https://www.codeproject.com/Articles/21224/Calculating-the-UPS-Tracking-Number-Check-Digit
        if (/^1Z[0-9A-Z]{16}$/.test(trackingNumber)) {
            if (confirmUps(trackingNumber)){
                return true;
            }
        }
        if (/^(H|T|J|K|F|W|M|Q|A)\d{10}$/.test(trackingNumber)) {
            if (confirmUpsFreight(trackingNumber)){
                return true;
            }
        }

        return false;
    };

    this.track = function (trackingNumber, callback) {
        const baseUrl = options.baseUrl || 'https://onlinetools.ups.com/rest/Track';

        request.post(baseUrl, {
            json: {
                Security: {
                    UsernameToken: {
                        Username: options.UPS_USERNAME,
                        Password: options.UPS_PASSWORD
                    },
                    UPSServiceAccessToken: {
                        AccessLicenseNumber: options.UPS_ACCESS_KEY
                    }
                },
                TrackRequest: {
                    Request: {
                        RequestAction: 'Track',
                        RequestOption: 'activity'
                    },
                    InquiryNumber: trackingNumber
                }
            }
        }, function (err, res) {
            if (err) {
                return callback(err);
            }
            const results = {
                events: []
            };

            if (res.body.TrackResponse === undefined){
                if (res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Code === '250002' ){
                    // Invalid credentials
                    return callback(new Error(res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description));
                } else if ((res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Code) === '150022' || (res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Code) === '151018'){
                    // Invalid Tracking Number
                    return callback(new Error(res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description));
                } else if ((res.body.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Code) === '151044')  {
                    // No Tracking Information
                    return callback(null, results);
                }
            }
            const activitiesList = filter(res);
            var locations = [];

            if (activitiesList[0].length === undefined){
                locations = Array.from(new Set(activitiesList.map(activity => activity.location)));
                getResults(locations, callback, results, activitiesList);
            } else {
                activitiesList.forEach((activities) => {
                    locations = Array.from(new Set(activities.map(activity => activity.location)));
                    getResults(locations, callback, results, activities);
                })
            }
        })
    }
}

module.exports = UPS;