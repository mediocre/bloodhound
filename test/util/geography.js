const assert = require('assert');

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
    this.timeout(10000);

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