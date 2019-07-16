const assert = require('assert');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('DHL', function() {
    this.timeout(20000);

    describe('dhl.isTrackingNumberValid', function() {
        const dhl = new DHL();

        const validTrackingNumbers = [
            '9361269903500576940071',
            '9361269903503907020237',
            '9361 2699 0350 3907 2657 75',
            '9261293148703201610999',
            '9261293148703201610975',
            '9261 2931 4870 3201 6109 82',
            '9474812901015476250258',
            '9374869903503907077381',
            '9374869903503907060802',
            '9374 8699 0350 3906 9887 18',
            '9274893148703201609685',
            '9274893148703201609715',
            '9274 8931 4870 3201 6096 92',
            '420941339405511899223428669715',
            '420206039405511899223428471196',
            '4203 7398 9405 5118 9922 3427 4906 00',
            '4204923092748927005269000022418209',
            '4209081092748927005269000022418407',
            '4200681292612927005269000029934812',
            '4209 2155 1234 9505 5000 2071 4300 0001 28'
        ];

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

    describe('Error Handling', function() {
        describe('Invalid DHL credentials', function() {
            const bloodhound = new Bloodhound({
                dhl: {
                    apiKey: process.env.DHL_API_Key
                }
            });

            it('should return an error for invalid DHL credentials', function(done) {
                const bloodhound = new Bloodhound({
                    dhl: {
                        apiKey: 'asderiutykjbdfgkuyekrtjh834975jkhfgkuyi34uthi84787yijbnfiu7y4ijkb'
                    }
                });

                bloodhound.track('9374869903503911996586', 'dhl', function(err) {
                    assert(err);
                    done();
                })
            });

            it('should return an error for a tracking number that contains invalid characters', function(done) {
                bloodhound.track('asdfkhqowiuy98734587y', 'dhl', function(err) {
                    assert(err);
                    done();
                })
            });
        });
    });

    describe('dhl.track', function() {
        const bloodhound = new Bloodhound({
            dhl: {
                apiKey: process.env.DHL_API_Key
            }
        });

        it('should return a valid response with no errors', function(done) {
            bloodhound.track('9374869903503927957359', 'dhl', function(err) {
                assert.ifError(err);
                done();
            })
        });

        it('Should return a track response', function(done) {
            bloodhound.track('9374869903503911996586', 'dhl', function(err, actual) {
                assert.ifError(err);

                const expected = {
                    events: [
                        {
                            address: {
                                city: 'NYC',
                                zip: '11236',
                                state: 'NY'
                            },
                            date: new Date('2019-07-09T15:52:00.000Z'),
                            description: 'DELIVERED'
                        },
                        {
                            address: {
                                city: 'NYC',
                                zip: '11236',
                                state: 'NY'
                            },
                            date: new Date('2019-07-09T14:49:00.000Z'),
                            description: 'EN ROUTE TO DELIVERY LOCATION'
                        },
                        {
                            address: {
                                city: 'NYC',
                                zip: '11236',
                                state: 'NY'
                            },
                            date: new Date('2019-07-09T14:40:00.000Z'),
                            description: 'Out for Delivery'
                        },
                        {
                            address: {
                                city: 'NYC',
                                zip: '11236',
                                state: 'NY'
                            },
                            date: new Date('2019-07-09T14:30:00.000Z'),
                            description: 'Sorting Complete'
                        },
                        {
                            address: {
                                city: 'NYC',
                                zip: '11236',
                                state: 'NY'
                            },
                            date: new Date('2019-07-09T08:28:00.000Z'),
                            description: 'ARRIVAL AT POST OFFICE'
                        },
                        {
                            address: {
                                city: 'NYC',
                                zip: '11236',
                                state: 'NY'
                            },
                            date: new Date('2019-07-09T07:13:00.000Z'),
                            description: 'Arrived USPS Sort Facility'
                        },
                        {
                            address: {
                                city: 'Avenel',
                                zip: '07001',
                                state: 'NJ'
                            },
                            date: new Date('2019-07-06T10:59:53.000Z'),
                            description: 'TENDERED TO DELIVERY SERVICE PROVIDER'
                        },
                        {
                            address: {
                                city: 'Avenel',
                                zip: '07001',
                                state: 'NJ'
                            },
                            date: new Date('2019-07-06T06:54:28.000Z'),
                            description: 'ARRIVAL DESTINATION DHL ECOMMERCE FACILITY'
                        },
                        {
                            address: {
                                city: 'Compton',
                                zip: '90220',
                                state: 'CA'
                            },
                            date: new Date('2019-07-03T05:04:06.000Z'),
                            description: 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY'
                        },
                        {
                            address: {
                                city: 'Compton',
                                zip: '90220',
                                state: 'CA'
                            },
                            date: new Date('2019-07-02T05:09:37.000Z'),
                            description: 'Processed'
                        },
                        {
                            address: {
                                city: 'Compton',
                                zip: '90220',
                                state: 'CA'
                            },
                            date: new Date('2019-07-02T00:59:40.000Z'),
                            description: 'ARRIVAL AT DHL ECOMMERCE DISTRIBUTION CENTER'
                        },
                        {
                            address: {
                                city: '',
                                zip: ''
                            },
                            date: new Date('2019-07-01T21:41:38.000Z'),
                            description: 'EN ROUTE TO DHL ECOMMERCE'
                        },
                        {
                            address: {
                                city: '',
                                zip: ''
                            },
                            date: new Date('2019-07-01T21:38:35.000Z'),
                            description: 'Electronic Notification Received: Your order has been processed and tracking will be updated soon'
                        }
                    ],
                    deliveredAt: new Date('2019-07-09T15:52:00.000Z'),
                    shippedAt: new Date('2019-07-02T00:59:40.000Z')
                };

                assert.deepStrictEqual(actual, expected);
                done();
            });
        });

        it('Delivered', function(done) {
            bloodhound.track('9374869903503912434773', 'dhl', function(err, actual) {
                assert.ifError(err);

                const expected = {
                    events: [
                        {
                            address: {
                                city: 'Port St. Lucie',
                                zip: '34983',
                                state: 'FL'
                            },
                            date: new Date ('2019-07-09T19:55:00.000Z'),
                            description: 'DELIVERED'
                        },
                        {
                            address: {
                                city: 'Port St. Lucie',
                                zip: '34983',
                                state: 'FL'
                            },
                            date: new Date ('2019-07-09T14:56:00.000Z'),
                            description: 'Out for Delivery'
                        },
                        {
                            address: {
                                city: 'Port St. Lucie',
                                zip: '34983',
                                state: 'FL'
                            },
                            date: new Date ('2019-07-09T14:46:00.000Z'),
                            description: 'Sorting Complete'
                        },
                        {
                            address: {
                                city: 'Fort Pierce, FL, US',
                                zip: '34981',
                                state: 'FL'
                            },
                            date: new Date ('2019-07-09T08:57:00.000Z'),
                            description: 'ARRIVAL AT POST OFFICE'
                        },
                        {
                            address: {
                                city: 'Fort Pierce, FL, US',
                                zip: '34981',
                                state: 'FL'
                            },
                            date: new Date('2019-07-09T07:42:00.000Z'),
                            description: 'Arrived USPS Sort Facility'
                        },
                        {
                            address: {
                                city: 'Orlando',
                                zip: '32822',
                                state: 'FL'
                            },
                            date: new Date ('2019-07-08T17:09:08.000Z'),
                            description: 'TENDERED TO DELIVERY SERVICE PROVIDER'
                        },
                        {
                            address: {
                                city: 'Orlando',
                                zip: '32822',
                                state: 'FL'
                            },
                            date: new Date ('2019-07-07T16:52:06.000Z'),
                            description: 'ARRIVAL DESTINATION DHL ECOMMERCE FACILITY'
                        },
                        {
                            address: {
                                city: 'Compton',
                                zip: '90220',
                                state: 'CA'
                            },
                            date: new Date ('2019-07-02T21:21:17.000Z'),
                            description: 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY'
                        },
                        {
                            address: {
                                city: 'Compton',
                                zip: '90220',
                                state: 'CA'
                            },
                            date: new Date ('2019-07-02T14:27:26.000Z'),
                            description: 'Processed'
                        },
                        {
                            address: {
                                city: 'Compton',
                                zip: '90220',
                                state: 'CA'
                            },
                            date: new Date ('2019-07-02T00:59:40.000Z'),
                            description: 'ARRIVAL AT DHL ECOMMERCE DISTRIBUTION CENTER'
                        },
                        {
                            address: {
                                city: '',
                                zip: ''
                            },
                            date: new Date ('2019-07-01T21:41:38.000Z'),
                            description: 'EN ROUTE TO DHL ECOMMERCE'
                        },
                        {
                            address: {
                                city: '',
                                zip: ''
                            },
                            date: new Date ('2019-07-01T21:38:35.000Z'),
                            description: 'Electronic Notification Received: Your order has been processed and tracking will be updated soon'
                        }
                    ],
                    deliveredAt: new Date ('2019-07-09T19:55:00.000Z'),
                    shippedAt: new Date ('2019-07-02T00:59:40.000Z')
                }
                assert.deepStrictEqual(actual, expected);
                done();

            });
        });

    })
});