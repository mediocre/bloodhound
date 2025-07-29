const assert = require('assert');
const nock = require('nock');
const util = require('util');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('DHL', function() {
    const validTrackingNumbers = [
        '420944019261299999877816190127'
    ];

    describe('dhl.isTrackingNumberValid', function() {
        const dhl = new DHL();


        const invalidTrackingNumbers = [
            '9970 4895 0367 429',
            'DT771613423732',
            '9400 1118 9922 3818 2184 07'
        ];

        it('should detect valid DHL tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!dhl.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} is not recognized as a valid DHL tracking number`);
                }
            });
        });

        it('should not detect invalid DHL tracking numbers', function() {
            invalidTrackingNumbers.forEach(trackingNumber => {
                if (dhl.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} should not be recognized as a valid DHL tracking number`);
                }
            });
        });
    });

    describe('dhl.track', function() {
        this.timeout(10000);

        it('should return a valid response with no errors', function(done) {
            const bloodhound = new Bloodhound({
                dhl: {
                    apiKey: process.env.DHL_API_KEY
                }
            });

            bloodhound.track(validTrackingNumbers[0], 'dhl', function(err, actual) {
                assert.ifError(err);
                assert.equal('DHL', actual.carrier);
                done();
            });
        });

        it('should fall through to DHL UTAPI and return a response with no errors when DHL eCommerce Solutions fails', function(done) {
            const bloodhound = new Bloodhound({
                dhl: {
                    apiKey: process.env.DHL_API_KEY
                },
                dhlEcommerceSolutions: {
                    client_id: 'fail',
                    client_secret: 'fail',
                    environment_url: process.env.DHL_ECOMMERCE_SOLUTIONS_ENVIRONMENT_URL
                }
            });

            bloodhound.track(validTrackingNumbers[0], 'dhl', function(err, actual) {
                assert.ifError(err);
                assert.equal('DHL', actual.carrier);
                done();
            });
        });

        it('should fall through to USPS and return a response with no errors when DHL UTAPI fails', function(done) {
            const bloodhound = new Bloodhound({
                dhl: {
                    apiKey: '123'
                },
                usps: {
                    userId: process.env.USPS_USERID
                }
            });

            bloodhound.track(validTrackingNumbers[0], 'dhl', function(err, actual) {
                assert.ifError(err);
                assert.equal('USPS', actual.carrier);
                done();
            });
        });

        it('should try DHL eCommerce solutions first', function(done) {
            const bloodhound = new Bloodhound({
                dhlEcommerceSolutions: {
                    client_id: process.env.DHL_ECOMMERCE_SOLUTIONS_CLIENT_ID,
                    client_secret: process.env.DHL_ECOMMERCE_SOLUTIONS_CLIENT_SECRET,
                    environment_url: process.env.DHL_ECOMMERCE_SOLUTIONS_ENVIRONMENT_URL
                }
            });

            bloodhound.track(validTrackingNumbers[0], 'dhl', function(err, actual) {
                // No packages with length to track, so this is falling through to UTAPI
                assert.equal(err.message.includes('401 GET https://api-eu.dhl.com/track/shipments'), true);
                assert.equal(undefined, actual);
                done();
            });
        });

        it('should return estimated delivery date for a real DHL tracking number', function(done) {
            nock('https://api-eu.dhl.com')
                .get('/track/shipments?trackingNumber=420944019261299999877816190127')
                .reply(200, {
                    shipments: [{
                        id: '420944019261299999877816190127',
                        service: 'ecommerce',
                        status: 'transit',
                        estimatedTimeOfDelivery: '2025-07-29',
                        events: [
                            {
                                timestamp: '2025-07-25T10:00:00',
                                description: 'Shipment picked up',
                                location: {
                                    address: {
                                        addressLocality: 'Frankfurt',
                                        postalCode: '60547',
                                        countryCode: 'DE'
                                    }
                                }
                            }
                        ]
                    }]
                });

            const bloodhound = new Bloodhound({
                dhl: {
                    apiKey: 'fake-api-key'
                }
            });

            bloodhound.track('420944019261299999877816190127', 'dhl', function(err, actual) {
                assert.ifError(err);
                assert(actual.estimatedDeliveryDate);
                assert.strictEqual(actual.estimatedDeliveryDate.earliest.toISOString(), '2025-07-29T00:00:00.000Z');
                assert.strictEqual(actual.estimatedDeliveryDate.latest.toISOString(), '2025-07-29T00:00:00.000Z');
                assert.strictEqual(util.types.isDate(actual.estimatedDeliveryDate.earliest), true);
                assert.strictEqual(util.types.isDate(actual.estimatedDeliveryDate.latest), true);
                done();
            });
        });

    });
});