const assert = require('assert');
const Bloodhound = require('../../index');
const USPS = require('../../carriers/usps.js')

describe('usps.isTrackingNumberValid', function() {
    const usps = new USPS();

    const validTrackingNumbers = [
        '9400111899223818218407',
        '9400 1118 9922 3818 2184 07',
        '9400 1118 9956 1482 6100 74',
        '9400 1118 9922 3837 8204 90',
        '9400 1118 9922 3837 8611 41',
        '9400 1000 0000 0000 0000 00',
        '9205 5000 0000 0000 0000 00',
        '9407 3000 0000 0000 0000 00',
        '9303 3000 0000 0000 0000 00',
        '9208 8000 0000 0000 0000 00',
        '9270 1000 0000 0000 0000 00',
        '9202 1000 0000 0000 0000 00',
        '94001 11111111111111110',
        '92055 11111111111111111',
        '94073 11111111111111111',
        '93033 11111111111111111',
        '92701 11111111111111111',
        '92088 11111111111111111',
        '92021 11111111111111111'
    ];

    it('should detect valid USPS tracking numbers', function() {
        validTrackingNumbers.forEach(trackingNumber => {
            if (!usps.isTrackingNumberValid(trackingNumber)) {
                assert.fail(`${trackingNumber} is not recognized as a valid USPS tracking number`);
            }
        });
    });
});

describe('USPS', function () {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        usps: {
            userId: process.env.USPS_USERID
        }
    });

    describe('Invalid USPS Access', function() {
        const bloodhound = new Bloodhound({
            usps: {
                baseUrl: 'https://google.com',
                userId: process.env.USPS_USERID
            }
        });

        it('should return an error for invalid URL', function (done) {
            bloodhound.track('9400111899223837861141', 'usps', function (err) {
                assert(err);
                done();
            });
        })
    });

    describe('Invalid USPS Credentials', function () {
        it('should return an error for invalid USERID', function (done) {
            const bloodhound = new Bloodhound({
                usps: {
                    userId: 'invalid'
                }
            });

            bloodhound.track('9400111899223837861141', 'usps', function (err) {
                assert(err);
                done();
            });
        });
    });

    describe('USPS Tracking', function () {
        it('should return an error for an invalid tracking number', function (done) {
            bloodhound.track('An Invalid Tracking Number', 'usps', function (err) {
                assert(err);
                done();
            });
        });

        it('should return tracking information with no errors', function (done) {
            bloodhound.track('9400111899223837861141', 'usps', function (err) {
                assert.ifError(err);
                done();
            });
        });
    });
});