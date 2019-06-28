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

exports.parseLocation = function(address, callback) {
    callback(null, {
        city: 'Carrollton',
        state: 'TX',
        timzezone: 'America/Chicago'
    });
};