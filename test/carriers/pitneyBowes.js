const assert = require('assert');

const Bloodhound = require('../../index.js');

describe('Newgistics', function() {
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
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-28T13:35:00.000Z'),
                        description: 'Delivered, In/At Mailbox'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-28T09:19:00.000Z'),
                        description: 'Out for Delivery'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-28T09:09:00.000Z'),
                        description: 'Sorting Complete'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-27T12:21:00.000Z'),
                        description: 'Arrived at Post Office'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-27T11:06:00.000Z'),
                        description: 'Accepted at USPS Destination Facility'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-22T16:05:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-22T11:39:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-21T17:16:00.000Z'),
                        description: 'Departed Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-21T08:18:00.000Z'),
                        description: 'Arrived Shipping Partner Facility, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-03-18T11:06:00.000Z'),
                        description: 'Picked Up by Shipping Partner, USPS Awaiting Item'
                    }
                ]
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});