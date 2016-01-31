#!/usr/bin/env node

var async = require('async'),
    level = require('level'),
    path = require('path'),
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
  this.closeAll = function(next){
    var series = [];
    function dbCloser(db, name){
      return function(callback){
        db.close(function() {
          callback(null, name);
        });
      }
    }
    for (var dbName in this.cache) {
      series.push(dbCloser(this.cache[dbName], dbName));
    }
    async.series(series, function(err, dbNames){
      console.log('Closed %s', dbNames.join(', '));
      next();
    });
  }
}
module.exports = DB;

DB.prototype.batch = function(dbName, ops, next){
  this.dbForName(dbName).batch(ops, encodings, next);
};

DB.prototype.put = function(dbName, key, value, next){
  this.dbForName(dbName).put(key, value, encodings, next);
};

DB.prototype.del = function(dbName, key, next){
  this.dbForName(dbName).del(key, encodings, next);
};

DB.prototype.get = function(dbName, key, next){
  this.dbForName(dbName).get(key, encodings, function(err, datum){
    next(err, datum);
  });
};

DB.prototype.getStream = function(dbName, opts, next){
  var data;
  opts = opts || {};
  data = (opts.keys === false || opts.values === false) ? [] : {};
  opts = utils.extend(opts, encodings); delete opts.asBuffer; // WTF?
  this.dbForName(dbName).createReadStream(opts)
    .on('data', function (datum) {
      if (opts.keys === false || opts.values === false) {
        data.push(datum);
      } else {
        data[datum.key] = datum.value;
      }
    })
    .on('error', function (err) {
      next(err);
    })
    .on('close', function () {
      next(null, data);
    });
};
