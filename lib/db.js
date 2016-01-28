#!/usr/bin/env node

var path = require('path'),
    level = require('level'),
    utils = require('./utils'),
    encodings = {keyEncoding: 'utf8', valueEncoding: 'json'};

function DB(dbPath){
  this.cache = {};
  this.dbForName = function(dbName){
    if (dbName.match(/[^\w]/)) {
      throw "Database name cannot contain non-word characters";
    }
    dbName = path.join(dbPath, dbName);
    this.cache[dbName] = this.cache[dbName] || level(dbName);
    return this.cache[dbName];
  };
}
module.exports = DB;

DB.prototype.put = function(dbName, key, value, next){
  this.dbForName(dbName).put(key, value, encodings, next);
};

DB.prototype.get = function(dbName, key, next){
  this.dbForName(dbName).get(key, encodings, function(err, datum){
    next(err, datum);
  });
};

DB.prototype.getStream = function(dbName, opts, next){
  var data = {};
  opts = utils.extend(opts, encodings); delete opts.asBuffer; // WTF?
  this.dbForName(dbName).createReadStream(opts)
    .on('data', function (datum) {
      data[datum.key] = datum.value;
    })
    .on('error', function (err) {
      next(err);
    })
    .on('close', function () {
      next(null, data);
    });
};
