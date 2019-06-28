const assert = require('assert');

const geography = require('../../util/geography');

describe('geography.addressToString', function() {
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
});