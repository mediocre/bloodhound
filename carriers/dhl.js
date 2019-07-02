const async = require('async');
const request = require('request');

function DHL(options) {
    const baseUrl = options.baseUrl || 'https://xmlpi-ea.dhl.com';

    this.isTrackingNumberValid = function(trackingNumber) {
        return false;
    };

    this.track = function(trackingNumber, callback) {
        const body = `
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <req:KnownTrackingRequest xmlns:req="http://www.dhl.com">
                <Request>
                    <ServiceHeader>
                        <SiteID>${options.siteId}</SiteID>
                        <Password>${options.password}</Password>
                    </ServiceHeader>
                </Request>
                <LanguageCode>en</LanguageCode>
                <AWBNumber>${trackingNumber}</AWBNumber>
                <LevelOfDetails>ALL_CHECK_POINTS</LevelOfDetails>
            </req:KnownTrackingRequest>
        `;

        const req = {
            baseUrl,
            body,
            method: 'POST',
            timeout: 5000,
            url: '/XMLShippingServlet'
        };

        async.retry(function(callback) {
            request(req, callback);
        }, function(err, trackingResponse) {
            if (err) {
                return callback(err);
            }

            console.log(trackingResponse);

            const results = {
                events: []
            };

            callback(null, results);
        });
    }
}

module.exports = DHL;