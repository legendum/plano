#!/usr/bin/env node

var OPEN_LIMIT = 256; // to avoid running out of file handles

var async = require('async'),
    level = require('level'),
    path = require('path'),
    utils = require('./utils'),
    encodings = {keyEncoding: 'utf8', valueEncoding: 'json'};

function DB(dbPath, opts){
  opts = opts || {};
  opts.openLimit = opts.openLimit || OPEN_LIMIT;
  this.cache = {};
  this.dbForName = function(dbName, next){
    if (dbName.match(/[^\w]/)) {
      throw "Database name cannot contain non-word characters";
    }
    dbName = path.join(dbPath, dbName);
    if (Object.keys(this.cache).length > opts.openLimit) {
      this.closeAll(function(){
        next(this.cache[dbName] = this.cache[dbName] || level(dbName));
      }.bind(this));
    } else {
      next(this.cache[dbName] = this.cache[dbName] || level(dbName));
    }
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
    this.cache = {};
    async.series(series, function(err, dbNames){
      console.log('Closed %s', dbNames.join(', '));
      next();
    });
  }
}
module.exports = DB;

DB.prototype.batch = function(dbName, ops, next){
  this.dbForName(dbName, function(db){
    db.batch(ops, encodings, next);
  });
};

DB.prototype.put = function(dbName, key, value, next){
  this.dbForName(dbName, function(db){
    db.put(key, value, encodings, next);
  });
};

DB.prototype.del = function(dbName, key, next){
  this.dbForName(dbName, function(db){
    db.del(key, encodings, next);
  });
};

DB.prototype.get = function(dbName, key, next){
  this.dbForName(dbName, function(db){
    db.get(key, encodings, next);
  });
};

DB.prototype.getStream = function(dbName, opts, next){
  var data;
  opts = opts || {};
  data = (opts.keys === false || opts.values === false) ? [] : {};
  opts = utils.extend(opts, encodings); delete opts.asBuffer; // WTF?
  this.dbForName(dbName, function(db){
    db.createReadStream(opts)
    .on('data', function(datum) {
      if (opts.keys === false || opts.values === false) {
        data.push(datum);
      } else {
        data[datum.key] = datum.value;
      }
    })
    .on('error', function(err){
      next(err);
    })
    .on('close', function(){
      next(null, data);
    });
  });
};
