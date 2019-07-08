# **Bloodhound**

[![Build Status](https://travis-ci.org/mediocre/bloodhound.svg?branch=master)](https://travis-ci.org/mediocre/bloodhound)
[![Coverage Status](https://coveralls.io/repos/github/mediocre/bloodhound/badge.svg)](https://coveralls.io/github/mediocre/bloodhound)

Bloodhound is a single-source node module that allows you to retrieve data from shipping carriers such as FedEx and USPS, and displays the data in a common format. If available, Bloodhound will use tracking APIs to generate the data, alternatively it will use web-scraping methods. It goes above and beyond to parse dates by returning all dates in a uniform format, so that the hassle of interpreting multiple carriers' dates and times is removed.

## **Installation**
```
npm install @mediocre/bloodhound
```

```
yarn add @mediocre/bloodhound
```

## **Features**
**Dates and Time Zones** 

Bloodhound contains a date parser that handles every carrier's individual date format and returns a uniform format.

**Statuses** 

Bloodhound retrieves each status update and returns a uniform `event` object that contains the `address`, `date`, and `description` of each event. 

**Carrier Guessing** 

Bloodhound guesses the carrier that a tracking number belongs to if a carrier is not specified.

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

## **Supported Carriers**
- FedEx

- Pitney-Bowes (Newgistics)

- UPS (coming soon)

- USPS


## **Tests**

FedEx
```
FEDEX_ACCOUNT_NUMBER=YOUR_FEDEX_ACCOUNT_NUMBNER FEDEX_ENVIRONMENT=sandbox FEDEX_KEY=YOUR_FEDEX_KEY FEDEX_METER_NUMBER=YOUR_FEDEX_METER FEDEX_PASSWORD=YOUR_FEDEX_PASSWORD npm test
```

Pitney-Bowes
```
PITNEY_BOWES_API_KEY=YOUR_PITNEY_BOWES_KEY PITNEY_BOWES_API_SECRET=YOUR_PITNEY_BOWES_SECRET npm test
```

UPS
```
UPS_USERNAME=YOUR_UPS_USERNAME UPS_PASSWORD=YOUR_UPS_PASSWORD UPS_ACCESS_KEY=YOUR_UPS_KEY  npm test
```

USPS
```
USPS_USERID=YOU_USPS_USERID npm test
```





## **Contributing**
Please refer to each project's style and contribution guidelines for submitting patches and additions. In general, we follow the "fork-and-pull" Git workflow.

1. Fork the repo on GitHub
2. Clone the project to your own machine
3. Commit changes to your own branch
4. Push your work back up to your fork
5. Submit a Pull request so that we can review your changes

NOTE: Be sure to merge the latest from "upstream" before making a pull request!