#!/usr/bin/env node

var fs = require('fs');

var utils = {
  dirExists: function(path){
    try {
      return fs.lstatSync(path).isDirectory();
    } catch(e) {
      return false;
    }
  }
}

module.exports = utils;
