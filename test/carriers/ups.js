const assert = require('assert');
const Bloodhound = require('../../index');
const UPS = require('../../carriers/ups');

function areEventsEqual(a, b) {
    return a.address.city === b.address.city
        && a.address.country === b.address.country
        && a.address.state === b.address.state
        && a.address.zip === b.address.zip
        && a.carrier === b.carrier
        && a.deliveredAt === b.deliveredAt
        && a.shippedAt === b.shippedAt;
}

describe('UPS', function() {
    this.timeout(25000);

    beforeEach(function(done) {
        // This is to prevent the UPS API from rate limiting us
        setTimeout(() => {
            done();
        }, 15000);
    });

    const bloodhound = new Bloodhound({
        ups: {
            baseUrl: 'https://wwwcie.ups.com',
            applicationName: 'itrac-tracking',
            token: 'eyJraWQiOiI2NGM0YjYyMC0yZmFhLTQzNTYtYjA0MS1mM2EwZjM2Y2MxZmEiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzM4NCJ9.eyJzdWIiOiJhcEBzdHJhdGl4Y29ycC5jb20iLCJjbGllbnRpZCI6InVOMEdPWE5sckZ5aE92aUROS1FzYlQ4bXpJM1dHNWJJekl1WmNhbEs2V3l5SDhKbiIsImlzcyI6Imh0dHBzOi8vYXBpcy51cHMuY29tIiwidXVpZCI6IkRGNDg4MTQwLTExMEMtMUUyNS1CQkNFLTdERDhBMkNBRkJCMSIsInNpZCI6IjY0YzRiNjIwLTJmYWEtNDM1Ni1iMDQxLWYzYTBmMzZjYzFmYSIsImF1ZCI6Iml0cmFjMzYwIiwiYXQiOiJhNnFoNWJPTlhBYXNralRQakxzdTlCUzlPTmFMIiwibmJmIjoxNzE3MDc3Nzg4LCJEaXNwbGF5TmFtZSI6Iml0cmFjMzYwIiwiZXhwIjoxNzE3MDkyMTg4LCJpYXQiOjE3MTcwNzc3ODgsImp0aSI6IjNkM2Y1YmUzLTRiMzAtNGMyZC1hZjIwLTVkZWMyNzlmMGE2ZiJ9.OpIA6SFwio9LUXl9c1VmED8je6BUhXgIa9GBFBlMSXsrNiQlNdNVoGiErAe0U7_bGI9BitV7hY4Wn0VRCFlJ0l36CxJKl_IPTZPGvZFSaMLUK5wJu9h8eu0MDXOxHiuQaznusnDDwXtJKOaT6LsSL-piqnH9sZctS5rfE5ZbwSQzfxtSl8aSYhyFZf3STm6sJIWOIY7vhJwinaIF4YQ2yH0v17kZZdEjYkOLv60-mSfmUceUUKi1XsnkQqBVm9cemR_aVq69MwfLWHPRUrph3C99Su-pfTya2Swxk2TgZ5umDn8AIxIffbc5zk7QTUFm21P8x0isz-l6awdbbBIdjZbeADJMoYdchAEtzdEyfNtNrFHW1HKrP14QFOeVwwWi6RkcYYlm-_MNu2Ta-f4B67GLbp3Peiz5F7T5B3ffdMn_-lemmG54Pgfs7-KFzV5drOGRkqc9Kc2zRzHQW0Pg4rUKAM7ipHEZbrxVTFoPngIvMO_agJ0YKByr-UAuqIuMIpTsocTONmdg-o_PSf9eF1UA8mwMvUhPl_wVNTgLphPcAtHNeW2tw4H11MMQJS13CgT6uYPJg135M1mkzOfE5qevUfNsD9ZOy-sTwjZxOzKPJIM0RzuNd-QGB1XBe9DH_Zsm8-b_V6gZaPSfa6JlVbxSf6xk9PbqMpCZjoguD40'
        },
    });

    describe('Error Handling', function() {
        describe('Invalid UPS credentials', function() {
            it('should return an error for invalid username', function(done) {
                const bloodhound = new Bloodhound({
                    ups: {
                        accessKey: process.env.UPS_ACCESS_KEY,
                        password: process.env.UPS_PASSWORD,
                        username: 'username'
                    }
                });

                bloodhound.track('1Z9756W90304415852', 'ups', function(err) {
                    assert(err);

                    done();
                });
            });

            it('should return an error for a tracking number that contains invalid characters', function(done) {
                bloodhound.track('1Z9756W9030441!85@', 'ups', function(err) {
                    assert(err);

                    done();
                });
            });
        });

        describe('Invalid UPS Access', function() {
            this.timeout(60000);

            it('should return an error for trying to access an invalid url', function(done) {
                const bloodhound = new Bloodhound({
                    ups: {
                        baseUrl: 'https://onlintools.ups.com'
                    }
                });

                bloodhound.track('1Z9756W90304415852', 'ups', function(err) {
                    assert(err);

                    done();
                });
            });
        });
    });

    describe('ups.isTrackingNumberValid', function() {
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
            '1Z12345E0194845039',
            '1z3913yy0344313151'
        ];

        const invalidTrackingNumbers = [
            '1Z12345E020527079'
        ];

        it('should detect valid UPS tracking numbers', function() {
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

    describe('ups.track', function() {
        this.timeout(60000);

        // it('should return an empty result if there is no tracking information available', function(done) {
        //     bloodhound.track('1Z12345E1505270452', 'ups', function(err, actual) {
        //         console.log('actual', actual);
        //         assert.ifError(err);
        //
        //         assert.strictEqual(actual.carrier, 'UPS');
        //         assert.strictEqual(actual.deliveredAt, undefined);
        //         assert.strictEqual(actual.shippedAt, undefined);
        //         assert.strictEqual(actual.url, undefined);
        //         assert.strictEqual(actual.events.length, 0);
        //
        //         done();
        //     });
        // });

        it('should return tracking information with no errors', function(done) {
            bloodhound.track('5548789114', 'ups', function(err) {
                assert.ifError(err);
                done();
            });
        });

        it('should return a track response', function(done) {
            bloodhound.track('1Z1882X33596113500', 'ups', function(err, actual) {
                assert.ifError(err);

                const expectedEvents = [
                    {
                        address: {
                            city: 'Atlanta',
                            country: 'US',
                            state: 'GA',
                            zip: '30304'
                        },
                        date: '2010-04-29T16:00:00.000Z',
                        description: 'DELIVERED'
                    },
                    {
                        address: {
                            city: 'Atlanta',
                            country: 'US',
                            state: 'GA',
                            zip: '30304'
                        },
                        date: '2010-04-29T16:00:00.000Z',
                        description: 'DELIVERED'
                    }
                ];

                console.log('actual', actual);

                assert.strictEqual(actual.carrier, 'UPS');
                assert.strictEqual(actual.deliveredAt.valueOf(), new Date('2010-04-29T16:00:00.000Z').valueOf());
                assert.strictEqual(actual.shippedAt.valueOf(), new Date('2010-04-29T16:00:00.000Z').valueOf());
                assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z1882X33596113500');
                assert.strictEqual(actual.events.length, expectedEvents.length);
                expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));

                done();
            });
        });
    //
    //     describe('Mail Innovations', function() {
    //         it('should return a tracking response', function(done) {
    //             bloodhound.track('9102084383041101186729', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 // their single UPS MI test tracking number has no activity (annoying, but intentional on their part)
    //                 const expectedEvent = {
    //                     address: {
    //                         city: undefined,
    //                         state: undefined,
    //                         country: undefined,
    //                         zip: undefined
    //                     },
    //                     date: new Date('2006-10-27T18:52:00.000Z'),
    //                     description: ''
    //                 };
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=9102084383041101186729');
    //                 assert(areEventsEqual(actual.events[0], expectedEvent));
    //
    //                 done();
    //             });
    //         });
    //     });
    //
    //     describe('2nd Day Air', function() {
    //         it('Delivered', function(done) {
    //             bloodhound.track('1Z12345E0205271688', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'ANYTOWN',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: '30340'
    //                         },
    //                         date: new Date('2019-04-15T15:40:17.000Z'),
    //                         description: 'DELIVERED'
    //                     },
    //                     {
    //                         address: {},
    //                         date: new Date('2019-04-15T15:40:17.000Z'),
    //                         description: 'BILLING INFORMATION RECEIVED. SHIPMENT DATE PENDING.'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt.valueOf(), new Date('2019-04-15T15:40:17.000Z').valueOf());
    //                 assert.strictEqual(actual.shippedAt.valueOf(), new Date('2019-04-15T15:40:17.000Z').valueOf());
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z12345E0205271688');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             })
    //         });
    //     });
    //
    //     describe('Express Freight', function() {
    //         it('should return a track response with a status update of Confirmed Arrival', function(done) {
    //             bloodhound.track('5548789114', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {},
    //                         date: new Date('2010-11-24T12:16:00.000Z'),
    //                         description: 'Bad weather'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'El Paso',
    //                             state: 'TX',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-18T16:00:00.000Z'),
    //                         description: 'CONFIRMED ARRIVAL'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'El Paso',
    //                             state: 'TX',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-18T15:16:00.000Z'),
    //                         description: 'DOCUMENTS TURNED OVER TO CLIENTS BROKER OR CONSIGNEE'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'El Paso',
    //                             state: 'TX',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-18T14:00:00.000Z'),
    //                         description: 'ENTRY FILED'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'El Paso',
    //                             state: 'TX',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-18T08:42:49.000Z'),
    //                         description: 'ON-HAND AT DESTINATION'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Hampshire',
    //                             state: 'IL',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-18T07:04:00.000Z'),
    //                         description: 'ARRIVED AT DESTINATION COUNTRY'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Köln',
    //                             state: 'NW',
    //                             country: 'DE',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-15T13:34:00.000Z'),
    //                         description: 'CONFIRMED DEPARTURE'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Amsterdam',
    //                             state: undefined,
    //                             country: 'NL',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-15T13:31:32.000Z'),
    //                         description: 'DOCS RECEIVED FROM SHIPPER'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Amsterdam',
    //                             state: undefined,
    //                             country: 'NL',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-15T13:31:32.000Z'),
    //                         description: 'DATE AVAILABLE TO SHIP'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Amsterdam',
    //                             state: undefined,
    //                             country: 'NL',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-10-15T12:00:00.000Z'),
    //                         description: 'RECEIVED INTO UPS POSSESSION'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt, undefined);
    //                 assert.strictEqual(actual.shippedAt, undefined);
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=5548789114');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             });
    //         });
    //     });
    //
    //     describe('Freight LTL', function() {
    //         it('should return a track response with a status update of In Transit', function(done) {
    //             bloodhound.track('990728071', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'Dothan',
    //                             state: 'AL',
    //                             country: undefined,
    //                             zip: undefined
    //                         },
    //                         date: new Date('2005-10-06T17:56:00.000Z'),
    //                         description: 'SHIPMENT HAS BEEN DELIVERED TO THE CONSIGNEE.'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Columbia',
    //                             state: 'SC',
    //                             country: undefined,
    //                             zip: undefined
    //                         },
    //                         date: new Date('2005-10-05T22:00:00.000Z'),
    //                         description: 'SHIPMENT HAS BEEN PICKED-UP.'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt, undefined);
    //                 assert.strictEqual(actual.shippedAt, undefined);
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=990728071');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             });
    //         });
    //     });
    //
    //     describe('Ground', function() {
    //         it('Delivered', function(done) {
    //             bloodhound.track('1Z12345E0305271640', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: '30304'
    //                         },
    //                         date: new Date('2010-04-29T16:00:00.000Z'),
    //                         description: 'DELIVERED'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: '30304'
    //                         },
    //                         date: new Date('2010-04-29T16:00:00.000Z'),
    //                         description: 'DELIVERED'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt.valueOf(), new Date('2010-04-29T16:00:00.000Z').valueOf());
    //                 assert.strictEqual(actual.shippedAt.valueOf(), new Date('2010-04-29T16:00:00.000Z').valueOf());
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z12345E0305271640');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             })
    //         });
    //
    //     });
    //
    //     describe('Next Day Air', function() {
    //         it('Origin Scan', function(done) {
    //             bloodhound.track('1Z12345E1305277940', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'Grand Junction',
    //                             state: 'CO',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-05-05T07:00:00.000Z'),
    //                         description: 'ORIGIN SCAN'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt, undefined);
    //                 assert.strictEqual(actual.shippedAt.valueOf(), new Date('2010-05-05T07:00:00.000Z').valueOf());
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z12345E1305277940');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             })
    //         });
    //
    //         it('2nd Delivery Attempt', function(done) {
    //             bloodhound.track('1Z12345E6205277936', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'BONN',
    //                             state: undefined,
    //                             country: 'DE',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-08-30T08:39:00.000Z'),
    //                         description: 'UPS INTERNAL ACTIVITY CODE'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'BONN',
    //                             state: undefined,
    //                             country: 'DE',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-08-30T08:32:00.000Z'),
    //                         description: 'ADVERSE WEATHER CONDITIONS CAUSED THIS DELAY'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'ANYTOWN',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-09-10T22:03:00.000Z'),
    //                         description: 'THE RECEIVER\'S LOCATION WAS CLOSED ON THE 2ND DELIVERY ATTEMPT. A 3RD DELIVERY ATTEMPT WILL BE MADE'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: '30340'
    //                         },
    //                         date: new Date('2010-09-12T15:57:00.000Z'),
    //                         description: 'DELIVERED'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Malvern',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: 30340
    //                         },
    //                         date: new Date('2010-04-04T18:40:00.000Z'),
    //                         description: 'PICKUP SCAN'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'BONN',
    //                             state: undefined,
    //                             country: 'DE',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-08-30T11:13:00.000Z'),
    //                         description: 'UPS INTERNAL ACTIVITY CODE'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt.valueOf(), new Date('2010-09-12T15:57:00.000Z').valueOf());
    //                 assert.strictEqual(actual.shippedAt.valueOf(), new Date('2010-09-12T15:57:00.000Z').valueOf());
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z12345E6205277936');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             })
    //         });
    //
    //     });
    //
    //     describe('No service stated', function() {
    //         it('should return a track response with a status update of Deliver Origin CFS', function(done) {
    //             bloodhound.track('3251026119', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2006-05-26T00:06:05.000Z'),
    //                         description: 'DOCS RECEIVED FROM SHIPPER'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2006-05-26T00:06:05.000Z'),
    //                         description: 'DATE AVAILABLE TO SHIP'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2006-05-26T00:06:05.000Z'),
    //                         description: 'ON HAND AT ORIGIN'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2006-05-26T00:06:05.000Z'),
    //                         description: 'CONFIRMED DEPARTURE'
    //                     },
    //                     {
    //                         address: {
    //                             city: 'Atlanta',
    //                             state: 'GA',
    //                             country: 'US',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2006-05-26T00:06:05.000Z'),
    //                         description: 'RECEIVED INTO UPS-SCS POSSESSION'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt, undefined);
    //                 assert.strictEqual(actual.shippedAt, undefined);
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=3251026119');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             })
    //         });
    //     });
    //
    //     describe('World Wide Express', function() {
    //         it('Delivered', function(done) {
    //             bloodhound.track('1Z12345E6605272234', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'ANYTOWN',
    //                             state: undefined,
    //                             country: 'IT',
    //                             zip: undefined
    //                         },
    //                         date: new Date('2010-05-18T14:00:00.000Z'),
    //                         description: 'DELIVERED'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt.valueOf(), new Date('2010-05-18T14:00:00.000Z').valueOf());
    //                 assert.strictEqual(actual.shippedAt.valueOf(), new Date('2010-05-18T14:00:00.000Z').valueOf());
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z12345E6605272234');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             })
    //         });
    //     });
    //
    //     describe.skip('Worldwide Express Freight', function() {
    //         it('should return a track response with a status update of Order Processed: Ready for UPS', function(done) {
    //             bloodhound.track('1Z648616E192760718', 'ups', function(err, actual) {
    //                 assert.ifError(err);
    //
    //                 const expectedEvents = [
    //                     {
    //                         address: {
    //                             city: 'Courtabœuf Cedex',
    //                             country: 'FR',
    //                             state: undefined,
    //                             zip: undefined
    //                         },
    //                         date: new Date('2012-10-04T11:58:04.000Z'),
    //                         description: 'Order Processed: Ready for UPS'
    //                     }
    //                 ];
    //
    //                 assert.strictEqual(actual.carrier, 'UPS');
    //                 assert.strictEqual(actual.deliveredAt, undefined);
    //                 assert.strictEqual(actual.shippedAt, undefined);
    //                 assert.strictEqual(actual.url, 'https://www.ups.com/track?tracknum=1Z648616E192760718');
    //                 assert.strictEqual(actual.events.length, expectedEvents.length);
    //                 expectedEvents.every(expectedEvent => assert(actual.events.some(e => areEventsEqual(expectedEvent, e))));
    //
    //                 done();
    //             });
    //         })
    //     });
    //
    });
});
