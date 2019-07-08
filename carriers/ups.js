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

    this.track = function(trackingNumber, callback) {
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

            const trackDetailsList = res.body.TrackResponse;

            if(!trackDetailsList){

                if (err) {
                    return callback(err);
                } else if ((res.body.Fault.detail.Errors.ErrorDetail.SubErrorCode) ){
                    // Invalid credentials or Invalid Tracking Number
                    return callback(new Error(res.body.Fault.detail.Errors.ErrorDetail.Description));
                } else if ((res.body.Fault.detail.Errors.ErrorDetail.Severity) === 'Hard')  {
                    // No Tracking Information
                    return callback(null, results);
                }

            }

            const activitiesList = res.body.TrackResponse.Shipment.Package.Activity;

            activitiesList.reverse().forEach(activity => {
                activity.address = {
                    city: activity.ActivityLocation.Address.City,
                    state: activity.ActivityLocation.Address.StateProvinceCode,
                    country: activity.ActivityLocation.Address.CountryCode,
                    zipcode: activity.ActivityLocation.Address.PostalCode ? activity.ActivityLocation.Address.PostalCode : null
                }

                activity.location = geography.addressToString(activity.address);
            })

            const locations = Array.from(new Set(activitiesList.map(activity => activity.location)));

            async.mapLimit(locations, 10, function(location, callback) {
                geography.parseLocation(location, function (err, address) {
                    if (err) {
                        return callback(err);
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

                    if (address && address.timezone) {
                        timezone = address.timezone;
                    }

                    const event = {
                        address: activity.address,
                        date: moment.tz(`${activity.Date} ${activity.Time}`, 'YYYYMMDD HHmmss', timezone).toDate(),
                        description: activity.Status.Description
                    };

                    if (DELIVERED_DESCRIPTIONS.includes(activity.Status.Description.toUpperCase())){
                        results.deliveredAt = event.date;
                    }
                    if (SHIPPED_DESCRIPTIONS.includes(activity.Status.Description.toUpperCase())){
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
        })
    }
}

module.exports = UPS;