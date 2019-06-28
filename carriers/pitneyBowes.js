const moment = require('moment-timezone');
const PitneyBowesClient = require('pitney-bowes');

function PitneyBowes(options) {
    const pitneyBowes = new PitneyBowesClient(options);
    this.isTrackingNumberValid = function(trackingNumber) {
        //https://www.trackingmore.com/tracking-status-detail-en-240.html
        if ([/^\d{34}$/, /^420\d{31}$/, /^420\d{21}$/, /^420\d{19}$/].some(regex => regex.test(trackingNumber))){
            return true;
        }

        return false;
    };
    this.track = function(trackingNumber, callback) {
        pitneyBowes.tracking({ trackingNumber }, function (err, data) {
            if (err) {
                return callback(err);
            }

            const statuses = data.scanDetailsList.map(scanDetails => {
                return {
                    address: {
                        city: scanDetails.eventCity,
                        state: scanDetails.eventStateOrProvince
                    },
                    date: moment(`${scanDetails.eventDate} ${scanDetails.eventTime}`, 'YYYY-MM-DD HH:mm:ss').toDate(),
                    description: scanDetails.scanDescription
                };
            });

            callback(null, statuses);
        });
    }
}

module.exports = PitneyBowes;