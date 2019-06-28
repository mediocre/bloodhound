const assert = require('assert');

const Bloodhound = require('../index.js');

describe('Error handling', function() {
    const bloodhound = new Bloodhound();

    it('Should return an error when a tracking number is not specified', function(done) {
        bloodhound.track(null, 'fedex', function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Tracking number is not specified.');
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it('Should return an error when a carrier is not specified', function(done) {
        bloodhound.track('449044304137821', null, function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Unknown carrier.');
            assert.strictEqual(data, undefined);

            done();
        });
    });

    it('Should return an error when a carrier is not supported', function(done) {
        bloodhound.track('449044304137821', 'foo', function(err, data) {
            assert(err);
            assert.strictEqual(err.message, 'Carrier foo is not supported.');
            assert.strictEqual(data, undefined);

            done();
        });
    });
});

describe('bloodhound.guessCarrier', function() {
    const bloodhound = new Bloodhound();

    it('Should return an error for an unknown carrier', function() {
        assert.strictEqual(bloodhound.guessCarrier('hello world'), undefined);
    });

    it('Should guess a FedEx tracking number', function() {
        assert.strictEqual(bloodhound.guessCarrier('61299998620341515252'), 'FedEx');
    });
});

describe.only('Newgistics', function() {
    it('4206336792748927005269000010615207', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4206336792748927005269000010615207', 'newgistics', function(err) {
            assert.ifError(err);
            done();
        });
    });
});

describe('USPS', function() {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        usps: {
            USERID: process.env.USERID,
            SourceId: process.env.SourceId
        }
    });

    describe('Invalid USPS Credentials', function() {
        it('should return an error for invalid USERID', function(done) {
            const bloodhound1 = new Bloodhound({
                usps: {
                    SourceId: process.env.SourceId
                }
            });
            bloodhound1.track('4204210192612927005269000027623688', 'usps', function(err) {
                assert(err);
                done();
            });
        });
        it('should return an error for invalid SourceId', function (done) {
            const bloodhound2 = new Bloodhound({
                usps: {
                    USERID: process.env.USERID
                }
            });
            bloodhound2.track('4204210192612927005269000027623688', 'usps', function (err) {
                assert(err);
                done();
            });
        });
    });

    describe('USPS Tracking', function() {
        it('should return an error for an invalid tracking number', function(done) {
            bloodhound.track('An Invalid Tracking Number', 'usps', function(err) {
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