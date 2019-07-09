# Bloodhound

[![Build Status](https://travis-ci.org/mediocre/bloodhound.svg?branch=master)](https://travis-ci.org/mediocre/bloodhound)
[![Coverage Status](https://coveralls.io/repos/github/mediocre/bloodhound/badge.svg)](https://coveralls.io/github/mediocre/bloodhound)

![Elvis Presley & Bloodhound - Photo - 1964](https://res.cloudinary.com/mediocre/image/upload/v1562632498/rpkudq0xpyysdty9nkzk.jpg)

Bloodhound is a Node.js package that allows you to retrieve data from shipping carriers (DHL, FedEx, UPS, USPS) in a common format.

This module was inspired by the excellent `shipit` module. We built Bloodhound to provide better support for parsing of timestamps (read more below).

## Features

**Common format** 

Bloodhound interfaces with several shipping carrier APIs and returns results in a single, unified format.
Each shipping carrier activity/movement/scan is represented as an event with a description, geographic location (city/state), and timestamp.

**Timestamps**

When it comes to timestamps there are two types of shipping carrier APIs: those that include a UTC offset which can be easily parsed as proper dates, and those that provide timestamp strings that need to be interepreted based on the local timezone of the geographic location for the event.

When Bloodhound encounters a timestamp without a UTC offset if looks up the timezone by geocoding the event's geographic location. The returned results contain proper dates in the correct timezone for the event.

**Carrier Guessing**

Bloodhound can guess the shipping carrier given a tracking number explicity through the `bloodhound.guessCarrier(trackingNumber)` method. Bloodhound will also try to guess the shipping carrier when tracking a package without specifying a carrier when using the `bloodhound.track(trackingNumber)` method.

**Shipped/Delivered Timestamps**

Bloodhound also...

## Supported Carriers
- FedEx
- USPS

## **Basic Usage**
### **Tracking**

`Bloodhound.track()` retrieves every status update, then returns an `event` array with uniform dates and time zones.

```javascript
const Bloodhound = require('@mediocre/bloodhound')

const bloodhound = new Bloodhound({
    fedEx: {
        account_number: FEDEX_ACCOUNT_NUMBER,
        environment: 'live',
        key: FEDEX_KEY,
        meter_number: FEDEX_METER_NUMBER,
        password: FEDEX_PASSWORD
    }
});

bloodhound.track(trackingNumber, carrier, callback)
...
```

```json
// Example Output

{
    "events": [
        {
            "address": {
                "city": "CARROLLTON", 
                "state": "TX", 
                "zip": "75010"
            },
            "date": "2019-06-30T18:03:00.000Z",
            "description": "Delivered, Front Door/Porch"
        },
        {
            "address": {
                "city": "CARROLLTON", 
                "state": "TX", 
                "zip": "75010"
            },
            "date": "2019-05-13T17:32:00.000Z",
            "description": "Sorting Complete"
        }
        ...
    ],
    "shippedAt": "2019-05-13T17:32:00.000Z",
    "deliveredAt": "2019-06-30T18:03:00.000Z"
}
```

### **Carrier Guessing**
If no carrier is provided, Bloodhound will intelligently guess the carrier based on the pattern of the tracking number.

```javascript
const trackingNumber = '61299998620341515252';
bloodhound.guessCarrier(trackingNumber)

// Returns 'FedEx'
```