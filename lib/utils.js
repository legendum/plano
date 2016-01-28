#!/usr/bin/env node

var fs = require('fs'),
    util = require('util');

var utils = {
  dirExists: function(path){
    try {
      return fs.lstatSync(path).isDirectory();
    } catch(e) {
      return false;
    }
  },

  extend: util._extend
}

module.exports = utils;
