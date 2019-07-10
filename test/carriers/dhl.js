const assert = require('assert');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('DHL', function() {
    describe('dhl.isTrackingNumberValid', function() {
        const dhl = new DHL();

        const validTrackingNumbers = [
            '9374869903503911996562',
            '9374869903503912116716'
        ];

        it('should detect valid DHL tracking numbers', function() {
            validTrackingNumbers.forEach(trackingNumber => {
                if (!dhl.isTrackingNumberValid(trackingNumber)) {
                    assert.fail(`${trackingNumber} is not recognized as a valid DHL tracking number`);
                }
            });
        });
    });

    describe('Error Handling', function() {
        describe('Invalid DHL credentials', function() {
            const bloodhound = new Bloodhound({
                dhl: {
                    DHL_API_Key: process.env.DHL_API_Key
                }
            });

            this.timeout(15000);

            it.only('should return an error for invalid DHL credentials', function(done) {
                const bloodhound = new Bloodhound({
                    dhl: {
                        DHL_API_Key: 'asderiutykjbdfgkuyekrtjh834975jkhfgkuyi34uthi84787yijbnfiu7y4ijkb'
                    }
                });

                bloodhound.track('9374869903503911996586', 'dhl', function(err) {
                    assert(err);
                    done();
                })
            });

            it.only('should return an error for a tracking number that contains invalid characters', function(done) {
                bloodhound.track('asdfkhqowiuy98734587y', 'dhl', function(err) {
                    assert(err);
                    done();
                })
            })
        });
    });

    describe('dhl.track', function() {
        this.timeout(10000);

        const bloodhound = new Bloodhound({
            dhl: {
                DHL_API_Key: process.env.DHL_API_Key
            }
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
    })
});