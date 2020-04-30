# Bloodhound

[![Build Status](https://github.com/mediocre/bloodhound/workflows/build/badge.svg](https://github.com/mediocre/bloodhound/actions?query=workflow%3Abuild)
[![Coverage Status](https://coveralls.io/repos/github/mediocre/bloodhound/badge.svg)](https://coveralls.io/github/mediocre/bloodhound)

![Elvis Presley & Bloodhound - Photo - 1964](https://res.cloudinary.com/mediocre/image/upload/v1562632498/rpkudq0xpyysdty9nkzk.jpg)

Bloodhound is a Node.js package that allows you to retrieve tracking data from shipping carriers (DHL, FedEx, UPS, USPS) in a common format.

This module was inspired by the excellent `shipit` module. We built Bloodhound to provide better support for parsing of timestamps (read more below).

## Features

**Common format** 

Bloodhound interfaces with several carrier APIs and returns results in a single, unified format.
Each carrier activity/movement/scan is represented as an event with a description, geographic location (city/state), and timestamp.

**Timestamps**

When it comes to timestamps there are two types of carrier APIs: those that include a UTC offset which can be easily parsed as proper dates, and those that provide timestamp strings that need to be interepreted based on the local timezone of the geographic location for the event.

When Bloodhound encounters a timestamp without a UTC offset if looks up the timezone by geocoding the event's geographic location. The returned results contain proper dates in the correct timezone.

Geocode results are cached in-memory locally. Geocode results can optionally be cached remotely in Redis.

**Carrier Guessing**

Bloodhound can guess the carrier given a tracking number explicity through the `bloodhound.guessCarrier(trackingNumber)` method. Bloodhound will also try to guess the carrier when tracking a package without specifying a carrier when using the `bloodhound.track(trackingNumber)` method.

**Shipped/Delivered Dates**

Bloodhound also examines each of the activity/movement/scan events for "shipped" and "delievered" event types (beyond simple electronic events like "shipping label created" or "manifest file sent"). When a matching event type is encountered Bloodhound returns a `shippedAt` and `deliveredAt` date.

## Supported Carriers
- DHL
- FedEx
- UPS
- USPS

## Getting Started

```javascript
const Bloodhound = require('@mediocre/bloodhound');

const bloodhound = new Bloodhound({
    usps: {
        userId: 'USPS_USER_ID'
    }
});

bloodhound.track('tracking number', 'USPS', function(err, data) {
    console.log(data);
});
```

## API

### new Bloodhound(options)

Creates a new Bloodhound client. Each carrier requires a different combination of credentials (account numbers, meter numbers, passwords, user IDs, etc).

By default, when Bloodhound encounters a timestamp without a UTC offset it will geocode using OpenStreetMap (which does not require an API key). You can optionally use a different geocoder. You can also optionally cache geocode results in Redis.

```javascript
const Bloodhound = require('@mediocre/bloodhound');

const bloodhound = new Bloodhound({
    fedEx: {
        account_number: '123456789',
        environment: 'live',
        key: 'abcdefghijklmnop',
        meter_number: '987654321',
        password: 'abcdefghijklmnopqrstuvwxy'
    },
    geocoder: {
        apiKey: 'GOOGLE_API_KEY',
        language: 'en',
        provider: 'google',
        region: '.us'
    },
    pettyCache: {
        host: '127.0.0.1',
        options: {
            auth_pass: 'secret'
        },
        port: 6379
    },
    ups: {
        accessKey: 'ABCDEFGHIJKLMNOPQ',
        password: 'password',
        username: 'username',
    },
    usps: {
        userId: 'USPS_USER_ID'
    }
});

bloodhound.track('tracking number', 'FedEx', function(err, data) {
    console.log(data);
});
```

**fedEx**

FedEx options are passed to the [shipping-fedex](https://www.npmjs.com/package/shipping-fedex) module.

**geocoder**

By default Bloodhound uses the OpenStreetMap geocode provider. You can optionally specify geocoder options which are passed to the [node-geocode](https://www.npmjs.com/package/node-geocoder) module.

**pettyCache**

By default Bloodhound caches geocode results in-memory locally. You can optionally enable caching of geocoder results to a remote Redis server. These options are passed to the [petty-cache](https://www.npmjs.com/package/petty-cache) module.

**ups**

The UPS API requires a username, password, and an access key.

**usps**

The USPS API simply requires a user ID: https://www.usps.com/business/web-tools-apis/track-and-confirm-api.htm

### bloodhound.guessCarrier(trackingNumber)

Guesses the carrier of the specified tracking number.

```javascript
const carrier = bloodhound.guessCarrier('tracking number');
console.log(carrier);

```

### bloodhound.track(trackingNumber, [carrier,] callback)

Retrieves tracking data for the specified tracking number.

```javascript
bloodhound.track('tracking number', 'USPS', function(err, data) {
    console.log(data);
});
```

**Data**
```json
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
    ],
    "shippedAt": "2019-05-13T17:32:00.000Z",
    "deliveredAt": "2019-06-30T18:03:00.000Z"
}
```
