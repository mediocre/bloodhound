const assert = require('assert');
const Bloodhound = require('../../index');
const UPS = require('../../carriers/ups');

describe('UPS', function(){
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        ups: {
            UPS_ACCESS_KEY: process.env.UPS_ACCESS_KEY,
            UPS_PASSWORD: process.env.UPS_PASSWORD,
            UPS_USERNAME: process.env.UPS_USERNAME,
            baseUrl: 'https://wwwcie.ups.com/rest/Track'
        }
    });

    describe('Error Handling', function() {
        describe('Invalid UPS credentials', function(){
            it('should return an error for invalid username', function(done){
                const bloodhound = new Bloodhound({
                    ups:{
                        UPS_ACCESS_KEY: process.env.UPS_ACCESS_KEY,
                        UPS_PASSWORD: process.env.UPS_PASSWORD,
                        UPS_USERNAME: 'ajsalagundi1234567890'
                    }
                });
                bloodhound.track('1Z9756W90304415852', 'ups', function(err){
                    assert(err);
                    done();
                });
            });

            it('should return an error for a tracking number that contains invalid characters', function(done) {
                bloodhound.track('1Z9756W9030441!85@', 'ups', function(err) {
                    assert(err);
                    done();
                })
            })
        });

        describe('Invalid UPS Access', function() {
            this.timeout(60000);

            it('should return an error for trying to access an invalid url', function(done) {
                const bloodhound = new Bloodhound({
                    ups: {
                        baseUrl: 'https://onlintools.ups.com/rest/Track'
                    }
                });
                bloodhound.track('1Z9756W90304415852', 'ups', function(err) {
                    assert(err);
                    done();
                })
            });
        });
    });

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
            '1Z12345E020527079'
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

    describe('ups.track', function(){
        it('should return an empty result if there is no tracking information available ', function(done) {
            bloodhound.track('1Z12345E1505270452', 'ups', function(err, actual) {
                const expected = {
                    events: []
                }
                assert.ifError(err);
                assert.deepStrictEqual(actual, expected);
                done();
            });
        });

        it('should return tracking information with no errors', function(done) {
            bloodhound.track('5548789114', 'ups', function(err) {
                assert.ifError(err);
                done();
            });
        });

        it('should return a track response', function(done){
            bloodhound.track('1Z9756W90308462106', 'ups', function(err, actual) {
                assert.ifError(err);

                const expected = {
                    events: [
                        {
                            address: {
                                city: 'Glendale Heights',
                                state: 'IL',
                                country: 'US',
                                zipcode: '60139'
                            },
                            date: new Date ('2019-06-28T16:28:58.000Z'),
                            description: 'Delivered'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-28T14:00:49.000Z'),
                            description: 'Out For Delivery Today'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-28T12:19:33.000Z'),
                            description: 'Loaded on Delivery Vehicle'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-28T10:11:58.000Z'),
                            description: 'Destination Scan'
                        },
                        {
                            address: {
                                city: 'Addison',
                                state: 'IL',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-28T05:58:00.000Z'),
                            description: 'Arrival Scan'
                        },
                        {
                            address: {
                                city: 'Hodgkins',
                                state: 'IL',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-28T05:02:00.000Z'),
                            description: 'Departure Scan'
                        },
                        {
                            address: {
                                city: 'Hodgkins',
                                state: 'IL',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-27T13:33:00.000Z'),
                            description: 'Arrival Scan'
                        },
                        {
                            address: {
                                city: 'Cerritos',
                                state: 'CA',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-25T05:50:00.000Z'),
                            description: 'Departure Scan'
                        },
                        {
                            address: {
                                city: 'Cerritos',
                                state: 'CA',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-25T02:48:00.000Z'),
                            description: 'Origin Scan'
                        },
                        {
                            address: {
                                city: 'Huez',
                                state: '',
                                country: 'US',
                                zipcode: ''
                            },
                            date: new Date ('2019-06-24T15:37:18.000Z'),
                            description: 'Order Processed: Ready for UPS'
                        }
                    ],
                    deliveredAt: new Date ('2019-06-28T16:28:58.000Z'),
                    shippedAt: new Date ('2019-06-25T02:48:00.000Z')
                }
                assert.deepStrictEqual(actual, expected);
                done();
            });
        });
        describe('2nd Day Air', function(){
            it('Delivered', function(done){
                bloodhound.track('1Z12345E0205271688', 'ups', function(err, actual){
                    assert.ifError(err);

                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'ANYTOWN',
                                    state: 'GA',
                                    country: 'US',
                                    zipcode: '30340'
                                },
                                date: new Date ('1999-06-10T16:00:00.000Z'),
                                description: 'DELIVERED'
                            },
                            {
                                address: {
                                    city: '',
                                    state: '',
                                    country: '',
                                    zipcode: ''
                                },
                                date: new Date ('1999-06-08T16:00:00.000Z'),
                                description: 'BILLING INFORMATION RECEIVED. SHIPMENT DATE PENDING.'
                            }
                        ],
                        deliveredAt: new Date ('1999-06-10T16:00:00.000Z'),
                        shippedAt: new Date ('1999-06-10T16:00:00.000Z')

                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });
        });

        describe('World Wide Express', function(){
            it('Delivered', function(done){
                bloodhound.track('1Z12345E6605272234', 'ups', function(err, actual){
                    assert.ifError(err);
                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'ANYTOWN',
                                    state: '',
                                    country: 'IT',
                                    zipcode: ''
                                },
                                date: new Date ('2010-05-18T14:00:00.000Z'),
                                description: 'DELIVERED'
                            }
                        ],
                        deliveredAt: new Date ('2010-05-18T14:00:00.000Z'),
                        shippedAt: new Date ('2010-05-18T14:00:00.000Z')

                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });
        });
        describe('Ground', function(){
            it('Delivered', function(done){
                bloodhound.track('1Z12345E0305271640', 'ups', function(err, actual){
                    assert.ifError(err);
                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'ANYTOWN',
                                    state: 'GA',
                                    country: 'US',
                                    zipcode: '30304'
                                },
                                date: new Date ('2010-04-29T16:00:00.000Z'),
                                description: 'DELIVERED'
                            },
                            {
                                address: {
                                    city: 'ANYTOWN',
                                    state: 'GA',
                                    country: 'US',
                                    zipcode: '30304'
                                },
                                date: new Date ('2010-04-29T16:00:00.000Z'),
                                description: 'DELIVERED'
                            }
                        ],
                        deliveredAt: new Date ('2010-04-29T16:00:00.000Z'),
                        shippedAt: new Date ('2010-04-29T16:00:00.000Z')
                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });

        });

        describe('Next Day Air', function(){
            it('Origin Scan', function(done){
                bloodhound.track('1Z12345E1305277940', 'ups', function(err, actual){
                    assert.ifError(err);
                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'GRAND JUNCTION AIR S',
                                    state: 'CO',
                                    country: 'US',
                                    zipcode: ''
                                },
                                date: new Date ('2010-05-05T05:00:00.000Z'),
                                description: 'ORIGIN SCAN'
                            }
                        ],
                        shippedAt: new Date ('2010-05-05T05:00:00.000Z')
                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });

            it('2nd Delivery Attempt', function(done){
                bloodhound.track('1Z12345E6205277936', 'ups', function(err, actual){
                    assert.ifError(err);
                    const expected = {
                        events: [
                            {
                                address: {
                                    city: 'Bonn',
                                    state: '',
                                    country: 'DE',
                                    zipcode: ''
                                },
                                date: new Date ('2010-08-30T08:39:00.000Z'),
                                description: 'UPS INTERNAL ACTIVITY CODE'
                            },
                            {
                                address: {
                                    city: 'Bonn',
                                    state: '',
                                    country: 'DE',
                                    zipcode: ''
                                },
                                date: new Date ('2010-08-30T08:32:00.000Z'),
                                description: 'ADVERSE WEATHER CONDITIONS CAUSED THIS DELAY'
                            },
                            {
                                address: {
                                    city: 'ANYTOWN',
                                    state: 'GA',
                                    country: 'US',
                                    zipcode: ''
                                },
                                date: new Date ('2010-09-10T22:03:00.000Z'),
                                description: 'THE RECEIVER\'S LOCATION WAS CLOSED ON THE 2ND DELIVERY ATTEMPT. A 3RD DELIVERY ATTEMPT WILL BE MADE'
                            },
                            {
                                address: {
                                    city: 'ANYTOWN',
                                    state: 'GA',
                                    country: 'US',
                                    zipcode: '30340'
                                },
                                date: new Date ('2010-09-12T15:57:00.000Z'),
                                description: 'DELIVERED'
                            },
                            {
                                address: {
                                    city: 'WEST CHESTER-MALVERN',
                                    state: 'GA',
                                    country: 'US',
                                    zipcode: ''
                                },
                                date: new Date ('2010-04-04T18:40:00.000Z'),
                                description: 'PICKUP SCAN'
                            },
                            {
                                address: {
                                    city: 'Bonn',
                                    state: '',
                                    country: 'DE',
                                    zipcode: ''
                                },
                                date: new Date ('2010-08-30T11:13:00.000Z'),
                                description: 'UPS INTERNAL ACTIVITY CODE'
                            }
                        ],
                        deliveredAt: new Date ('2010-09-12T15:57:00.000Z'),
                        shippedAt: new Date ('2010-09-12T15:57:00.000Z')
                    }

                    assert.deepStrictEqual(actual, expected);
                    done();
                })
            });

        });

    });
});