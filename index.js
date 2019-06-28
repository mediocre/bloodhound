const moment = require('moment-timezone');
const PitneyBowes = require('pitney-bowes');

const FedEx = require('./carriers/fedEx');

function Bloodhound(options) {
    const fedEx = new FedEx(options && options.fedEx);
    const pitneyBowes = new PitneyBowes(options && options.pitneyBowes);

    this.guessCarrier = function(trackingNumber) {
        if (fedEx.isTrackingNumberValid(trackingNumber)) {
            return 'FedEx';
        }

        return undefined;
    };

    this.track = function(trackingNumber, carrier, callback) {
        if (!trackingNumber) {
            return callback(new Error('Tracking number is not specified.'));
        }

        // Carrier is optional
        if (typeof carrier === 'function') {
            callback = carrier;
            carrier = undefined;
        }

        // Try to guess the carrier
        if (!carrier) {
            carrier = this.guessCarrier(trackingNumber);

            // If we still don't know the carrier return an error
            if (!carrier) {
                return callback(new Error('Unknown carrier.'));
            }
        }

        carrier = carrier.toLowerCase();

        if (carrier === 'fedex') {
            fedEx.track(trackingNumber, callback);
        } else if (carrier === 'newgistics') {
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