const checkDigit = require('../util/checkDigit')
module.exports = function (trackingNumber) {
    const firstChar = `${(trackingNumber.charCodeAt(0) - 63) % 10}`;
    const remaining = trackingNumber.slice(1);
    trackingNumber = `${firstChar}${remaining}`;
    if (checkDigit(trackingNumber, [3, 1, 7], 10)) { return [true, true]; }
    return [false, false];


};