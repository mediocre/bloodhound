const assert = require('assert');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('DHL', function() {
    describe('dhl.isTrackingNumberValid', function() {
        const dhl = new DHL();

        const validTrackingNumbers = [
            '420726449361210912400330222910'
        ];

        const invalidTrackingNumbers = [
            '9970 4895 0367 429',
            'DT771613423732',
            '9400 1118 9922 3818 2184 07'
        ];

        it('should detect valid DHL tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!dhl.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} is not recognized as a valid DHL tracking number`);
                }
            });
        });

        it('should not detect invalid DHL tracking numbers', function() {
            invalidTrackingNumbers.forEach(trackingNumber => {
                if (dhl.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should not be recognized as a valid DHL tracking number`);
                }
            });
        });
    });
});

describe('dhl.track', function() {
    this.timeout(10000);

    it.skip('should return a valid response with no errors', function(done) {
        const bloodhound = new Bloodhound({
            dhl: {
                apiKey: process.env.DHL_API_KEY
            }
        });

        bloodhound.track('420726449361210912400330222910', 'dhl', function(err, actual) {
            assert.ifError(err);
            assert.equal('DHL', actual.carrier);
            done();
        });
    });

    it('should fall through to DHL eCommerce solutions and return a response with no errors when DHL UTAPI fails', function(done) {
        const bloodhound = new Bloodhound({
            dhlEcommerceSolutions: {
                client_id: process.env.DHL_ECOMMERCE_SOLUTIONS_CLIENT_ID,
                client_secret: process.env.DHL_ECOMMERCE_SOLUTIONS_CLIENT_SECRET,
                environment_url: process.env.DHL_ECOMMERCE_SOLUTIONS_ENVIRONMENT_URL
            }
        });

        bloodhound.track('420726449361210912400330222910', 'dhl', function(err, actual) {
            assert.ifError(err);
            assert.equal('DHL eCommerce Solutions', actual.carrier);
            done();
        });
    });

    it('should fall through to USPS and return a response with no errors when DHL UTAPI fails', function(done) {
        const bloodhound = new Bloodhound({
            usps: {
                userId: process.env.USPS_USERID
            }
        });

        bloodhound.track('420726449361210912400330222910', 'dhl', function(err, actual) {
            assert.ifError(err);
            assert.equal('USPS', actual.carrier);
            done();
        });
    });

    it('should fall through to USPS and return a response with no errors when DHL eCommerce Solutions fails', function(done) {
        const bloodhound = new Bloodhound({
            dhlEcommerceSolutions: {
                client_id: '12345678901234567890123456789012',
                client_secret: '1234567890123456',
                environment_url: 'https://api-sandbox.dhlecs.com'
            },
            usps: {
                userId: process.env.USPS_USERID
            }
        });

        bloodhound.track('420726449361210912400330222910', 'dhl', function(err, actual) {
            assert.ifError(err);
            assert.equal('USPS', actual.carrier);
            done();
        });
    });
});