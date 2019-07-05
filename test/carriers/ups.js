const assert = require('assert');
const Bloodhound = require('../../index');
const UPS = require('../../carriers/ups');

describe('ups.isTrackingNumberValid', function () {
    const ups = new UPS();

    const validTrackingNumbers = [
        '1Z 6V86 4203 2379 4365',
        '1Z 12345E 66 05272234',
        'H9205817377',
        '1Z12345E6605272234',
        '1Z6V86420323794365',
        '1Z12345E0305271640',
        '1Z12345E0205271688',
        '1Z12345E0393657226',
        '1Z12345E1305277940',
        '1Z12345E6205277936',
        '1Z12345E1505270452',
        '1Z648616E192760718',
        '1ZWX0692YP40636269',
        '1Z12345E5991872040',
        '1Z12345E0390105056',
        '1Z12345E0290424025',
        '1Z12345E0194845039'
    ];

    const invalidTrackingNumbers = [
        '2Z88887736535254'
    ];

    it('should detect valid UPS tracking numbers', function () {
        validTrackingNumbers.forEach(trackingNumber => {
            if (!ups.isTrackingNumberValid(trackingNumber)) {
                assert.fail(`${trackingNumber} is not recognized as a valid UPS tracking number`);
            }
        });
    });

    it('should not detect invalid UPS tracking numbers', function() {
        invalidTrackingNumbers.forEach(trackingNumber => {
            if (ups.isTrackingNumberValid(trackingNumber)) {
                assert.fail(`${trackingNumber} should not be recognized as a valid UPS tracking number`);
            }
        });
    });
});

// describe.skip('Error Handling', function() {
//     this.timeout(60000);

//     it.only('should return an error for invalid base URL', function(done) {
//         const bloodhound = new Bloodhound({
//             ups: {
//                 baseUrl: 'https://httpbin.org/delay/10#',
//                 UPS_ACCESS_KEY: process.env.UPS_ACCESS_KEY,
//                 UPS_PASSWORD: process.env.UPS_PASSWORD,
//                 UPS_USERNAME: process.env.UPS_USERNAME
//             }
//         });

//         bloodhound.track('1Z9756W90308462106', 'ups', function(err) {
//             assert(err);
//             done();
//         });
//     });
// });

describe('UPS', function(){
    const bloodhound = new Bloodhound({
        ups: {
            UPS_ACCESS_KEY: process.env.UPS_ACCESS_KEY,
            UPS_PASSWORD: process.env.UPS_PASSWORD,
            UPS_USERNAME: process.env.UPS_USERNAME
        }
    });

    describe('UPS Track', function(){
        describe('UPS Ground', function() {
            it('Arrival Scan', function(done) {
                this.timeout(5000);

                bloodhound.track('1Z9756W90304415852', 'ups', function(err, actual) {
                    assert.ifError(err);

                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'Huez',
                                    state: undefined,
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-03T15:52:04.000Z'),
                                description: 'Order Processed: Ready for UPS'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T01:44:30.000Z'),
                                description: 'Origin Scan'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T05:06:00.000Z'),
                                description: 'Departure Scan'
                            },
                            {
                                address: {
                                    city: 'Portland',
                                    state: 'OR',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-05T18:47:00.000Z'),
                                description: 'Arrival Scan'
                            }
                        ],
                        shippedAt: new Date('2019-07-05T18:47:00.000Z')
                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                });
            });

            it('Delivered', function(done) {
                bloodhound.track('1Z9756W90334490643', 'ups', function(err, actual) {
                    assert.ifError(err);

                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'Huez',
                                    state: undefined,
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-20T15:52:24.000Z'),
                                description: 'Order Processed: Ready for UPS'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-21T01:40:38.000Z'),
                                description: 'Origin Scan'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-21T05:33:00.000Z'),
                                description: 'Departure Scan'
                            },
                            {
                                address: {
                                    city: 'Hodgkins',
                                    state: 'IL',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-24T10:27:00.000Z'),
                                description: 'Arrival Scan'
                            },
                            {
                                address: {
                                    city: 'Hodgkins',
                                    state: 'IL',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-26T03:04:00.000Z'),
                                description: 'Departure Scan'
                            },
                            {
                                address: {
                                    city: 'Lockport',
                                    state: 'IL',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-26T03:38:00.000Z'),
                                description: 'Arrival Scan'
                            },
                            {
                                address: {
                                    city: 'Lockport',
                                    state: 'IL',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-26T10:20:26.000Z'),
                                description: 'Destination Scan'
                            },
                            {
                                address: {
                                    city: 'Lockport',
                                    state: 'IL',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-06-26T13:14:43.000Z'),
                                description: 'Out For Delivery Today'
                            },
                            {
                                address: {
                                    city: 'Plainfield',
                                    state: 'IL',
                                    country: 'US',
                                    zipcode: '60586'
                                },
                                date: new Date('2019-06-26T16:46:06.000Z'),
                                description: 'Delivered'
                            }
                        ],
                        shippedAt: new Date('2019-06-26T16:46:06.000Z'),
                        deliveredAt: new Date('2019-06-26T16:46:06.000Z')
                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });

            it('Departure Scan', function(done) {
                this.timeout(5000);

                bloodhound.track('1Z9756W90307684673', 'ups', function(err, actual) {
                    assert.ifError(err);

                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'Huez',
                                    state: undefined,
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-03T15:56:06.000Z'),
                                description: 'Order Processed: Ready for UPS'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T02:01:46.000Z'),
                                description: 'Origin Scan'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T05:14:00.000Z'),
                                description: 'Departure Scan'
                            }
                        ],
                        shippedAt: new Date('2019-07-04T05:14:00.000Z')
                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                });
            });

            it('Out For Delivery Today', function(done) {
                this.timeout(5000);

                bloodhound.track('1Z9756W90303838666', 'ups', function(err, actual) {
                    assert.ifError(err);

                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'Huez',
                                    state: undefined,
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-03T15:53:36.000Z'),
                                description: 'Order Processed: Ready for UPS'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T02:10:02.000Z'),
                                description: 'Origin Scan'
                            },
                            {
                                address: {
                                    city: 'Cerritos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T11:03:00.000Z'),
                                description: 'Departure Scan'
                            },
                            {
                                address: {
                                    city: 'San Marcos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-04T13:31:00.000Z'),
                                description: 'Arrival Scan'
                            },
                            {
                                address: {
                                    city: 'San Marcos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-05T13:55:56.000Z'),
                                description: 'Destination Scan'
                            },
                            {
                                address: {
                                    city: 'San Marcos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-05T14:04:32.000Z'),
                                description: 'Loaded on Delivery Vehicle'
                            },
                            {
                                address: {
                                    city: 'San Marcos',
                                    state: 'CA',
                                    country: 'US',
                                    zipcode: null
                                },
                                date: new Date('2019-07-05T15:55:02.000Z'),
                                description: 'Out For Delivery Today'
                            }
                        ],
                        shippedAt: new Date('2019-07-05T15:55:02.000Z')
                    };

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });
        });

        it('should return a track response', function(done){
            bloodhound.track('1Z9756W90308462106', 'ups', function(err, actual) {
                assert.ifError(err);

                const expected = {
                    deliveredAt: new Date('2019-06-28T16:28:58.000Z'),
                    events : [
                        {
                            address: {
                                city: 'Huez',
                                state: undefined,
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-24T15:37:18.000Z'),
                            description: 'Order Processed: Ready for UPS'
                        },
                        {
                            address: {
                                city: 'Cerritos',
                                state: 'CA',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-25T02:48:00.000Z'),
                            description: 'Origin Scan'
                        },
                        {
                            address: {
                                city: 'Cerritos',
                                state: 'CA',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-25T05:50:00.000Z'),
                            description: 'Departure Scan'
                        },
                        {
                            address: {
                                city: 'Hodgkins',
                                state: 'IL',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-27T13:33:00.000Z'),
                            description: 'Arrival Scan'
                        },
                        {
                            address: {
                                city: 'Hodgkins',
                                state: 'IL',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-28T05:02:00.000Z'),
                            description: 'Departure Scan'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-28T05:58:00.000Z'),
                            description: 'Arrival Scan'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-28T10:11:58.000Z'),
                            description: 'Destination Scan'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-28T12:19:33.000Z'),
                            description: 'Loaded on Delivery Vehicle'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: null
                            },
                            date: new Date('2019-06-28T14:00:49.000Z'),
                            description: 'Out For Delivery Today'
                        },
                        {
                            address: {
                                city: 'Glendale Heights',
                                state: 'IL',
                                country: 'US',
                                zipcode: '60139'
                            },
                            date: new Date('2019-06-28T16:28:58.000Z'),
                            description: 'Delivered'
                        }
                    ],
                    shippedAt: new Date('2019-06-28T16:28:58.000Z')
                }
                assert.deepStrictEqual(actual, expected);
                done();
            });
        });
    });
});