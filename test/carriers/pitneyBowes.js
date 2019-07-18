const assert = require('assert');

const Bloodhound = require('../../index.js');

describe('Newgistics', function() {
    this.timeout(20000);

    it('should return an error for invalid base URL', function(done) {
        const bloodhound = new Bloodhound({
            pettyCache: {},
            pitneyBowes: {
                baseUrl: 'https://httpbin.org/status/500#'
            }
        });

        bloodhound.track('9400111899223837861141', 'newgistics', function(err) {
            assert(err);
            done();
        });
    });

    it('4204540992748927005269000020006828', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4204540992748927005269000020006828', 'newgistics', function(err, actual) {
            assert.ifError(err);

            const expected = {
                events: [
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-22T14:59:00.000Z'),
                        description: 'Moved, Left no Address'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-22T14:59:00.000Z'),
                        description: 'Return to Sender Processed'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T20:47:00.000Z'),
                        description: 'No Such Number'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T14:33:00.000Z'),
                        description: 'Moved, Left no Address'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T12:14:00.000Z'),
                        description: 'Out for Delivery'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T12:04:00.000Z'),
                        description: 'Sorting Complete'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-20T15:26:00.000Z'),
                        description: 'Arrived at Post Office'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-20T05:44:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-19T18:12:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-18T23:24:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-18T14:44:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-17T12:07:00.000Z'),
                        description: 'Picked Up by Shipping Partner, USPS Awaiting Item'
                    }
                ],
                shippedAt: new Date('2019-06-18T14:44:00.000Z')
            };
            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});