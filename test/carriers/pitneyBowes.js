const assert = require('assert');

const Bloodhound = require('../../index.js');

describe('Newgistics', function() {
    this.timeout(10000);

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

    it('4206336792748927005269000010615207', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4206336792748927005269000010615207', 'newgistics', function(err, actual) {
            assert.ifError(err);

            const expected = {
                events: [
                    {
                        address: {
                            city: 'Lake Saint Louis',
                            country: null,
                            state: 'MO',
                            zip: null
                        },
                        date: new Date('2019-03-28T18:35:00.000Z'),
                        description: 'Delivered, In/At Mailbox'
                    },
                    {
                        address: {
                            city: 'Lake Saint Louis',
                            country: null,
                            state: 'MO',
                            zip: null
                        },
                        date: new Date('2019-03-28T14:19:00.000Z'),
                        description: 'Out for Delivery'
                    },
                    {
                        address: {
                            city: 'Lake Saint Louis',
                            country: null,
                            state: 'MO',
                            zip: null
                        },
                        date: new Date('2019-03-28T14:09:00.000Z'),
                        description: 'Sorting Complete'
                    },
                    {
                        address: {
                            city: 'O FALLON',
                            country: null,
                            state: 'MO',
                            zip: null
                        },
                        date: new Date('2019-03-27T16:21:00.000Z'),
                        description: 'Arrived at Post Office'
                    },
                    {
                        address: {
                            city: 'O FALLON',
                            country: null,
                            state: 'MO',
                            zip: null
                        },
                        date: new Date('2019-03-27T15:06:00.000Z'),
                        description: 'Accepted at USPS Destination Facility'
                    },
                    {
                        address: {
                            city: 'Greenwood',
                            country: null,
                            state: 'IN',
                            zip: null
                        },
                        date: new Date('2019-03-22T20:05:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Greenwood',
                            country: null,
                            state: 'IN',
                            zip: null
                        },
                        date: new Date('2019-03-22T15:39:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-21T22:16:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-21T13:18:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-18T16:06:00.000Z'),
                        description: 'Picked Up by Shipping Partner, USPS Awaiting Item'
                    }
                ],
                deliveredAt: new Date('2019-03-28T18:35:00.000Z'),
                shippedAt: new Date('2019-03-27T15:06:00.000Z')
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});