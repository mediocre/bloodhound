const NodeGeocoder = require('node-geocoder');
const PitneyBowes = require('./carriers/pitneyBowes');
const UPS = require('./carriers/ups');
const FedEx = require('./carriers/fedEx');
const USPS = require('./carriers/usps');
const DHL = require('./carriers/dhl');

const geography = require('./util/geography');

function Bloodhound(options) {
    // Options are optional
    if (!options) {
        options = {};
    }

    // Optionally specify geocoder options
    if (options.geocoder) {
        geography.geocoder = NodeGeocoder(options.geocoder);
    }

    if (options.pettyCache) {
        // Allow DHL to cache geocode results in Redis (via petty-cache)
        if (options.dhl) {
            options.dhl.pettyCache = options.pettyCache;
        }

        // Allow PitneyBowes to cache geocode results in Redis (via petty-cache)
        if (options.pitneyBowes) {
            options.pitneyBowes.pettyCache = options.pettyCache;
        }

        // Allow UPS to cache geocode results in Redis (via petty-cache)
        if (options.ups) {
            options.ups.pettyCache = options.pettyCache;
        }

        // Allow USPS to cache geocode results in Redis (via petty-cache)
        if (options.usps) {
            options.usps.pettyCache = options.pettyCache;
        }
    }

    // Ensure DHL options exist
    if (!options.dhl) {
        options.dhl = {};
    }

    // Allow DHL to use USPS
    if (options.usps) {
        options.dhl.usps = options.usps;
    }

    // Allow UPS to use USPS for UPS Mail Innovations tracking numbers
    if (options.ups && options.usps) {
        options.ups.usps = options.usps;
    }

    const dhl = new DHL(options && options.dhl);
    const fedEx = new FedEx(options && options.fedEx);
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);
    const ups = new UPS(options && options.ups);
    const usps = new USPS(options && options.usps);

    this.guessCarrier = function(trackingNumber) {
        if (dhl.isTrackingNumberValid(trackingNumber)) {
            return 'DHL';
        } else if (fedEx.isTrackingNumberValid(trackingNumber)) {
            return 'FedEx';
        } else if (ups.isTrackingNumberValid(trackingNumber)) {
            return 'UPS';
        } else if (usps.isTrackingNumberValid(trackingNumber)) {
            return 'USPS';
        } else {
            return undefined;
        }
    };

    this.track = function(trackingNumber, options, callback) {
        if (!trackingNumber) {
            return callback(new Error('Tracking number is not specified.'));
        }

        // Options are optional
        if (typeof options === 'function') {
            options = {};
            callback = options;
        }

        // Backwards compatibility
        if (typeof options === 'string') {
            options = {
                carrier: options
            };
        }

        // Try to guess the carrier
        if (!options.carrier) {
            options.carrier = this.guessCarrier(trackingNumber);

            // If we still don't know the carrier return an error
            if (!options.carrier) {
                return callback(new Error('Unknown carrier.'));
            }
        }

        options.carrier = options.carrier.toLowerCase();
        trackingNumber = trackingNumber.replace(/\s/g, '');
        trackingNumber = trackingNumber.toUpperCase();

        if (options.carrier === 'dhl') {
            dhl.track(trackingNumber, options, callback);
        } else if (options.carrier === 'fedex') {
            fedEx.track(trackingNumber, options, callback);
        } else if (options.carrier === 'newgistics') {
            pitneyBowes.track(trackingNumber, options, callback);
        } else if (options.carrier === 'pitney bowes') {
            pitneyBowes.track(trackingNumber, options, callback);
        } else if (options.carrier === 'ups'){
            ups.track(trackingNumber, options, callback);
        } else if (options.carrier === 'usps') {
            usps.track(trackingNumber, options, callback);
        } else {
            return callback(new Error(`Carrier ${options.carrier} is not supported.`));
        }
    };
}

module.exports = Bloodhound;