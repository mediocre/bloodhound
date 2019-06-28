const moment = require('moment-timezone');
const PitneyBowesClient = require('pitney-bowes');

function PitneyBowes(options) {
    const pitneyBowes = new PitneyBowesClient(options);

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