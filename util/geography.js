const async = require('async');
const NodeGeocoder = require('node-geocoder');
const normalize = require('us-states-normalize');
const tzlookup = require('tz-lookup');

const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

function geocode(location, callback) {
    // Geocode the location
    async.retry(function(callback) {
        geocoder.geocode(location, callback);
    }, function(err, results) {
        if (err) {
            return callback(err);
        }

        if (!results.length) {
            return callback();
        }

        const firstResult = results[0];

        // Check to see if the first result has the data we need
        if (firstResult.city && firstResult.state && firstResult.zipcode) {
            return callback(null, firstResult);
        }

        // Reverse geocode to ensure we get a city, state, and zip
        async.retry(function(callback) {
            geocoder.reverse({ lat: firstResult.latitude, lon: firstResult.longitude }, callback);
        }, function(err, results) {
            if (err) {
                return callback(err);
            }

            callback(null, results[0]);
        });
    });
}

exports.addressToString = function(address) {
    var value = '';

    if (address.city) {
        value += address.city.trim();
    }

    if (address.state) {
        if (value) {
            value += ',';
        }

        value += ` ${address.state.trim()}`;
    }

    if (address.zip) {
        value += ` ${address.zip.trim()}`;
    }

    if (address.country) {
        if (value) {
            value += ',';
        }

        value += ` ${address.country.trim()}`;
    }

    return value.trim();
};

exports.parseLocation = async.memoize(function(location, callback) {
    geocode(location, function(err, result) {
        if (err) {
            return callback(err);
        }

        if (!result) {
            return callback();
        }

        callback(null, {
            city: result.city,
            state: normalize(result.state),
            timezone: tzlookup(result.latitude, result.longitude)
        });
    });
});