#!/usr/bin/env node

var DEFAULT_CONTENT_TYPE = 'application/json',
    PARAMS_IN_RESPONSE = ['db', 'key', 'keys', 'fromKey', 'toKey'],
    README_URL = 'https://github.com/legendum/plano/blob/master/README.md',
    ROUTES = {
      post:     ['POST',  'db/:db/:key'],
      put:      ['PUT',   'db/:db/:key'],
      postAll:  ['POST',  'db/:db'],
      putAll:   ['PUT',   'db/:db'],
      del:      ['DEL',   'db/:db/:key'],
      delAll:   ['DEL',   'db/:db'],
      delRange: ['DEL',   'db/:db/:fromKey/:toKey'],
      get:      ['GET',   'db/:db/:key'],
      getAll:   ['GET',   'db/:db'],
      getRange: ['GET',   'db/:db/:fromKey/:toKey'],
      root:     ['GET',   '/'],
      version:  ['GET',   'version']
    };

var HttpStatus = require('http-status-codes'),
    utils = require('./utils'),
    DB = require('./db');

function REST(opts){
  this.db = new DB(opts.dbPath);
  this._version = opts.version;
  this.routes = function(){ return ROUTES };
  this.running = true;
  this.respond = function(data, req, res, next, opts){
    var callback = req.params.callback; // to support JSONP
    data.time = (new Date()).getTime(); // to check for stale data
    data.msecs = data.time - req._time; // time taken to process the request
    data.params = utils.select(req.params, PARAMS_IN_RESPONSE);
    opts = opts || {}
    if (callback){
      opts.contentType = 'text/javascript';
      data = callback + '(' + JSON.stringify(data) + ')';
    }
    res.setHeader('Content-Type', opts.contentType || DEFAULT_CONTENT_TYPE);
    res.send(opts.HttpStatusCode || HttpStatus.OK, data);
    return next(false);
  };
  this.stop = function(next){
    this.running = false;
    this.db.closeAll(next);
  };
}
module.exports = REST;

// Handle all the REST routes below...

REST.prototype.post = REST.prototype.put = function(req, res, next){
  var db = req.params.db,
      key = req.params.key,
      type = req.contentType(),
      value;
  if (!this.running) { return this.error('stopping', req, res, next) }
  try {
    if (type === 'text/plain') {
      value = req.body;
    } else {
      value = req.body.data;
      if (typeof value !== 'object' || Array.isArray(value)) {throw "bad value"}
    }
    this.db.put(db, key, value, function(err, result){
      var data = {};
      if (err) { return this.error(err, req, res, next) }
      data[key] = value;
      this.respond({}, req, res, next);
    }.bind(this));
  } catch (err) {
    this.error(err, req, res, next);
  }
};

REST.prototype.postAll = REST.prototype.putAll = function(req, res, next){
  var db = req.params.db,
      data,
      ops = [],
      keys = [];
  if (!this.running) { return this.error('stopping', req, res, next) }
  try {
    data = req.body.data;
    if (typeof data !== 'object' || Array.isArray(data)) { throw "bad data" }
    for (var key in data) {
      ops.push({type: 'put', key: key, value: data[key]});
      keys.push(key);
    }
    this.db.batch(db, ops, function(err){
      if (err) { return this.error(err, req, res, next) }
      this.respond({keys: keys}, req, res, next);
    }.bind(this));
  } catch (err) {
    this.error(err, req, res, next);
  }
};

REST.prototype.del = function(req, res, next){
  var db = req.params.db,
      key = req.params.key;
  if (!this.running) { return this.error('stopping', req, res, next) }
  this.db.del(db, key, function(err, result){
    if (err) { return this.error(err, req, res, next) }
    this.respond({deleted: key}, req, res, next);
  }.bind(this));
};

REST.prototype.delAll = function(req, res, next, params){
  var db = req.params.db,
      params = params || req.params,
      ops = [];
  if (!this.running) { return this.error('stopping', req, res, next) }
  this.db.getStream(db, utils.extend(req.params, {values: false}), function(err, keys){
    if (err) { return this.error(err, req, res, next) }
    for (var i in keys) {
      ops.push({type: 'del', key: keys[i]});
    }
    this.db.batch(db, ops, function(err){
      if (err) { return this.error(err, req, res, next) }
      this.respond({deleted: keys}, req, res, next);
    }.bind(this));
  }.bind(this));
};

REST.prototype.delRange = function(req, res, next){
  var fromKey = req.params.fromKey,
      toKey = req.params.toKey;
  this.delAll(req, res, next, {gte: fromKey, lte: toKey});
};

REST.prototype.get = function(req, res, next){
  var db = req.params.db,
      key = req.params.key;
  if (!this.running) { return this.error('stopping', req, res, next) }
  this.db.get(db, key, function(err, value){
    var data = {};
    if (err) { return this.error(err, req, res, next) }
    data[key] = value;
    this.respond({data: data}, req, res, next);
  }.bind(this));
};

REST.prototype.getAll = function(req, res, next, params){
  var db = req.params.db,
      params = params || req.params;
  if (!this.running) { return this.error('stopping', req, res, next) }
  this.db.getStream(db, params, function(err, data){
    if (err) { return this.error(err, req, res, next) }
    this.respond({data: data}, req, res, next);
  }.bind(this));
};

REST.prototype.getRange = function(req, res, next){
  var db = req.params.db,
      fromKey = req.params.fromKey,
      toKey = req.params.toKey;
  this.getAll(req, res, next, {gte: fromKey, lte: toKey});
};

REST.prototype.error = function(error, req, res, next){
  if (typeof error === 'string') {
    error = {error: error};
  } else if (error.message) {
    error = {error: error.message};
  }
  return this.respond(error, req, res, next);
};

REST.prototype.root = function(req, res, next){
  return this.respond({README: README_URL}, req, res, next);
};

REST.prototype.version = function(req, res, next){
  return this.respond({version: this._version}, req, res, next);
};
