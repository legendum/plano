#!/usr/bin/env node

var assert = require('chai').assert,
    utils = require('../lib/utils');

describe('Plano utils', function(){

 it('should check if a directory exists', function(){
    assert.isTrue(utils.dirExists('.'));
    assert.isFalse(utils.dirExists('./missingDir'));
  });
});
