const assert = require('assert');

const Bloodhound = require('../../index');
const DhlEcommerceSolutions = require('../../carriers/dhlEcommerceSolutions');

describe('DHL eCommerce Solutions', function() {
    describe('dhlEcommerceSolutions.isTrackingNumberValid', function() {
        const dhlecs = new DhlEcommerceSolutions();

        const validTrackingNumbers = [
            '9312310912400000000000',
            '93999109124123456789012345'
        ];

        const invalidTrackingNumbers = [
            '9312310912300000000000',
            '9212310912432100000000'

        ];

        it('should detect valid DHL tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!dhlecs.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} is not recognized as a valid DHL tracking number`);
                }
            });
        });

        it('should not detect invalid DHL tracking numbers', function() {
            invalidTrackingNumbers.forEach(trackingNumber => {
                if (dhlecs.isTrackingNumberValid(trackingNumber)) {
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
            client_id: process.env.DHL_ECOMMERCE_SOLUTIONS_CLIENT_ID,
            client_secret: process.env.DHL_ECOMMERCE_SOLUTIONS_CLIENT_SECRET,
            environment_url: process.env.DHL_ECOMMERCE_SOLUTIONS_ENVIRONMENT_URL
        }
    });

    it('should return a valid response with no errors', function(done) {
        bloodhound.track('9361210912405749570437', 'DHL eCommerce Solutions', function(err, actual) {
            assert.ifError(err);
            done();
        });
    });
});