const async = require('async');
const NodeGeocoder = require('node-geocoder');
const normalize = require('us-states-normalize');
const PettyCache = require('petty-cache');
const tzlookup = require('tz-lookup');

var pettyCache;

function geocode(location, callback) {
    async.auto({
        geocode: function(callback) {
            // Geocode the location
            async.retry(function(callback) {
                exports.geocoder.geocode(location, callback);
            }, function(err, results) {
                if (err) {
                    return callback(err);
                }

                if (!results.length) {
                    return callback();
                }

                var firstResult = results[0];

                // Handle Google results
                if (!firstResult.state && firstResult.administrativeLevels && firstResult.administrativeLevels.level1short) {
                    firstResult.state = firstResult.administrativeLevels.level1short;
                }

                // Check to see if the first result has the data we need
                if (firstResult.city && firstResult.state && firstResult.zipcode) {
                    return callback(null, firstResult);
                }

                // Reverse geocode to ensure we get a city, state, and zip
                async.retry(function(callback) {
                    exports.geocoder.reverse({ lat: firstResult.latitude, lon: firstResult.longitude }, callback);
                }, function(err, results) {
                    if (err) {
                        return callback(err);
                    }

                    var firstResult = results[0];

                    // Handle Google results
                    if (!firstResult.state && firstResult.administrativeLevels && firstResult.administrativeLevels.level1short) {
                        firstResult.state = firstResult.administrativeLevels.level1short;
                    }

                    callback(null, results[0]);
                });
            });
        }
    }, function(err, results) {
        if (err) {
            return callback(err);
        }

        if (!results.geocode) {
            return callback();
        }

        callback(null, {
            city: results.geocode.city,
            state: normalize(results.geocode.state),
            timezone: tzlookup(results.geocode.latitude, results.geocode.longitude)
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

exports.parseLocation = async.memoize(function(location, options, callback) {
    // Options are optional
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }

    // Use Redis (via Petty Cache)
    if (options && options.pettyCache) {
        if (!pettyCache) {
            pettyCache = new PettyCache(options.pettyCache.port, options.pettyCache.host, options.pettyCache.options);
        }

        // Cache between 1-2 months
        return pettyCache.fetch(`bloodhound.geocode:${location}`, function(callback) {
            geocode(location, callback);
        }, { ttl: { min: 2592000000, max: 5184000000 } }, callback);
    }

    geocode(location, callback);
});

exports.geocoder = NodeGeocoder({
    apiKey: 'AIzaSyDNcJwFa-Z0aDxNJVb2IigwWw5kUm7g7z4',
    language: 'en',
    provider: 'google',
    region: '.us'
});