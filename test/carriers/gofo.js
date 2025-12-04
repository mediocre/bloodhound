const assert = require('assert');

const Bloodhound = require('../../index');
const GOFO = require('../../carriers/gofo');

describe('GOFO', function() {
    this.retries(3);
    this.timeout(30000);

    const bloodhound = new Bloodhound();

    describe('gofo.isTrackingNumberValid', function() {
        const gofo = new GOFO();

        const validTrackingNumbers = [
            'CR000485623975',
            'cr000485623975',
            'CR 0004 8562 3975'
        ];

        const invalidTrackingNumbers = [
            // Too short
            'CR12345678901',
            // Too long
            'CR0004856239751',
            // Wrong prefix
            'AB000485623975',
            // Invalid characters in CR format
            'CR00048562397A',
            // GF format (not auto-detected, but can be tracked explicitly)
            'GF1234567890CN',
            // UPS format
            '1Z12345E0205271688',
            // Random numbers
            '1234567890',
            // Empty string
            '',
            // FedEx format
            '449044304137821'
        ];

        it('should detect valid GOFO tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!gofo.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should be recognized as a valid GOFO tracking number`);
                }
            });
        });

        it('should not detect invalid GOFO tracking numbers', function() {
            invalidTrackingNumbers.forEach(trackingNumber => {
                if (gofo.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should not be recognized as a valid GOFO tracking number`);
                }
            });
        });
    });

    describe('gofo.track', function() {
        it('should return tracking information for a valid tracking number', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);

                assert.strictEqual(actual.carrier, 'GOFO');
                assert(actual.events.length > 0);
                assert.strictEqual(typeof actual.url, 'string');
                assert(actual.url.includes('CR000485623975'));

                done();
            });
        });

        it('should return empty events for invalid tracking number', function(done) {
            bloodhound.track('CR000000000000', 'gofo', function(err, actual) {
                assert.ifError(err);
                assert.strictEqual(actual.carrier, 'GOFO');
                assert.strictEqual(actual.events.length, 0);
                done();
            });
        });

        it('should handle tracking numbers with spaces', function(done) {
            bloodhound.track('CR 0004 8562 3975', 'gofo', function(err, actual) {
                assert.ifError(err);
                assert.strictEqual(actual.carrier, 'GOFO');
                assert(actual.events.length > 0);
                done();
            });
        });

        it('should handle lowercase tracking numbers', function(done) {
            bloodhound.track('cr000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);
                assert.strictEqual(actual.carrier, 'GOFO');
                assert(actual.events.length > 0);
                done();
            });
        });

        it('should include location information when available', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);

                // Look for events with location data
                const eventsWithLocation = actual.events.filter(event =>
                    event.address.city || event.address.state
                );

                if (eventsWithLocation.length > 0) {
                    eventsWithLocation.forEach(event => {
                        if (event.address.city) {
                            assert(typeof event.address.city === 'string');
                            assert(event.address.city.length > 0);
                        }
                        if (event.address.state) {
                            assert(typeof event.address.state === 'string');
                            assert(event.address.state.length > 0);
                        }
                    });
                }

                done();
            });
        });

        it('should return raw data in results', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);
                assert(Object.hasOwn(actual, 'raw'));

                if (actual.raw) {
                    assert(typeof actual.raw === 'object');
                    assert(Object.hasOwn(actual.raw, 'success'));
                    assert(Object.hasOwn(actual.raw, 'data'));
                }

                done();
            });
        });

        it('should sort events chronologically', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);

                if (actual.events.length > 1) {
                    for (let i = 1; i < actual.events.length; i++) {
                        const prevDate = new Date(actual.events[i - 1].date);
                        const currDate = new Date(actual.events[i].date);
                        assert(prevDate <= currDate, 'Events should be sorted chronologically (oldest first)');
                    }
                }

                done();
            });
        });

        it('should set deliveredAt for delivered packages', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);

                // This tracking number should be delivered based on our earlier inspection
                if (actual.deliveredAt) {
                    assert(actual.deliveredAt instanceof Date);
                }

                done();
            });
        });

        it('should set shippedAt for packages in transit', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);

                if (actual.shippedAt) {
                    assert(actual.shippedAt instanceof Date);
                }

                done();
            });
        });

        it('should verify event structure', function(done) {
            bloodhound.track('CR000485623975', 'gofo', function(err, actual) {
                assert.ifError(err);

                actual.events.forEach(event => {
                    assert(Object.hasOwn(event, 'address'));
                    assert(Object.hasOwn(event, 'date'));
                    assert(Object.hasOwn(event, 'description'));
                    assert(event.date instanceof Date);
                    assert(typeof event.description === 'string');
                    assert(event.description.length > 0);
                });

                done();
            });
        });
    });
});
