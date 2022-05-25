const assert = require('assert');

const Bloodhound = require('../../index');
const DhlEcommerceSolutions = require('../../carriers/dhlEcommerceSolutions');

describe('DHL eCommerce Solutions', function() {
    describe('dhlEcommerceSolutions.isTrackingNumberValid', function() {
        const dhlecs = new DhlEcommerceSolutions();

        const validTrackingNumbers = [
            '1234567890',
            '123456789012345678901234567890123456789'
        ];

        const invalidTrackingNumbers = [
            '123456789',
            '1234567890123456789012345678901234567890'

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
        usps: {
            userId: process.env.USPS_USERID
        }
    });

    it.skip('should return a valid response with no errors', function(done) {
        bloodhound.track('9361269903505749570437', 'DHL eCommerce Solutions', function(err, actual) {
            assert.ifError(err);
            done();
        });
    });
});