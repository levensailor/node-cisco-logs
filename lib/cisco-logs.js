'use strict';
const rp = require('request-promise');
const request = require('request');
var formidable = require('formidable');
var form = new formidable.IncomingForm();
const simpleParser = require('mailparser').simpleParser;


/**
 * 
 * 
 * @class LOGS
 * 
 * @constructor
 * @param {Object.<Options>} options 
 * @property {Object.<Options>} options 
 * 
 * @example
 * 
 * const LOGS = require('node-cisco-logs');
 * 
 * var logOptions = {
 * host: process.env.CUCM,
 * user: process.env.AXLUSER,
 * pass: process.env.AXLPASS,
 * }
 * 
 * const ciscoLogs = new LOGS(logOptions);
 * 
 * ciscoLogs.pull('Cisco CallManager, 5')
 *    .then(res => {
 *    console.log(res);
 * });
 * 
 * 
 * 
 */


class LOGS {
  constructor({
    host,
    user,
    pass,
  }) {
    this.host = host || '';
    this.user = user || '';
    this.authToken = new Buffer(user + ':' + pass).toString('base64');
    this.setupDimeGetFileOptions = this.setupDimeGetFileOptions.bind(this);
  }


  callApi(options){
    return rp(options)
  }

  parseFile(message){
    return simpleParser(message)
    .then(mail => {
      console.dir(mail, {depth: null});
      // mail.attachment.forEach(part => {
      //   return part.attachment;
      // })
    })
  }

  setupDimeGetFileOptions(fileName){
    return { 
      method: 'POST',
      url: 'https://'+this.host+':8443/logcollectionservice/services/DimeGetFileService',
      headers: 
      { 'Cache-Control': 'no-cache',
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        Authorization: 'Basic '+this.authToken,
        SOAPAction: '\\"http://schemas.cisco.com/ast/soap/action/#LogCollectionPort#GetOneFile\\"' },
      body: '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">\n     <SOAP-ENV:Body xmlns:NS1="http://schemas.cisco.com/ast/soap/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n         <NS1:GetOneFile>\n             <FileName xsi:type="xsd:string">'+fileName+'</FileName>\n         </NS1:GetOneFile>\n     </SOAP-ENV:Body>\n</SOAP-ENV:Envelope>' }
  }

  getAbsoluteFileName(xmlString){
    var value;
    var tempString;
    var startTag,endTag;
    var startPos,endPos;
    startTag = "<absolutepath xsi:type=\"xsd:string\">";
    endTag = "</absolutepath>";
    tempString=xmlString.toString();
    startPos = tempString.search(startTag) + startTag.length;
    endPos = tempString.search(endTag);
    value = tempString.slice(startPos,endPos);
    console.log(value);
    return value;
  }
  pull(service, time) {

    let logCollectionOptions = { method: 'POST',
      url: 'https://'+this.host+':8443/logcollectionservice/services/LogCollectionPort',
      headers: 
      { 'Cache-Control': 'no-cache',
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        Authorization: 'Basic '+this.authToken,
        SOAPAction: '\\"http://schemas.cisco.com/ast/soap/action/#LogCollectionPort#SelectLogFiles\\"' },
        body: '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap="http://schemas.cisco.com/ast/soap/">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <soap:SelectLogFiles soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n         <FileSelectionCriteria xsi:type="log:SchemaFileSelectionCriteria" xmlns:log="http://cisco.com/ccm/serviceability/soap/LogCollection/">\n            <ServiceLogs xsi:type="log:ArrayOfString">\n               <!--Zero or more repetitions:-->\n               <item xsi:type="xsd:string">'+service+'</item>\n            </ServiceLogs>\n            <SystemLogs xsi:type="log:ArrayOfString">\n               <!--Zero or more repetitions:-->\n            </SystemLogs>\n            <SearchStr/>\n            <JobType xsi:type="log:JobType">DownloadtoClient</JobType>\n            <TimeZone/>\n            <RelText xsi:type="log:RelText">Minutes</RelText>\n            <RelTime xsi:type="xsd:byte">'+time+'</RelTime>\n         </FileSelectionCriteria>\n      </soap:SelectLogFiles>\n   </soapenv:Body>\n</soapenv:Envelope>' };
    

    return Promise.resolve(this.callApi(logCollectionOptions))
      .then(this.getAbsoluteFileName)
      .then(this.setupDimeGetFileOptions)
      .then(this.callApi)
      .then(this.parseFile)
  }

}//LogCollection END

module.exports = LOGS;