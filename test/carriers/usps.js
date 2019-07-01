const assert = require('assert');

const Bloodhound = require('../../index');

describe.only('USPS', function () {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        usps: {
            USPS_USERID: process.env.USPS_USERID
        }
    });

    describe('Invalid USPS Credentials', function () {
        it('should return an error for invalid USERID', function (done) {
            const bloodhound1 = new Bloodhound({
                usps: {
                    USPS_USERID: 'invalid'
                }
            });
            bloodhound1.track('4204210192612927005269000027623688', 'usps', function (err) {
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
            bloodhound.track('4204210192612927005269000027623688', 'usps', function (err) {
                assert.ifError(err);
                done();
            });
        });
    });
});