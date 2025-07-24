const assert = require('assert');

const Bloodhound = require('../../index.js');

describe('Newgistics', function() {
    this.timeout(30000);

    it('should return an error for invalid base URL', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                baseUrl: 'https://httpbin.org/status/500#'
            }
        });

        bloodhound.track('9400111899223837861141', 'newgistics', function(err) {
            assert(err);
            done();
        });
    });
});

describe('Pitney Bowes', function() {
    this.timeout(30000);

    it.skip('should not return an error', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4203300992612927005269000093974783', { carrier: 'Pitney Bowes', minDate: new Date('2020-08-06T14:10:56.000Z') }, function(err) {
            assert.ifError(err);
            done();
        });
    });
});