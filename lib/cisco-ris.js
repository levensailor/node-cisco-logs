'use strict';

const _ = require('lodash');
const parser = require('xml2json');
const Axios = require('axios');

/**
 * 
 * 
 * @class AXL
 * 
 * @constructor
 * @param {Object.<Options>} options 
 * @property {Object.<Options>} options 
 * 
 * @example
 * 
 * const RIS = require('node-cisco-ris);
 * 
 * var risOptions = {
 * host: process.env.CUCM,
 * user: process.env.AXLUSER,
 * pass: process.env.AXLPASS,
 * }
 * 
 * const ris = new RIS(risOptions);
 * 
 * ris.getDevice('SEP0011DD0011DD')
 *    .then(res => {
 *    console.log('Name: '+res.Name);
 * });
 * 
 * 
 * 
 */


class RIS {
  constructor({
    host,
    user,
    pass,
  }) {
    this.host = host || '';
    this.user = user || '';
    this.authToken = new Buffer(user + ':' + pass).toString('base64');
    this.axios = Axios.create({
      baseURL: 'https://' + host + ':8443/realtimeservice2/services/RISService70',
      timeout: 8000,
      rejectUnauthorized: false
    });
    this.soapEnv = 'http://schemas.xmlsoap.org/soap/envelope/';
    this.soapNs = 'http://schemas.cisco.com/ast/soap';

    this.getSoapEnv = this.getSoapEnv.bind(this);
    this.constructHeaders = this.constructHeaders.bind(this);
    this.callApi = this.callApi.bind(this);
  }

  getSoapEnv() {
    return (
      `<soapenv:Envelope xmlns:soapenv="${this.soapEnv}" xmlns:soap="${this.soapNs}">` +
      '<soapenv:Header/>' +
      '<soapenv:Body>' +
      '{{body}}' +
      '</soapenv:Body>' +
      '</soapenv:Envelope>'
    );
  }

  constructHeaders(func) {
    return {
      headers: {
        'SOAPAction': `${func}`,
        'Authorization': `Basic ${this.authToken}`,
        'Content-Type': 'text/xml; charset=utf-8',
      }
    };
  }

  callApi([body, headers]) {
    return this.axios.post('', body, headers)
  };

  parseResult(result) {
    return result.data;
  };

  convertXml(xml) {
    return parser.toJson(xml, {
      trim: true, object: true, sanitize: true
    });
  }

  trimJson(json) {
    return _.chain(json)
      .result('soapenv:Envelope')
      .result('soapenv:Body')
      .result('ns1:selectCmDeviceResponse')
      .result('ns1:selectCmDeviceReturn')
      .result('ns1:SelectCmDeviceResult')
      .result('ns1:CmNodes')
      .result('ns1:item')
      .valueOf() || false;
  }

  fetchNode(json) {
    return _.find(json, {"ns1:ReturnCode": "Ok"}) || false;
  }

  item(json) {
    return _.chain(json)
    .result('ns1:CmDevices')
    .result('ns1:item')
    .valueOf() || false;
  }

  sanitize(json) {
    return JSON.parse(
      JSON.stringify(json)
          .replace(/'/g, '"')
          .replace(/ns1:/g,'')
    ) || false;
  }

	/**
	 * 
	 * 
	 * @param {any} pattern 
	 * @returns {Promise.<Response>} Response promise
	 * 
	 */
  getDevice(device) {
    const getSoapBody = device => new Buffer(
      this.getSoapEnv().replace(
        '{{body}}',
        '<soap:selectCmDevice>' +
        '<soap:StateInfo></soap:StateInfo>' +
        '<soap:CmSelectionCriteria>' +
        '<soap:MaxReturnedDevices>1</soap:MaxReturnedDevices>' +
        '<soap:DeviceClass>Phone</soap:DeviceClass>' +
        '<soap:Model>255</soap:Model>' +
        '<soap:Status>Registered</soap:Status>' +
        '<soap:NodeName></soap:NodeName>' +
        '<soap:SelectBy>Name</soap:SelectBy>' +
        '<soap:SelectItems>' +
        '<soap:item>' +
        '<soap:Item>'+device+'</soap:Item>' +
        '</soap:item>' +
        '</soap:SelectItems>' +
        '<soap:Protocol>Any</soap:Protocol>' +
        '<soap:DownloadStatus>Any</soap:DownloadStatus>' +
        '</soap:CmSelectionCriteria>' +
        '</soap:selectCmDevice>' 
      )
    )

    const trimJSON = json => this.trimJson(
      json, 'selectCmDevice'
    );

    return Promise.all([
      getSoapBody(device),
      this.constructHeaders('"selectCmDevice"')
    ])
    .then(this.callApi)
    .then(this.parseResult)
    .then(this.convertXml)
    .then(this.trimJson)
    .then(this.fetchNode)
    .then(this.item)
    .then(this.sanitize)
  }
}

module.exports = RIS;