#!/usr/bin/env node

var fs = require('fs'),
    util = require('util');

var utils = {

  // Turn dates into strings
  date: function(date){
    date = date || new Date();
    return JSON.stringify(date); // e.g. "2016-01-28T22:14:52.844Z"
  },

  // Return whether a directory exists or not
  dirExists: function(path){
    try {
      return fs.lstatSync(path).isDirectory();
    } catch(e) {
      return false;
    }
  },

  // Extend an object with another
  extend: util._extend,

  // Wrap boolean, date and numeric data
  wrap: function(value){
    if (typeof value === 'object' && typeof value.getTime === 'function') {
      return {__plano__: JSON.stringify(value)}; // wrap dates as JSON strings
    }
    if (typeof value === 'object' && Array.isArray(value)) {
      return {__plano__: value}; // avoid JSON parsing headaches with arrays
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      return {__plano__: value};
    }
    return value;
  },

  // Wrap boolean, date and numeric values in a hash of key/value pairs
  wrapAll: function(hash){
    if (typeof hash !== 'object') return;
    for (var key in hash) {
      hash[key] = this.wrap(hash[key]);
    }
    return hash;
  },

  // Unwrap boolean, date and numeric data
  unwrap: function(value){
    if (typeof value === 'object' && value.__plano__ !== undefined) {
      if (typeof value.__plano__ === 'string') { // the only strings are dates
        return new Date(JSON.parse(value.__plano__));
      } else {
        return value.__plano__;
      }
    }
    return value;
  },

  // Unwrap boolean, date and numeric values in a hash of key/value pairs
  unwrapAll: function(hash){
    if (typeof hash !== 'object') return;
    for (var key in hash) {
      hash[key] = this.unwrap(hash[key]);
    }
    return hash;
  }
}

module.exports = utils;
