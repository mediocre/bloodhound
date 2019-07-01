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
            // actual.body.TrackResponse.Shipment.Package.Activity.forEach(activity => {
            //     console.log(JSON.stringify(activity, null, 4))
            // });
            assert.ifError(err);
            done();
        });
    });
});