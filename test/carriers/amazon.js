const assert = require('assert');
const Bloodhound = require('../../index');
const Amazon = require('../../carriers/amazon');

describe('Amazon', function() {
    this.timeout(30000);

    beforeEach(function(done) {
        // Rate limiting to avoid overwhelming Amazon's API
        setTimeout(() => {
            done();
        }, 2000);
    });

    const bloodhound = new Bloodhound();

    describe('amazon.isTrackingNumberValid', function() {
        const amazon = new Amazon();

        const validTrackingNumbers = [
            'TBA321677302718',
            'TBA123456789012',
            'TBM123456789012',
            'TBC123456789012',
            'TBA 3216 7730 2718',
            'tba321677302718'
        ];

        const invalidTrackingNumbers = [
            // Too short (12 chars total, only 9 after TBA)
            'TBA123456789',
            // Too long (>16 after TB)
            'TBA123456789012345678901',
            // Invalid second letter (not A, B, or C)
            'TBD123456789012',
            'TBE123456789012',
            'TBZ123456789012',
            // Mixed alphanumeric (not just digits after third letter)
            'TBZ123A456B789C0',
            'TBY12345ABCDE67',
            // Wrong prefix
            'XYZ123456789012',
            // Wrong prefix (only one letter)
            'T123456789012',
            // UPS format
            '1Z12345E0205271688',
            // Random numbers
            '1234567890',
            // Empty string
            '',
            // Too short
            'TBA',
            // Wrong prefix (no T)
            'AB123456789012',
            // Wrong prefix
            'A123456789012'
        ];

        it('should detect valid Amazon tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!amazon.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should be recognized as a valid Amazon tracking number`);
                }
            });
        });

        it('should not detect invalid Amazon tracking numbers', function() {
            invalidTrackingNumbers.forEach(trackingNumber => {
                if (amazon.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should not be recognized as a valid Amazon tracking number`);
                }
            });
        });
    });

    describe('amazon.track', function() {
        it('should return tracking information for a valid delivered package', function(done) {
            bloodhound.track('TBA321677302718', 'amazon', function(err, actual) {
                assert.ifError(err);

                assert.strictEqual(actual.carrier, 'Amazon');
                assert(actual.events.length > 0);
                assert.strictEqual(typeof actual.url, 'string');
                assert(actual.url.includes('TBA321677302718'));

                // Check that we have meaningful events
                const hasDeliveredEvent = actual.events.some(event =>
                    event.description.toLowerCase().includes('delivered') ||
                    event.description.toLowerCase().includes('package delivered')
                );

                if (actual.deliveredAt) {
                    assert(hasDeliveredEvent, 'Should have delivered event when deliveredAt is set');
                    assert(actual.deliveredAt instanceof Date);
                }

                if (actual.shippedAt) {
                    assert(actual.shippedAt instanceof Date);
                }

                // Verify event structure
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

        it('should handle tracking numbers with spaces', function(done) {
            bloodhound.track('TBA 3216 7730 2718', 'amazon', function(err, actual) {
                assert.ifError(err);
                assert.strictEqual(actual.carrier, 'Amazon');
                assert(actual.events.length > 0);
                done();
            });
        });

        it('should handle lowercase tracking numbers', function(done) {
            bloodhound.track('tba321677302718', 'amazon', function(err, actual) {
                assert.ifError(err);
                assert.strictEqual(actual.carrier, 'Amazon');
                assert(actual.events.length > 0);
                done();
            });
        });

        it('should return empty events for invalid tracking number', function(done) {
            bloodhound.track('TBA000000000000', 'amazon', function(err, actual) {
                // Should not return an error, but should have empty events (consistent with other carriers)
                assert.ifError(err);
                assert.strictEqual(actual.carrier, 'Amazon');
                assert.strictEqual(actual.events.length, 0);
                done();
            });
        });

        it('should include location information when available', function(done) {
            bloodhound.track('TBA321677302718', 'amazon', function(err, actual) {
                assert.ifError(err);

                // Look for events with location data
                const eventsWithLocation = actual.events.filter(event =>
                    event.address.city || event.address.state || event.address.country
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
                        if (event.address.country) {
                            assert(typeof event.address.country === 'string');
                            assert(event.address.country.length > 0);
                        }
                    });
                }

                done();
            });
        });

        it('should return raw data in results', function(done) {
            bloodhound.track('TBA321677302718', 'amazon', function(err, actual) {
                assert.ifError(err);
                assert(Object.hasOwn(actual, 'raw'));

                if (actual.raw) {
                    assert(typeof actual.raw === 'object');
                    // Should have expected Amazon API response structure
                    assert(Object.hasOwn(actual.raw, 'eventHistory'));
                    assert(Object.hasOwn(actual.raw, 'progressTracker'));
                }

                done();
            });
        });

        it('should sort events chronologically', function(done) {
            bloodhound.track('TBA321677302718', 'amazon', function(err, actual) {
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

        it('should parse proofOfDelivery photo and receivedBy when available', function(done) {
            // Patch fetch globally for this test
            const originalFetch = global.fetch;
            global.fetch = async () => ({
                ok: true,
                json: async () => ({
                    payload: {
                        eventHistory: [
                            {
                                eventCode: 'Delivered',
                                eventTime: '2023-12-14T15:30:00Z',
                                shipmentType: 'FORWARD',
                                location: {
                                    city: 'London',
                                    countryCode: 'GB',
                                    postalCode: 'SXXA 1XX',
                                    stateOrRegion: 'England'
                                }
                            }
                        ],
                        summary: {
                            status: 'Delivered',
                            proofOfDelivery: {
                                deliveryImageURL: 'https://amzn-s3-dXXXXX.amazonaws.com/key?XXXXXXe96d844123456',
                                receivedBy: 'John Doe'
                            }
                        }
                    }
                })
            });

            bloodhound.track('UK0123456789', 'amazon', function(err, actual) {
                // Restore fetch
                global.fetch = originalFetch;
                assert.ifError(err);
                assert(actual.proofOfDelivery);
                assert(Array.isArray(actual.proofOfDelivery.photos));
                assert.strictEqual(actual.proofOfDelivery.photos.length, 1);
                assert.strictEqual(actual.proofOfDelivery.photos[0].url, 'https://amzn-s3-dXXXXX.amazonaws.com/key?XXXXXXe96d844123456');
                assert.strictEqual(actual.proofOfDelivery.photos[0].description, 'Delivery photo');
                assert(actual.proofOfDelivery.photos[0].expiresAt);
                assert.strictEqual(actual.proofOfDelivery.receivedBy, 'John Doe');
                done();
            });
        });
    });
});