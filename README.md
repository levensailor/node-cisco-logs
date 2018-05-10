node-cisco-logs
===========

Cisco Unified Communications Manager has been the gold standard in enterprise unified communication for years, but using it's LogCollection API can be a beast. It changes frequently, uses SOAP rather than REST, and returns XML not JSON. 

The goal of this project is to make it easier for people to use LOGS, focusing on top use cases, not all functions! 

[Cisco Developer Docs for LogCollection](https://developer.cisco.com/site/sxml/documents/api-reference/log-collection/)

Installation
============

`npm install node-cisco-logs`

Usage
=====

Require LOGS, add options, and pass options as new object:

```javascript
var LOG = require('node-cisco-logs');

var logOptions = {
    host: process.env.CUCM,
    user: process.env.LOGUSER,
    pass: process.env.LOGPASS
}

const logz = new LOG(risOptions);

logz.pull('Cisco CallManager', '5')
.then(res => {
    console.log(res)
});
`

Getting support
===============

You can find me on Cisco Spark: jlevensailor@presidio.com

But if you know you really found a bug, feel free to open an issue instead.
# node-cisco-axl
# node-cisco-ris
# node-cisco-logs
