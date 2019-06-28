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
        bloodhound.track('hello world', null, function(err, data) {
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

    it('Should not return an error when a carrier is not specified but carrier can be guessed', function(done) {
        bloodhound.track('449044304137821', null, function(err) {
            assert.ifError(err);
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

describe.skip('Newgistics', function() {
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