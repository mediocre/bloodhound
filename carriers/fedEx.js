const async = require('async');
const FedExClient = require('shipping-fedex');

const checkDigit = require('../util/checkDigit');

// Remove these words from cities to turn cities like `FEDEX SMARTPOST INDIANAPOLIS` into `INDIANAPOLIS`
const CITY_BLACKLIST = /fedex|smartpost/ig;

// These tracking status codes indicate the shipment was delivered: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const DELIVERED_TRACKING_STATUS_CODES = ['DL'];

// These tracking status codes indicate the shipment was shipped (shows movement beyond a shipping label being created): https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const SHIPPED_TRACKING_STATUS_CODES = ['AR', 'DP', 'IT', 'OD'];

// The events from these tracking status codes are filtered because their timestamps are nonsensical: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Statusbc-5&rhtocid=_26_0_4
const TRACKING_STATUS_CODES_BLACKLIST = ['PU', 'PX'];

function FedEx(options) {
    const fedExClient = new FedExClient(options);

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

    this.track = function(trackingNumber, callback) {
        // Create a FedEx track request: https://www.fedex.com/us/developer/webhelp/ws/2018/US/index.htm#t=wsdvg%2FTracking_Shipments.htm%23Tracking_Service_Optionsbc-3&rhtocid=_26_0_2
        const trackRequest = {
            SelectionDetails: {
                PackageIdentifier: {
                    Type: 'TRACKING_NUMBER_OR_DOORTAG',
                    Value: trackingNumber
                }
            },
            ProcessingOptions: 'INCLUDE_DETAILED_SCANS'
        };

        // FedEx Web Services requests occasionally fail. Timeout after 5 seconds and retry.
        async.retry(function(callback) {
            async.timeout(fedExClient.track, 5000)(trackRequest, function(err, trackReply) {
                if (err) {
                    return callback(err);
                }

                if (trackReply.HighestSeverity === 'ERROR') {
                    return callback(new Error(trackReply.Notifications[0].Message));
                }

                callback(null, trackReply);
            });
        }, function(err, trackReply) {
            if (err) {
                return callback(err);
            }

            const results = {
                carrier: 'FedEx',
                events: []
            };

            // Ensure track reply has events
            if (!trackReply.CompletedTrackDetails || !trackReply.CompletedTrackDetails.length || !trackReply.CompletedTrackDetails[0] || !trackReply.CompletedTrackDetails[0].TrackDetails || !trackReply.CompletedTrackDetails[0].TrackDetails.length || !trackReply.CompletedTrackDetails[0].TrackDetails[0] || !trackReply.CompletedTrackDetails[0].TrackDetails[0].Events || !trackReply.CompletedTrackDetails[0].TrackDetails[0].Events.length) {
                return callback(null, results);
            }

            trackReply.CompletedTrackDetails[0].TrackDetails[0].Events.forEach(e => {
                if (TRACKING_STATUS_CODES_BLACKLIST.includes(e.EventType)) {
                    return;
                }

                if (DELIVERED_TRACKING_STATUS_CODES.includes(e.EventType)) {
                    results.deliveredAt = new Date(e.Timestamp);
                }

                if (SHIPPED_TRACKING_STATUS_CODES.includes(e.EventType)) {
                    results.shippedAt = new Date(e.Timestamp);
                }

                const event = {
                    address: {
                        city: e.Address.City,
                        country: e.Address.CountryCode,
                        state: e.Address.StateOrProvinceCode,
                        zip: e.Address.PostalCode
                    },
                    date: new Date(e.Timestamp),
                    description: e.EventDescription
                };

                if (e.StatusExceptionDescription) {
                    event.details = e.StatusExceptionDescription;
                }

                // Remove blacklisted words
                if (event.address.city) {
                    event.address.city = event.address.city.replace(CITY_BLACKLIST, '').trim();
                }

                results.events.push(event);
            });

            // Add url to carrier tracking page
            results.url = `https://www.fedex.com/apps/fedextrack/?tracknumbers=${encodeURIComponent(trackingNumber)}`;

            if (!results.shippedAt) {
                results.shippedAt = results.deliveredAt;
            }

            callback(null, results);
        });
    }
}

module.exports = FedEx;