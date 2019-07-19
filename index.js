const NodeGeocoder = require('node-geocoder');
const PitneyBowes = require('./carriers/pitneyBowes');
const FedEx = require('./carriers/fedEx');
const USPS = require('./carriers/usps');
const DHL = require('./carriers/dhl');

const geography = require('./util/geography');

function Bloodhound(options) {
    // Optionally specify geocoder options
    if (options && options.geocoder) {
        geography.geocoder = NodeGeocoder(options.geocoder);
    }

    // Allow PitneyBowes to cache geocode results in Redis (via petty-cache)
    if (options && options.pettyCache && options.pitneyBowes) {
        options.pitneyBowes.pettyCache = options.pettyCache;
    }

    // Allow USPS to cache geocode results in Redis (via petty-cache)
    if (options && options.pettyCache && options.usps) {
        options.usps.pettyCache = options.pettyCache;
    }

    const fedEx = new FedEx(options && options.fedEx);
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);
    const usps = new USPS(options && options.usps);
    const dhl = new DHL(options && options.dhl);

    this.guessCarrier = function(trackingNumber) {
        if (fedEx.isTrackingNumberValid(trackingNumber)) {
            return 'FedEx';
        } else if (usps.isTrackingNumberValid(trackingNumber)) {
            return 'USPS';
        } else if (dhl.isTrackingNumberValid(trackingNumber)) {
            return 'DHL';
        } else {
            return undefined;
        }
    };

    this.track = function(trackingNumber, carrier, callback) {
        if (!trackingNumber) {
            return callback(new Error('Tracking number is not specified.'));
        }

        // Carrier is optional
        if (typeof carrier === 'function') {
            callback = carrier;
            carrier = undefined;
        }

        // Try to guess the carrier
        if (!carrier) {
            carrier = this.guessCarrier(trackingNumber);

            // If we still don't know the carrier return an error
            if (!carrier) {
                return callback(new Error('Unknown carrier.'));
            }
        }

        carrier = carrier.toLowerCase();

        if (carrier === 'fedex') {
            fedEx.track(trackingNumber, callback);
        } else if (carrier === 'newgistics') {
            pitneyBowes.track(trackingNumber, callback);
        } else if (carrier === 'usps') {
            usps.track(trackingNumber, callback);
        } else if (carrier === 'dhl') {
            dhl.track(trackingNumber, callback);
        } else {
            return callback(new Error(`Carrier ${carrier} is not supported.`));
        }
    };
}

module.exports = Bloodhound;