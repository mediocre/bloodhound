const assert = require('assert');

const Bloodhound = require('../index.js');

describe('Error handling', function() {
    this.timeout(20000);

    const bloodhound = new Bloodhound({
        fedEx: {
            account_number: process.env.FEDEX_ACCOUNT_NUMBER,
            environment: process.env.FEDEX_ENVIRONMENT,
            key: process.env.FEDEX_KEY,
            meter_number: process.env.FEDEX_METER_NUMBER,
            password: process.env.FEDEX_PASSWORD
        }
    });

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

    it('Should guess a USPS tracking number', function() {
        assert.strictEqual(bloodhound.guessCarrier('9400111699000271800200'), 'USPS');
    });
});