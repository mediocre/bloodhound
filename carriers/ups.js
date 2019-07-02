const async = require('async');
const geography = require('../util/geography');
const moment = require('moment-timezone');
const request = require('request');

function UPS(options) {
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
                return callback(new Error(err));
            }

            const activitiesList = res.body.TrackResponse.Shipment.Package.Activity;

            const results = {
                events: []
            };

            activitiesList.forEach(activity => {
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

                // console.log(JSON.stringify(results, null, 4));
                callback(null, results);
            });
        })
    }
}

module.exports = UPS;