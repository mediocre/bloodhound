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
**Dates and Time Zones** Bloodhound contains a date parser that handles every carrier's individual date format and returns a uniform format.

**Statuses** Retrieves every status update of that package and displays it in a uniform format that contains where a particular update occurred (Address), when that update occurred (Date) and a description of said update (Description).

**Carrier Guessing** Uses regular expressions to make a guess of which carrier it belongs to.

## **Basic Usage**
### **Tracking**

**Track Method** Takes a tracking number and retrieves every status update, then returns a uniform event array with uniform dates and time zones. This method primarily needs two items from you, a tracking number and your carrier credentials.

```javascript
const Bloodhound = require('@mediocre/bloodhound')

const bloodhound = new Bloodhound({
    fedEx: {
        account_number: '846941258',
        environment: 'live',
        key: 'aSecretKey',
        meter_number: '123456789',
        password: 'aSecretPassword'
    }
});

bloodhound.track(trackingNumber, carrier, callback)
//returns array of events of trackingNumber

```
### **Carrier Guessing**
**guessCarrier Method** Takes a tracking number and makes a guess of which carrier it belongs to. This method only needs a tracking number provided.
```javascript
bloodhound.guessCarrier('61299998620341515252')

//returns FedEx
```

## **Carriers Currently Supported**
- FedEx

- Pitney-Bowes (Newgistics)

- UPS (coming soon)

- USPS



## **Examples for Running Tests**
Each field requires you to provide your own credentials.

FedEx
```
FEDEX_ACCOUNT_NUMBER=12345678901 FEDEX_ENVIRONMENT=sandbox FEDEX_KEY=aSecretKey FEDEX_METER_NUMBER=123456789 FEDEX_PASSWORD=aSecretPassword npm test
```

Pitney-Bowes
```
PITNEY_BOWES_API_KEY=developerAPIKey PITNEY_BOWES_API_SECRET=developerAPISecret npm test
```

UPS
```
UPS_USERNAME=jdoe321 UPS_PASSWORD=Trackmaster22 UPS_ACCESS_KEY=SECRETACCESSKEY  npm test
```

USPS
```
USPS_USERID=123DOE123 npm test
```





## **Contributing**
Please refer to each project's style and contribution guidelines for submitting patches and additions. In general, we follow the "fork-and-pull" Git workflow.

1. Fork the repo on GitHub
2. Clone the project to your own machine
3. Commit changes to your own branch
4. Push your work back up to your fork
5. Submit a Pull request so that we can review your changes

NOTE: Be sure to merge the latest from "upstream" before making a pull request!