const assert = require('assert');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('dhl.isTrackingNumberValid', function() {
    const dhl = new DHL();

    const validTrackingNumbers = [

    ];

    it('should detect valid DHL tracking numbers', function() {
        validTrackingNumbers.forEach(trackingNumber => {
            if (!dhl.isTrackingNumberValid(trackingNumber)) {
                assert.fail(`${trackingNumber} is not recognized as a valid DHL tracking number`);
            }
        });
    });
});

describe('dhl.track', function() {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        dhl: {
            siteId: process.env.DHL_SITE_ID,
            password: process.env.DHL_PASSWORD
        }
    });

    it('DHL', function(done) {
        bloodhound.track('', 'dhl', function(err, actual) {
            assert.ifError(err);

            const expected = {
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});