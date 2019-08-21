const assert = require('assert');

const Bloodhound = require('../../index.js');

describe('Newgistics', function() {
    this.timeout(20000);

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
    this.timeout(20000);

    it('should return an error', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('0004290252994200071698133931119', 'Pitney Bowes', function(err) {
            assert.ifError(err);
            done();
        });
    });
});