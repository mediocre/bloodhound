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

describe.skip('dhl.track', function() {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        dhl: {
            apiKey: process.env.DHL_API_KEY
        }
    });

    it('should return a valid response with no errors', function(done) {
        bloodhound.track('420726449361210912400330222910', 'dhl', function(err, actual) {
            console.log(actual);
            assert.ifError(err);
            done();
        });
    });
});