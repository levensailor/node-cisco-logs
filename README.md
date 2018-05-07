node-cisco-ris
===========

Cisco Unified Communications Manager has been the gold standard in enterprise unified communication for years, but using it's Realtime Information Service or RIS toolkit can be a beast. It changes frequently, uses SOAP rather than REST, and returns XML not JSON. 

The goal of this project is to make it easier for people to use RIS, focusing on top use cases, not all functions! 

[Cisco Developer Docs for RisPort](https://developer.cisco.com/site/sxml/discover/overview/risport/)

Installation
============

`npm install node-cisco-ris`

Usage
=====

Require RIS, add options, and pass options as new object:

```javascript
var RIS = require('node-cisco-ris');

var risOptions = {
    host: process.env.CUCM,
    user: process.env.RISUSER,
    pass: process.env.RISPASS
}

const ris = new RIS(risOptions);

ris.getIP('SEP00C1B1E46160')
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
