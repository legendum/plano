#!/usr/bin/env node

var level = require('level'),
    path = require('path');

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
  this.dbForName(dbName).put(key, value, next);
};

DB.prototype.get = function(dbName, key, next){
  this.dbForName(dbName).get(key, next);
};

DB.prototype.getStream = function(dbName, opts, next){
  var data = {};
  this.dbForName(dbName).createReadStream(opts)
  .on('data', function (datum) {
    data[datum.key] = datum.value;
  })
  .on('error', function (err) {
    next(err);
  })
  .on('close', function () {
    next(null, data);
  })
};
