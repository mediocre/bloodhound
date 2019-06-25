const moment = require('moment-timezone');
const PitneyBowes = require('pitney-bowes');

function Bloodhound(options) {
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);

    this.track = function(trackingNumber, carrier, callback) {
        carrier = carrier.toLowerCase();

        if (carrier === 'newgistics') {
            pitneyBowes.tracking({ trackingNumber }, function(err, data) {
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
        } else {
            return callback(new Error(`Carrier ${carrier} is not supported.`));
        }
    };
}

module.exports = Bloodhound;