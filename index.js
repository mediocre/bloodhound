const PitneyBowes = require('./carriers/pitneyBowes');
const FedEx = require('./carriers/fedEx');
const USPS = require('./carriers/usps');

function Bloodhound(options) {
    const fedEx = new FedEx(options && options.fedEx);
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);
    const usps = new USPS(options && options.usps);

    this.track = function(trackingNumber, carrier, callback) {
        if (!trackingNumber) {
            return callback(new Error('Tracking number is not specified.'));
        }

        if (!carrier) {
            return callback(new Error('Carrier is not specified.'));
        }

        carrier = carrier.toLowerCase();

        if (carrier === 'fedex') {
            fedEx.track(trackingNumber, callback);
        } else if (carrier === 'newgistics') {
            pitneyBowes.track(trackingNumber, callback);
        } else if (carrier === 'usps') {
            usps.track(trackingNumber, callback);
        } else {
            return callback(new Error(`Carrier ${carrier} is not supported.`));
        }
    };
}

module.exports = Bloodhound;