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
            DHL_API_Key: process.env.DHL_API_Key
        }
    });

    it.only('DHL', function(done) {
        bloodhound.track('9274893148703201610940', 'dhl', function(err, actual) {
            assert.ifError(err);
            console.log(actual);

            const expected = {
            };

            // assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});