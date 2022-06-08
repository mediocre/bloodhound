const assert = require('assert');

const Bloodhound = require('../../index');
const DhlEcommerceSolutions = require('../../carriers/dhlEcommerceSolutions');

describe('DHL eCommerce Solutions', function() {
    describe('dhlEcommerceSolutions.isTrackingNumberValid', function() {
        const dhlEcommerceSolutions = new DhlEcommerceSolutions({
            client_id: process.env.DHL_ECOMMERCE_CLIENT_ID,
            client_secret: process.env.DHL_ECOMMERCE_CLIENT_SECRET,
            environment_url: process.env.DHL_ECOMMERCE_SOLUTIONS_ENVIRONMENT_URL
        });

        const validTrackingNumbers = [
            '420726449361210912400330222910'
        ];

        const invalidTrackingNumbers = [
            '9970 4895 0367 429',
            'DT771613423732',
            '9400 1118 9922 3818 2184 07'
        ];

        it('should detect valid DHL eCommerce Solutions tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!dhlEcommerceSolutions.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} is not recognized as a valid DHL tracking number`);
                }
            });
        });

        it('should not detect invalid DHL eCommerce Solutions tracking numbers', function() {
            invalidTrackingNumbers.forEach(trackingNumber => {
                if (dhlEcommerceSolutions.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should not be recognized as a valid DHL tracking number`);
                }
            });
        });
    });
});

describe('dhlEcommerceSolutions.track', function() {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        dhlEcommerceSolutions: {
            client_id: process.env.DHL_ECOMMERCE_CLIENT_ID,
            client_secret: process.env.DHL_ECOMMERCE_CLIENT_SECRET,
            environment_url: process.env.DHL_ECOMMERCE_SOLUTIONS_ENVIRONMENT_URL
        }
    });

    it('should return a valid response with no errors', function(done) {
        bloodhound.track('420726449361210912400330222910', 'dhl', function(err) {
            assert.ifError(err);
            assert.equal('DHL eCommerce Solutions', actual.carrier);
            done();
        });
    });
});