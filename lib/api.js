#!/usr/bin/env node

var Promise = require('promise'),
    unirest = require('unirest'),
    utils = require('./utils');

function API(urls){
  this.urls = urls;
}
module.exports = API;

API.prototype.put = function(dbName, key, value){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.put.replace(':dbName', dbName).replace(':key', key);
      value = utils.wrap(value); // to store boolean and number values
      unirest.put(url)
             .type(typeof value === 'object'? 'application/json' : 'text/plain')
             .send(value)
             .end(function(response){
                response.body.data = utils.unwrapAll(response.body.data);
                fulfill(response.body);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};

API.prototype.del = function(dbName, key){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.del.replace(':dbName', dbName).replace(':key', key);
      unirest.delete(url)
             .end(function(response){
                // No data coz we deleted it
                fulfill(response.body);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};

API.prototype.delRange = function(dbName, fromKey, toKey){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.delRange.replace(':dbName', dbName)
                                  .replace(':fromKey', fromKey)
                                  .replace(':toKey', toKey);
      unirest.delete(url)
             .end(function(response){
                // No data coz we deleted it
                fulfill(response.body);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};

API.prototype.get = function(dbName, key){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.get.replace(':dbName', dbName).replace(':key', key);
      unirest.get(url)
             .end(function(response){
                response.body.data = utils.unwrapAll(response.body.data);
                fulfill(response.body);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};

API.prototype.getAll = function(dbName, query){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.getAll.replace(':dbName', dbName);
      unirest.get(url)
             .query(query || {})
             .end(function(response){
                response.body.data = utils.unwrapAll(response.body.data);
                fulfill(response.body);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};

API.prototype.getRange = function(dbName, fromKey, toKey){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.getRange.replace(':dbName', dbName)
                                  .replace(':fromKey', fromKey)
                                  .replace(':toKey', toKey);
      unirest.get(url)
             .end(function(response){
                response.body.data = utils.unwrapAll(response.body.data);
                fulfill(response.body);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};

API.prototype.version = function(){
  return new Promise(function (fulfill, reject){
    try {
      unirest.get(this.urls.version)
             .end(function(response){
                fulfill(response.body.version);
              });
    } catch(e) {
      reject(e.message);
    }
  }.bind(this));
};
