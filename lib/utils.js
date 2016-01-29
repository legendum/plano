#!/usr/bin/env node

var fs = require('fs'),
    util = require('util');

var utils = {

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

  // Wrap Array, boolean, Date and numeric data
  wrap: function(value){
    if (value instanceof Date) {
      return {__plano__: JSON.stringify(value)}; // wrap dates as JSON strings
    }
    if (Array.isArray(value)) {
      return {__plano__: value}; // avoid JSON parsing headaches with arrays
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      return {__plano__: value}; // wrap booleans and numbers as JSON objects
    }
    return value;
  },

  // Wrap Array, boolean, Date and numeric values in a hash of key/value pairs
  wrapAll: function(hash){
    if (typeof hash !== 'object') return;
    for (var key in hash) {
      hash[key] = this.wrap(hash[key]);
    }
    return hash;
  },

  // Unwrap Array, boolean, Date and numeric data
  unwrap: function(value){
    if (value === null) return null;
    if (typeof value === 'object' && value.__plano__ !== undefined) {
      if (typeof value.__plano__ === 'string') { // the only strings are dates
        return new Date(JSON.parse(value.__plano__));
      } else { // it's an Array, boolean or number
        return value.__plano__;
      }
    }
    return value;
  },

  // Unwrap Array, boolean, Date and numeric values in a hash of key/value pairs
  unwrapAll: function(hash){
    if (typeof hash !== 'object') return;
    for (var key in hash) {
      hash[key] = this.unwrap(hash[key]);
    }
    return hash;
  }
}

module.exports = utils;
