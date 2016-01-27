#!/usr/bin/env node

var ADDR = '0.0.0.0',
    PORT = '9876';

var assert = require('chai').assert,
    unirest = require('unirest'),
    Plano = require('../lib/plano'),
    _server;

describe('Plano server', function(){

  before(function(done){
    _server = new Plano({addr: ADDR, port: PORT});
    _server.start(function() {
      done();
    });
  });

  describe('Check the setup', function(){
   it('should get the version', function(done) {
      unirest.get(_server.URLs().version)
        .end(function(response) {
          assert.equal(response.request.path, "/version");
          assert.equal(response.body.version, Plano.VERSION);
          done();
        });
    });
  });
});
