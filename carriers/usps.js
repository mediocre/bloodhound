const builder = require('xmlbuilder');
const moment = require('moment-timezone');
const parser = require('xml2js');
const request = require('request');

const CITY_BLACKLIST = /DISTRIBUTION CENTER/ig;

function USPS(options) {
    this.isTrackingNumberValid = function(trackingNumber) {
        if ([/^(91|92|93|94|95|96)\d{20}$/, /^(91|92|93|94|95|96)\d{18}$/, /^940\d{19}$/, /^940\d{17}$/, /^\d{22}$/, /^\d{20}$/].some(regex => regex.test(trackingNumber))){
            return true;
        }

        return false;
    };
    this.track = function(trackingNumber, callback) {
        const host = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=';

        const obj = {
            TrackFieldRequest: {
                '@USERID': options.USERID,
                Revision: '1',
                ClientIp: options.ClientIp || '127.0.0.1',
                SourceId: options.SourceId || 'Mediocre/bloodhound',
                TrackID: {
                    '@ID': trackingNumber
                }
            }
        }

        var xml = builder.create(obj, { headless: true }).end({ pretty: false });
        const url = host + encodeURIComponent(xml);

        request(url, function (err, res) {
            if (err) {
                return callback(err);
            }

            parser.parseString(res.body, function (err, data) {
                // Kind of like checking status code?
                // 1. Invalid XML in parser
                // 2. Invalid credentials
                // 3. Invalid tracking number
                if (err) {
                    return callback(err);
                } else if (data.Error) {
                    return callback(new Error(data.Error.Description[0]));
                } else if (data.TrackResponse.TrackInfo[0].Error) {
                    return callback(new Error(data.TrackResponse.TrackInfo[0].Error[0].Description[0]));
                }

                var statuses = [];

                // TrackSummary[0] exists for every item (with valid tracking number)
                const summary = data.TrackResponse.TrackInfo[0].TrackSummary[0];

                // If we have tracking details, push them into statuses
                // Tracking details only exist if the item has more than one status update
                if (data.TrackResponse.TrackInfo[0].TrackDetail) {
                    statuses = data.TrackResponse.TrackInfo[0].TrackDetail.map(scanDetails => {
                        return {
                            address: {
                                city: scanDetails.EventCity[0].replace(CITY_BLACKLIST, '').trim(),
                                state: scanDetails.EventState[0],
                                zip: scanDetails.EventZIPCode[0]
                            },
                            date: moment(`${scanDetails.EventDate[0]} ${scanDetails.EventTime[0]}`, 'MMMM D, YYYY h:mm a').toDate(),
                            description: scanDetails.Event[0]
                        };
                    });
                }

                // Push TrackSummary since it always exists
                statuses.push({
                    address: {
                        city: summary.EventCity[0],
                        state: summary.EventState[0]
                    },
                    date: moment(`${summary.EventDate[0]} ${summary.EventTime[0]}`, 'MMMM D, YYYY h:mm a').toDate(),
                    description: data.TrackResponse.TrackInfo[0].StatusSummary[0]
                });

                return callback(null, statuses);
            });
        });
    }
}

module.exports = USPS;