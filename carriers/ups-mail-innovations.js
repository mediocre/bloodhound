const checkDigit = require('../util/checkDigit');

function UPSMailInnovations() {
    this.isTrackingNumberValid = function(trackingNumber) {
        // remove whitespace
        trackingNumber = trackingNumber.replace(/\s/g, '');
        trackingNumber = trackingNumber.toUpperCase();

        if ([/^[A-Z]{2}\d{9}[A-Z]{2}$/, /^926129\d{16}$/, /^927489\d{16}$/].some(regex => regex.test(trackingNumber))) {
            return true;
        }

        if (/^\d{20}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber, [3, 1], 10);
        }

        if (/^(91|92|93|94|95|96)\d{20}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber, [3, 1], 10);
        }

        if (/^\d{26}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber, [3, 1], 10);
        }

        if (/^420\d{27}$/.test(trackingNumber)) {
            return checkDigit(trackingNumber.match(/^420\d{5}(\d{22})$/)[1], [3, 1], 10);
        }

        if (/^420\d{31}$/.test(trackingNumber)) {
            if (checkDigit(trackingNumber.match(/^420\d{9}(\d{22})$/)[1], [3, 1], 10)) {
                return true;
            } else if (checkDigit(trackingNumber.match(/^420\d{5}(\d{26})$/)[1], [3, 1], 10)) {
                return true;
            }
        }

        return false;
    };
}

module.exports = UPSMailInnovations;