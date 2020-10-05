const assert = require('assert');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('DHL', function() {
    describe('dhl.isTrackingNumberValid', function() {
        const dhl = new DHL();

        const validTrackingNumbers = [
            '9361269903500576940071',
            '9361269903503907020237',
            '9361 2699 0350 3907 2657 75',
            '9261293148703201610999',
            '9261293148703201610975',
            '9261 2931 4870 3201 6109 82',
            '9474812901015476250258',
            '9374869903503907077381',
            '9374869903503907060802',
            '9374 8699 0350 3906 9887 18',
            '9274893148703201609685',
            '9274893148703201609715',
            '9274 8931 4870 3201 6096 92',
            '420941339405511899223428669715',
            '420206039405511899223428471196',
            '4203 7398 9405 5118 9922 3427 4906 00',
            '4204923092748927005269000022418209',
            '4209081092748927005269000022418407',
            '4200681292612927005269000029934812',
            '4209 2155 1234 9505 5000 2071 4300 0001 28'
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

    const bloodhound = new Bloodhound();

    it.skip('should return a valid response with no errors', function(done) {
        bloodhound.track('9374869903505547215208', 'dhl', function(err, actual) {
            assert.ifError(err);
            done();
        });
    });
});