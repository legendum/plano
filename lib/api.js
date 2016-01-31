#!/usr/bin/env node

var Promise = require('promise'),
    unirest = require('unirest'),
    utils = require('./utils');

function API(urls){
  this.urls = urls;
}
module.exports = API;

API.prototype.put = function(db, key, value){
  return new Promise(function (fulfill, reject){
    try {
      if (typeof key !== 'string' || key.length === 0) { throw "bad key" }
      key = encodeURIComponent(key); // to encode any slashes as "%2F"
      var url = this.urls.put.replace(':db', db).replace(':key', key);
      value = utils.wrap(value); // to store boolean and number values
      unirest.put(url)
             .type(typeof value === 'object'? 'application/json' : 'text/plain')
             .send(typeof value === 'object'? {data: value} : value)
             .end(function(response){
                fulfill(response.body);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};

API.prototype.putAll = function(db, data){
  return new Promise(function (fulfill, reject){
    try {
      if (typeof data !== 'object' || Array.isArray(data)) { throw "bad data" }
      var url = this.urls.putAll.replace(':db', db);
      unirest.put(url)
             .type('application/json')
             .send({data: utils.wrapAll(data)})
             .end(function(response){
                fulfill(response.body);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};

API.prototype.del = function(db, key){
  return new Promise(function (fulfill, reject){
    try {
      if (typeof key !== 'string' || key.length === 0) { throw "bad key" }
      key = encodeURIComponent(key); // to encode any slashes as "%2F"
      var url = this.urls.del.replace(':db', db).replace(':key', key);
      unirest.delete(url)
             .end(function(response){
                // No data coz we deleted it
                fulfill(response.body);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};

API.prototype.delAll = function(db, query){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.delAll.replace(':db', db);
      unirest.delete(url)
             .query(query || {})
             .end(function(response){
                // No data coz we deleted it
                fulfill(response.body);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};

API.prototype.delRange = function(db, fromKey, toKey){
  return this.delAll(db, {gte: fromKey, lte: toKey});
};

API.prototype.get = function(db, key){
  return new Promise(function (fulfill, reject){
    try {
      if (typeof key !== 'string' || key.length === 0) { throw "bad key" }
      key = encodeURIComponent(key); // to encode any slashes as "%2F"
      var url = this.urls.get.replace(':db', db).replace(':key', key);
      unirest.get(url)
             .end(function(response){
                response.body.data = utils.unwrapAll(response.body.data);
                fulfill(response.body);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};

API.prototype.getAll = function(db, query){
  return new Promise(function (fulfill, reject){
    try {
      var url = this.urls.getAll.replace(':db', db);
      unirest.get(url)
             .query(query || {})
             .end(function(response){
                response.body.data = utils.unwrapAll(response.body.data);
                fulfill(response.body);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};

API.prototype.getRange = function(db, fromKey, toKey){
  return this.getAll(db, {gte: fromKey, lte: toKey});
};

API.prototype.version = function(){
  return new Promise(function (fulfill, reject){
    try {
      unirest.get(this.urls.version)
             .end(function(response){
                fulfill(response.body.version);
              });
    } catch(err) {
      reject(err);
    }
  }.bind(this));
};
