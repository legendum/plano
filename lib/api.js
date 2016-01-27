#!/usr/bin/env node

var DEFAULT_CONTENT_TYPE = 'application/json',
    README_URL = 'https://github.com/legendum/plano/blob/master/README.md',
    ROUTES = {
      put:      ['PUT', '/db/:dbName/:key'],
      get:      ['GET', '/db/:dbName/:key'],
      getAll:   ['GET', '/db/:dbName/:fromKey/:toKey'],
      root:     ['GET', '/'],
      version:  ['GET', 'version'],
    };

var HttpStatus = require('http-status-codes'),
    DB = require('./db');

function API(opts){
  this.db = new DB(opts.dbPath);
  this._version = opts.version;
  this.routes = function(){ return ROUTES };
  this.respond = function(data, req, res, next, opts){
    var callback = req.params.callback; // to support JSONP
    opts = opts || {}
    if (callback){
      opts.contentType = 'text/javascript';
      data = callback + '(' + JSON.stringify(data) + ')';
    }
    res.setHeader('Content-Type', opts.contentType || DEFAULT_CONTENT_TYPE);
    res.send(opts.HttpStatusCode || HttpStatus.OK, data);
    return next(false);
  };
}
module.exports = API;

// Handle all the API routes below...

API.prototype.put = function(req, res, next){
  var dbName = req.params.dbName,
      key = req.params.key,
      value = req.body;
  this.db.put(dbName, key, value, function(err, result){
    if (err) {
      return this.error(err, req, res, next);
    }
    this.respond({db: dbName, key: key, value: value}, req, res, next);
  }.bind(this));
};

API.prototype.get = function(req, res, next){
  var dbName = req.params.dbName,
      key = req.params.key;
  this.db.get(dbName, key, function(err, value){
    if (err) {
      return this.error(err, req, res, next);
    }
    this.respond({db: dbName, key: key, value: value}, req, res, next);
  }.bind(this));
};

API.prototype.getAll = function(req, res, next){
  var dbName = req.params.dbName,
      fromKey = req.params.fromKey,
      toKey = req.params.toKey;

  this.db.getStream(dbName, fromKey, toKey, function(err, data){
    if (err) {
      return this.error(err, req, res, next);
    }
    this.respond({db: dbName, fromKey: fromKey, toKey, toKey, data: data}, req, res, next);
  }.bind(this));
};

API.prototype.error = function(error, req, res, next){
  if (typeof error === 'string') {
    error = {error: error};
  } else if (error.message) {
    error = {error: error.message};
  }
  return this.respond(error, req, res, next);
};

API.prototype.root = function(req, res, next){
  return this.respond({README: README_URL}, req, res, next);
};

API.prototype.version = function(req, res, next){
  return this.respond({version: this._version}, req, res, next);
};
