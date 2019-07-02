const assert = require('assert');

const Bloodhound = require('../../index.js');

describe('Newgistics', function() {
    this.timeout(10000);

    it('4206336792748927005269000010615207', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4209302392612927005269000027783702', 'newgistics', function(err, actual) {
            assert.ifError(err);

            const expected = {
                events: [
                    {
                        address: {
                            city: 'Ojai',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-30T18:03:00.000Z'),
                        description: 'Delivered, Front Door/Porch'
                    },
                    {
                        address: {
                            city: 'Ojai',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-30T02:51:00.000Z'),
                        description: 'Delivery Attempted - No Access to Delivery Location'
                    },
                    {
                        address: {
                            city: 'Ojai',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-29T16:10:00.000Z'),
                        description: 'Out for Delivery'
                    },
                    {
                        address: {
                            city: 'Ojai',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-29T16:00:00.000Z'),
                        description: 'Sorting Complete'
                    },
                    {
                        address: {
                            city: 'Ojai',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-28T22:58:00.000Z'),
                        description: 'Arrived at Post Office'
                    },
                    {
                        address: {
                            city: 'Ojai',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-28T21:43:00.000Z'),
                        description: 'Accepted at USPS Destination Facility'
                    },
                    {
                        address: {
                            city: 'LA',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-06-28T01:49:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-26T20:26:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-26T13:04:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-25T13:09:00.000Z'),
                        description: 'Picked Up by Shipping Partner, USPS Awaiting Item'
                    }
                ],
                deliveredAt: new Date('2019-06-30T18:03:00.000Z'),
                shippedAt: new Date('2019-06-28T21:43:00.000Z')
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});