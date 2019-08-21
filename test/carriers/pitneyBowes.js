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

    it('should return a shippedAt field when results have no shipping status', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4207866492612927005269000029964826', 'newgistics', function(err, actual) {
            assert.ifError(err);

            const expected = {
                carrier: 'Newgistics',
                events: [
                    {
                        address: {
                            city: 'LA',
                            country: null,
                            state: 'CA',
                            zip: null
                        },
                        date: new Date('2019-07-19T22:57:00.000Z'),
                        description: 'Delivered'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-07-10T16:08:00.000Z'),
                        description: 'Electronic Shipping Info Received'
                    }
                ],
                deliveredAt: new Date('2019-07-19T22:57:00.000Z'),
                url: 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=4207866492612927005269000029964826',
                shippedAt: new Date('2019-07-19T22:57:00.000Z')
            }

            assert.deepStrictEqual(actual, expected);
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
                carrier: 'Newgistics',
                events: [
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-22T13:59:00.000Z'),
                        description: 'Return to Sender because the addressee moved and left no forwarding address'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T19:47:00.000Z'),
                        description: 'Return to Sender due to No such Number'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T13:33:00.000Z'),
                        description: 'Return to Sender because the addressee moved and left no forwarding address'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T11:14:00.000Z'),
                        description: 'Out for Delivery'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-21T11:04:00.000Z'),
                        description: 'Sorting Complete'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-20T14:26:00.000Z'),
                        description: 'Arrival at Unit'
                    },
                    {
                        address: {
                            city: 'Dayton',
                            country: null,
                            state: 'OH',
                            zip: null
                        },
                        date: new Date('2019-06-20T05:53:00.000Z'),
                        description: 'Pre-Shipment Info Sent to USPS, USPS Awaiting Item'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-20T05:44:00.000Z'),
                        description: 'In transit'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-20T05:27:00.000Z'),
                        description: 'In transit'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-19T18:12:00.000Z'),
                        description: 'In transit'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-19T11:47:00.000Z'),
                        description: 'Estimated Delivery'
                    },
                    {
                        address: {
                            city: 'Hebron',
                            country: null,
                            state: 'KY',
                            zip: null
                        },
                        date: new Date('2019-06-19T09:05:00.000Z'),
                        description: 'Delivered to Partner Facility'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-18T23:24:00.000Z'),
                        description: 'In transit'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-18T17:38:00.000Z'),
                        description: 'Enroute Processed'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-18T17:23:00.000Z'),
                        description: 'Arrived at Pick-up Location'
                    },
                    {
                        address: {
                            city: 'Grapevine',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-18T14:44:00.000Z'),
                        description: 'Arrived at Shipping Facility'
                    },
                    {
                        address: {
                            city: 'Carrollton',
                            country: null,
                            state: 'TX',
                            zip: null
                        },
                        date: new Date('2019-06-17T12:07:00.000Z'),
                        description: 'Electronic Shipping Info Received'
                    }
                ],
                shippedAt: new Date('2019-06-21T11:14:00.000Z'),
                url: 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=4204540992748927005269000020006828'
            };

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});

describe('Pitney Bowes', function() {
    this.timeout(20000);

    it('should return an error', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET,
                baseUrl: process.env.PITNEY_BOWES_API_BASE_URL
            }
        });

        bloodhound.track('0004290252994200071698133931119', 'Pitney Bowes', function(err) {
            assert.ifError(err);
            done();
        });
    });
});