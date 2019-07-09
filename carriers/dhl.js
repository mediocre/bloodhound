const async = require('async');
const request = require('request');

function DHL(options) {
    this.isTrackingNumberValid = function(trackingNumber) {
        return false;
    };

    this.track = function(trackingNumber, callback) {
        const req = {
            url: `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
            method: 'GET',
            headers: {
                'DHL-API-Key': `${options.DHL_API_Key}`
            },
            timeout: 5000
        };

        async.retry(function(callback) {
            request(req, callback);
        }, function(err, trackingResponse) {
            if (err) {
                return callback(err);
            }

            // console.log(JSON.stringify(JSON.parse(trackingResponse.body), null, 4));

            const results = {
                events: []
            };

            callback(null, results);
        });
    }
}

module.exports = DHL;