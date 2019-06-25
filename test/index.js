const assert = require('assert');

const Bloodhound = require('../index.js');

describe('Newgistics', function() {
    it('4206336792748927005269000010615207', function(done) {
        const bloodhound = new Bloodhound({
            pitneyBowes: {
                api_key: process.env.PITNEY_BOWES_API_KEY,
                api_secret: process.env.PITNEY_BOWES_API_SECRET
            }
        });

        bloodhound.track('4206336792748927005269000010615207', 'newgistics', function(err) {
            assert.ifError(err);
            done();
        });
    });
});