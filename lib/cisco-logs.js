'use strict';
const rp = require('request-promise');
const request = require('request');
const fs = require('fs');
const _ = require('lodash');
const parser = require('xml2json');

// const handlers =  [ new Security({}, [new UsernameToken({username: process.env.AXLUSER, password: process.env.AXLPASS})])
// , new Http()
// ]
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
    this.setupDimeRequest = this.setupDimeRequest.bind(this);
    this.setupDimeCtx = this.setupDimeCtx.bind(this);
    this.soapApi = this.soapApi.bind(this);
  }


  callApi(options){
    return rp(options)
  }


  soapApi(ctx){

  //store to sftp but now you need the sftp target to the file
  //<absolutepath xsi:type="xsd:string">/var/log/active/cm/trace/ccm/sdl/SDL001_100_001196.txt.gzo</absolutepath>
  //<modifiedDate xsi:type="xsd:string">Wed May 16 02:11:27 EDT 2018</modifiedDate>
  // /tmp/10.144.200.10/2018-05-16_02-07-07/cm/trace/ccm/sdl/SDL001_100_001196.txt
  // ehh need a app that watches a directory and sends a webhook with filename and path

    // ws.send(handlers, ctx, function(res, err){
    //   if (err){console.log(err)};
    //   var file = ws.getAttachment(ctx, res, "//*[local-name(.)='File1']")
    //   fs.writeFileSync("./result.txt", file)

    // })
  }
  parseFile(message){
    return message;
    // return simpleParser(message)
    // .then(mail => {
    //   fs.writeFile('../logFile1.txt', JSON.stringify(mail), function(error) {
    //     if (error) {
    //       console.log("there was an err");
    //     fs.writeFile('../errorFile1.txt', error);
    //     } else {
    // }
    // })
    //   // mail.attachment.forEach(part => {
    //   //   return part.attachment;
    //   // })
    // })
  }

  setupDimeRequest(fileName){
  return '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap="http://schemas.cisco.com/ast/soap/">'+
  '<soapenv:Header/>'+
  '<soapenv:Body>'+
  '<soap:GetOneFile soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'+
  '<FileName xsi:type="get:FileName" xmlns:get="http://cisco.com/ccm/serviceability/soap/LogCollection/GetFile/">'+fileName+'</FileName>'+
  '</soap:GetOneFile>'+
  '</soapenv:Body>'+
  '</soapenv:Envelope>' }


  setupDimeCtx(body){
    return { request: body,
      url: 'https://10.144.200.10:8443/logcollectionservice/services/DimeGetFileService',
      action: 'http://schemas.cisco.com/ast/soap/action/#LogCollectionPort#GetOneFile',
      contentType: 'text/xml',
      Authorization: 'Basic '+this.authToken

    }
  }

  convertXml(xml) {
    return parser.toJson(xml, {
      trim: true, object: true, sanitize: true
    });
  }

  trimJson(json) {
    return _.chain(
      _.chain(json)
      .result('soapenv:Envelope')
      .result('soapenv:Body')
      .result('ns1:SelectLogFilesResponse')
      .result('FileSelectionResult')
      .result('Node')
      .result('ServiceList')
      .result('item')
      .result('SetOfFiles')
      .result('item')
      // .result('name.$')
      //.result('name')
      //.result('name')
      ).valueOf() || false;
  }

  findFileName(json){
    return _.chain(json)
    .result('name.$t')
    .valueOf() || false;
  }

  api4sftp(sparkid, filename){
    var request = require("request");

    var options = { method: 'POST',
      url: 'http://34.219.57.217:8080/api/sftp',
      headers: 
       { 'Postman-Token': '48b71ba6-e025-4e54-92da-cfb45569b747',
         'Cache-Control': 'no-cache',
         'Content-Type': 'application/json' },
      body: { 'sparkid': sparkid,
              'filename': filename },
      json: true };
    
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
    
      console.log(body);
    });
  }
  pull(service, time, sparkid) {


    let logCollectionOptions = { method: 'POST',
      url: 'https://'+this.host+':8443/logcollectionservice/services/LogCollectionPort',
      headers: 
      { 'Cache-Control': 'no-cache',
        'Content-Type': 'text/xml;charset=UTF-8',
        'Accept-Encoding': 'gzip,deflate',
        Authorization: 'Basic '+this.authToken,
        SOAPAction: '\\"http://schemas.cisco.com/ast/soap/action/#LogCollectionPort#SelectLogFiles\\"' },
        body: '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap="http://schemas.cisco.com/ast/soap/">\n   <soapenv:Header/>\n   <soapenv:Body>\n      <soap:SelectLogFiles soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n         <FileSelectionCriteria xsi:type="log:SchemaFileSelectionCriteria" xmlns:log="http://cisco.com/ccm/serviceability/soap/LogCollection/">\n            <ServiceLogs xsi:type="log:ArrayOfString">\n               <!--Zero or more repetitions:-->\n               <item xsi:type="xsd:string">'+service+'</item>\n            </ServiceLogs>\n            <SystemLogs xsi:type="log:ArrayOfString">\n               <!--Zero or more repetitions:-->\n            </SystemLogs>\n            <SearchStr/>\n            <JobType xsi:type="log:JobType">PushtoSFTPServer</JobType>\n            <TimeZone/>\n            <RelText xsi:type="log:RelText">Minutes</RelText>\n            <RelTime xsi:type="xsd:byte">'+time+'</RelTime>\n         <Port xsi:type="xsd:byte">22</Port>\n       <IPAddress xsi:type="xsd:string">34.219.57.217</IPAddress>\n      <UserName xsi:type="xsd:string">ubuntu</UserName>\n      <Password xsi:type="xsd:string">Durhamm@1</Password>\n      <ZipInfo xsi:type="xsd:boolean">false</ZipInfo>\n      <RemoteFolder xsi:type="xsd:string">subdir</RemoteFolder>\n      </FileSelectionCriteria>\n      </soap:SelectLogFiles>\n   </soapenv:Body>\n</soapenv:Envelope>' };
    

    return Promise.resolve(this.callApi(logCollectionOptions))
    // .then(res => {
      .then(this.convertXml)
      .then(this.trimJson)
      .then(this.findFileName)
      .then(filename => {
        this.api4sftp(sparkid, filename)
      })
      // this.findFilename(res);
      // console.log(res);
      //if (res) {this.api4sftp(sparkid)};
    // })
      // .then(this.api4sftp(sparkid));
      // .then(this.setupDimeRequest)
      // .then(this.setupDimeCtx)
      // .then(this.soapApi)
      // .then(ctx => {
      //   soapApi(handlers, ctx)
      // })
  }

}//LogCollection END

module.exports = LOGS;