# Bloodhound

[![Build Status](https://travis-ci.org/mediocre/bloodhound.svg?branch=master)](https://travis-ci.org/mediocre/bloodhound)
[![Coverage Status](https://coveralls.io/repos/github/mediocre/bloodhound/badge.svg)](https://coveralls.io/github/mediocre/bloodhound)

Bloodhound is a node module that allows you to retrieve data from shipping carriers such as FedEx and USPS, and displays the data in a common format. If available, Bloodhound will use tracking APIs to generate the data, alternatively it will use web-scraping methods. 

## Install
```
npm install @mediocre/bloodhound
```

```
yarn add @mediocre/bloodhound
```

## Basic Usage
Bloodhound primarily needs two items from you, a tracking number and your carrier credentials.

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

bloodhound.track(trackingNumber, carrier, callback) {

    //callback

}
```

## Carriers Currently Supported
- FedEx
- USPS
- UPS
- Pitney-Bowes (Newgistics)


## Examples for Running Tests
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
USPS_USERID=123DOE123 UPS_USERNAME=jdoe321 UPS_PASSWORD=Trackmaster22 UPS_ACCESS_KEY=SECRETACCESSKEY 
```

USPS
```
USPS_USERID=123DOE123 UPS_USERNAME=jdoe321 UPS_PASSWORD=Trackmaster22 UPS_ACCESS_KEY=SECRETACCESSKEY npm test
```





## Contributing
Please refer to each project's style and contribution guidelines for submitting patches and additions. In general, we follow the "fork-and-pull" Git workflow.

1. Fork the repo on GitHub
2. Clone the project to your own machine
3. Commit changes to your own branch
4. Push your work back up to your fork
5. Submit a Pull request so that we can review your changes

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

## License
