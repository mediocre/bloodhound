const assert = require('assert');

const NodeGeocoder = require('node-geocoder');

const geography = require('../../util/geography');

describe('geography.addressToString', function() {
    it('New York', function() {
        const address = {
            city: 'New York'
        };

        assert.strictEqual(geography.addressToString(address), 'New York');
    });

    it('NY', function() {
        const address = {
            state: 'NY'
        };

        assert.strictEqual(geography.addressToString(address), 'NY');
    });

    it('New York, NY', function() {
        const address = {
            city: 'New York',
            state: 'NY'
        };

        assert.strictEqual(geography.addressToString(address), 'New York, NY');
    });

    it('New York, NY 10001', function() {
        const address = {
            city: 'New York',
            state: 'NY',
            zip: '10001'
        };

        assert.strictEqual(geography.addressToString(address), 'New York, NY 10001');
    });

    it('New York, NY 10001, US', function() {
        const address = {
            city: 'New York',
            country: 'US',
            state: 'NY',
            zip: '10001'
        };

        assert.strictEqual(geography.addressToString(address), 'New York, NY 10001, US');
    });

    it('US', function() {
        const address = {
            country: 'US'
        };

        assert.strictEqual(geography.addressToString(address), 'US');
    });
});

describe('geography.parseLocation', function() {
    this.timeout(15000);

    it('New York NY', function(done) {
        geography.parseLocation('New York NY', function(err, actual) {
            assert.ifError(err);

            const expected = {
                city: 'NYC',
                state: 'NY',
                timezone: 'America/New_York'
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });

    it('O FALLON, MO', function(done) {
        geography.parseLocation('O FALLON, MO', function(err, actual) {
            assert.ifError(err);

            assert.strictEqual(actual, undefined);
            done();
        });
    });
});

describe('petty-cache', function() {
    this.timeout(15000);

    it('should store results in Redis (via petty-cache)', function(done) {
        geography.parseLocation('Carrollton, TX', { pettyCache: {} }, function(err, actual) {
            assert.ifError(err);

            const expected = {
                city: 'Carrollton',
                location: 'Carrollton, TX',
                state: 'TX',
                timezone: 'America/Chicago'
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });

    it('should store results in Redis (via petty-cache)', function(done) {
        geography.parseLocation('Lake Saint Louis, MO', { pettyCache: {} }, function(err, actual) {
            assert.ifError(err);

            const expected = {
                city: 'Lake Saint Louis',
                state: 'MO',
                timezone: 'America/Chicago'
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});

describe('Google geocoder', function() {
    var geocoder;

    after(function() {
        geography.geocoder = geocoder;
    });

    before(function() {
        geocoder = geography.geocoder;
        geography.geocoder = NodeGeocoder({ apiKey: process.env.GOOGLE_API_KEY, language: 'en', provider: 'google', region: '.us' });
    });

    it('Los Angeles, CA', function(done) {
        geography.parseLocation('Los Angeles, CA', function(err, actual) {
            assert.ifError(err);

            const expected = {
                city: 'Los Angeles',
                state: 'CA',
                timezone: 'America/Los_Angeles'
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});