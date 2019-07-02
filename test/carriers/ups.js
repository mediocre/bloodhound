const assert = require('assert');

const Bloodhound = require('../../index');
// const UPS = require('../../carriers/ups');

describe.only('UPS', function(){
    const bloodhound = new Bloodhound({
        ups: {
            UPS_ACCESS_KEY: process.env.UPS_ACCESS_KEY,
            UPS_PASSWORD: process.env.UPS_PASSWORD,
            UPS_USERNAME: process.env.UPS_USERNAME
        }
    });

    it('should return a track response', function(done){
        bloodhound.track('1Z9756W90308462106', 'ups', function(err, actual) {
            const expected = {
                events : [
                    {
                        address: {
                            city: 'Glendale Heights',
                            state: 'IL',
                            country: 'US',
                            zipcode: '60139'
                        },
                        date: new Date('2019-06-28T16:28:58.000Z'),
                        description: 'Delivered'
                    },
                    {
                        address: {
                            city: 'Addison',
                            state: 'IL',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-28T14:00:49.000Z'),
                        description: 'Out For Delivery Today'
                    },
                    {
                        address: {
                            city: 'Addison',
                            state: 'IL',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-28T12:19:33.000Z'),
                        description: 'Loaded on Delivery Vehicle'
                    },
                    {
                        address: {
                            city: 'Addison',
                            state: 'IL',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-28T10:11:58.000Z'),
                        description: 'Destination Scan'
                    },
                    {
                        address: {
                            city: 'Addison',
                            state: 'IL',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-28T05:58:00.000Z'),
                        description: 'Arrival Scan'
                    },
                    {
                        address: {
                            city: 'Hodgkins',
                            state: 'IL',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-28T05:02:00.000Z'),
                        description: 'Departure Scan'
                    },
                    {
                        address: {
                            city: 'Hodgkins',
                            state: 'IL',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-27T13:33:00.000Z'),
                        description: 'Arrival Scan'
                    },
                    {
                        address: {
                            city: 'Cerritos',
                            state: 'CA',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-25T05:50:00.000Z'),
                        description: 'Departure Scan'
                    },
                    {
                        address: {
                            city: 'Cerritos',
                            state: 'CA',
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-25T02:48:00.000Z'),
                        description: 'Origin Scan'
                    },
                    {
                        address: {
                            city: 'Huez',
                            state: undefined,
                            country: 'US',
                            zipcode: null
                        },
                        date: new Date('2019-06-24T15:37:18.000Z'),
                        description: 'Order Processed: Ready for UPS'
                    }
                ]
            }
            assert.ifError(err);
            assert.deepStrictEqual(actual, expected);
            done();
        });
    });
});