const assert = require('assert');
const Bloodhound = require('../../index');
const USPS = require('../../carriers/usps.js')

describe('usps.isTrackingNumberValid', function() {
    const usps = new USPS();

    const validTrackingNumbers = [
        '9400111899223818218407',
        '9400 1118 9922 3818 2184 07',
        '9400 1118 9956 1482 6100 74',
        '9400 1118 9922 3837 8204 90',
        '9400 1118 9922 3837 8611 41',
        '9400111699000271800200',
        '9405511699000273008898',
        '9400111899223830191139',
        '9400111899223830191054',
        '9400111899223830191368',
        '9405511899223830661741',
        '9405503699300049053172',
        '9400109699938860246573',
        '94 0010 9699 9388 6024 6573',
        '420921559505500020714300000128',
        '420 92155 95 0550 0020 7143 0000 0128',
        '4209215512349505500020714300000128',
        '420 92155 1234 95 0550 0020 7143 0000 0128',
        'EC207920162US',
        'EC 207 920 162 US',
        'ec 207 920 162 us',
        '9274899992136003821767',
        '92 7489 9992 1360 0382 1767',
        '92023901003036542400961407',
        '92748999997295513123034457',
        '92748901377803583000610270',
        '4205690192023901019233001401555746',
        '70131710000012912087'
    ];

    it('should detect valid USPS tracking numbers', function() {
        validTrackingNumbers.forEach(trackingNumber => {
            if (!usps.isTrackingNumberValid(trackingNumber)) {
                assert.fail(`${trackingNumber} is not recognized as a valid USPS tracking number`);
            }
        });
    });
});

describe('USPS', function () {
    this.timeout(10000);

    const bloodhound = new Bloodhound({
        usps: {
            userId: process.env.USPS_USERID
        }
    });

    describe('Invalid USPS Access', function() {
        const bloodhound = new Bloodhound({
            usps: {
                baseUrl: 'https://google.com',
                userId: process.env.USPS_USERID
            }
        });

        it('should return an error for invalid URL', function (done) {
            bloodhound.track('9400111899223837861141', 'usps', function (err) {
                assert(err);
                done();
            });
        })
    });

    describe('Invalid USPS Credentials', function () {
        it('should return an error for invalid USERID', function (done) {
            const bloodhound = new Bloodhound({
                usps: {
                    userId: 'invalid'
                }
            });

            bloodhound.track('9400111899223837861141', 'usps', function (err) {
                assert(err);
                done();
            });
        });

        it('should return an error for a tracking number that contains invalid characters', function (done) {
            bloodhound.track('12c &^trackf0', 'usps', function (err) {
                assert(err);
                done();
            })
        })
    });

    describe('USPS Tracking', function () {
        it.only('should return an empty result if there is no tracking information available ', function (done) {
            bloodhound.track('0987654321234567890', 'usps', function (err, actual) {
                const expected = {
                    events: []
                }

                assert.ifError(err);
                assert.deepStrictEqual(actual, expected);
                done();
            });
        });

        it('should return tracking information with no errors', function (done) {
            bloodhound.track('9400111899223835077162', 'usps', function (err) {
                assert.ifError(err);
                done();
            });
        });

        it('should provide all information for a delivered shipment', function (done) {
            bloodhound.track('9400111899223835077162', 'usps', function (err, actual) {
                assert.ifError(err);

                const expected = {
                    events: [
                        {
                            address: {
                                city: 'NYC',
                                country: '',
                                state: 'NY',
                                zip: '10029'
                            },
                            date: new Date('2019-07-01T19:25:00.000Z'),
                            description: 'Delivered, In/At Mailbox',
                            details: 'Your item was delivered in or at the mailbox at 3:25 pm on July 1, 2019 in NEW YORK, NY 10029.'
                        },
                        {
                            address: {
                                city: 'NYC',
                                country: '',
                                state: 'NY',
                                zip: '10029'
                            },
                            date: new Date('2019-07-01T12:44:00.000Z'),
                            description: 'Out for Delivery'
                        },
                        {
                            address: {
                                city: 'NYC',
                                country: '',
                                state: 'NY',
                                zip: '10029'
                            },
                            date: new Date('2019-07-01T12:34:00.000Z'),
                            description: 'Sorting Complete'
                        },
                        {
                            address: {
                                city: 'NYC',
                                country: '',
                                state: 'NY',
                                zip: '10022'
                            },
                            date: new Date('2019-06-30T22:02:00.000Z'),
                            description: 'Arrived at Hub'
                        },
                        {
                            address: {
                                city: 'NYC',
                                country: '',
                                state: 'NY',
                                zip: ''
                            },
                            date: new Date('2019-06-30T05:19:00.000Z'),
                            description: 'Arrived at USPS Regional Destination Facility'
                        },
                        {
                            address: {
                                city: 'Santa Clarita',
                                country: '',
                                state: 'CA',
                                zip: ''
                            },
                            date: new Date('2019-06-29T02:27:00.000Z'),
                            description: 'Departed USPS Regional Facility'
                        },
                        {
                            address: {
                                city: 'Santa Clarita',
                                country: '',
                                state: 'CA',
                                zip: ''
                            },
                            date: new Date('2019-06-29T02:26:00.000Z'),
                            description: 'Arrived at USPS Regional Facility'
                        },
                        {
                            address: {
                                city: 'Carrollton',
                                country: '',
                                state: 'TX',
                                zip: '75010'
                            },
                            date: new Date('2019-06-27T23:57:00.000Z'),
                            description: 'Shipping Label Created, USPS Awaiting Item'
                        }
                    ],
                    deliveredAt: new Date('2019-07-01T19:25:00.000Z'),
                    shippedAt: new Date('2019-06-30T22:02:00.000Z')
                }

                assert.deepStrictEqual(actual, expected);
                done();
            });
        });
        it('should skip Track Details that do no have time stamps', function (done) {
            bloodhound.track('9400110200830244685403', 'usps', function (err) {
                assert.ifError(err);
                done();
            });
        })
    });
});