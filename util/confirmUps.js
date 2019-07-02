module.exports = function(trackingNumber) {
    let sum = 0;
    for (let index = 2; index <= 16; index++) {
        var num;
        const asciiValue = trackingNumber[index].charCodeAt(0);
        if ((asciiValue >= 48) && (asciiValue <= 57)) {
            num = parseInt(trackingNumber[index], 10);
        } else {
            num = (asciiValue - 63) % 10;
        }

        if ((index % 2) !== 0) { num = num * 2; }
        sum += num;
    }

    const checkdigit = (sum % 10) > 0 ? 10 - (sum % 10) : 0;
    if (checkdigit === parseInt(trackingNumber[17], 10)) { return [true, true]; }
    return [false, false];
};