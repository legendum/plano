#!/usr/bin/env node

var assert = require('chai').assert,
    DB = require('../lib/db'),
    _db = null;

describe('Plano DB', function(){

  before(function(done){
    _db = new DB('db', {openLimit: 1});
    done();
  });

  describe('Direct data storage and retrieval', function(){

    // NOTE: Here we're checking that our open limit doesn't cause problems

    it('should write to db "test1" and read it back', function(done){
      _db.put('test1', 'key1', 'value1', function(){
        _db.get('test1', 'key1', function(err, datum){
          assert.equal('value1', datum);
          done();
        });
      });
    });

    it('should write to db "test2" and read it back', function(done){
      _db.put('test2', 'key2', 'value2', function(){
        _db.get('test2', 'key2', function(err, datum){
          assert.equal('value2', datum);
          done();
        });
      });
    });

    it('should read from both "test1" and "test2"', function(done){
      _db.get('test1', 'key1', function(err, datum){
        assert.equal('value1', datum);
        _db.get('test2', 'key2', function(err, datum){
          assert.equal('value2', datum);
          done();
        });
      });
    });

  }); // Direct data storage and retrieval

});
