const assert = require('assert');

const Bloodhound = require('../../index');
const DHL = require('../../carriers/dhl');

describe('DHL', function() {
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
});

describe('dhl.track', function() {
    this.timeout(10000);

    const bloodhound = new Bloodhound();

    it.skip('should return a valid response with no errors', function(done) {
        bloodhound.track('9374869903503911996586', 'dhl', function(err) {
            assert.ifError(err);
            done();
        });
    });

    it.skip('Delivered', function(done) {
        bloodhound.track('9374869903503912434773', 'dhl', function(err, actual) {
            assert.ifError(err);

            const expected = {
                carrier: 'DHL',
                events: [
                    {
                        address: {
                            city: 'Port Saint Lucie',
                            country: 'US',
                            state: 'FL',
                            zip: '34983'
                        },
                        date: new Date('2019-07-09T18:55:00.000Z'),
                        description: 'DELIVERED'
                    },
                    {
                        address: {
                            city: 'Port Saint Lucie',
                            country: 'US',
                            state: 'FL',
                            zip: '34983'
                        },
                        date: new Date('2019-07-09T13:56:00.000Z'),
                        description: 'OUT FOR DELIVERY'
                    },
                    {
                        address: {
                            city: 'Port Saint Lucie',
                            country: 'US',
                            state: 'FL',
                            zip: '34983'
                        },
                        date: new Date('2019-07-09T13:46:00.000Z'),
                        description: 'SORTING COMPLETE'
                    },
                    {
                        address: {
                            city: 'Fort Pierce',
                            country: 'US',
                            state: 'FL',
                            zip: '34981'
                        },
                        date: new Date('2019-07-09T07:57:00.000Z'),
                        description: 'ARRIVAL AT POST OFFICE'
                    },
                    {
                        address: {
                            city: 'Fort Pierce',
                            country: 'US',
                            state: 'FL',
                            zip: '34981'
                        },
                        date: new Date('2019-07-09T06:42:00.000Z'),
                        description: 'ARRIVED USPS SORT FACILITY'
                    },
                    {
                        address: {
                            city: 'Orlando',
                            country: 'US',
                            state: 'FL',
                            zip: '32822'
                        },
                        date: new Date('2019-07-08T16:09:08.000Z'),
                        description: 'TENDERED TO DELIVERY SERVICE PROVIDER'
                    },
                    {
                        address: {
                            city: 'Orlando',
                            country: 'US',
                            state: 'FL',
                            zip: '32822'
                        },
                        date: new Date('2019-07-07T15:52:06.000Z'),
                        description: 'ARRIVAL DESTINATION DHL ECOMMERCE FACILITY'
                    },
                    {
                        address: {
                            city: 'Compton',
                            country: 'US',
                            state: 'CA',
                            zip: '90220'
                        },
                        date: new Date('2019-07-02T23:21:17.000Z'),
                        description: 'DEPARTURE ORIGIN DHL ECOMMERCE FACILITY'
                    },
                    {
                        address: {
                            city: 'Compton',
                            country: 'US',
                            state: 'CA',
                            zip: '90220'
                        },
                        date: new Date('2019-07-02T16:27:26.000Z'),
                        description: 'PROCESSED'
                    },
                    {
                        address: {
                            city: 'Compton',
                            country: 'US',
                            state: 'CA',
                            zip: '90220'
                        },
                        date: new Date('2019-07-02T02:59:40.000Z'),
                        description: 'ARRIVAL AT DHL ECOMMERCE DISTRIBUTION CENTER'
                    },
                    {
                        address: {
                            city: 'LOS ANGELES',
                            country: 'US',
                            state: 'CA',
                            zip: '90021'
                        },
                        date: new Date('2019-07-01T20:41:38.000Z'),
                        description: 'EN ROUTE TO DHL ECOMMERCE'
                    },
                    {
                        address: {
                            city: 'LOS ANGELES',
                            country: 'US',
                            state: 'CA',
                            zip: '90021'
                        },
                        date: new Date('2019-07-01T20:38:35.000Z'),
                        description: 'ELECTRONIC NOTIFICATION RECEIVED: YOUR ORDER HAS BEEN PROCESSED AND TRACKING WILL BE UPDATED SOON'
                    }
                ],
                deliveredAt: new Date('2019-07-09T18:55:00.000Z'),
                shippedAt: new Date('2019-07-09T13:56:00.000Z'),
                url: 'http://webtrack.dhlglobalmail.com/?trackingnumber=9374869903503912434773'
            }

            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});