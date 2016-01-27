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

  describe('Check the server is running', function(){
   it('should get the version', function(done) {
      unirest.get(_server.URLs().version)
        .end(function(response) {
          assert.equal(response.request.path, '/version');
          assert.equal(response.body.version, Plano.VERSION);
          done();
        });
    });
  });

  describe('Check data storage and retrieval', function(){

    it('should put some data', function(done) {
      function putData(params, next){
        var url = _server.URLs().put;
        url = url.replace(':dbName', params.db).replace(':key', params.key);
        unirest.put(url)
          .type('text/plain')
          .send(params.value)
          .end(next);
      }

      putData({db: 'test', key: 'key1', value: 'value1'}, function(response){
        assert.equal(response.body.db, 'test');
        assert.equal(response.body.key, 'key1');
        assert.equal(response.body.value, 'value1');
        putData({db: 'test', key: 'key2', value: 'value2'}, function(response){
          assert.equal(response.body.db, 'test');
          assert.equal(response.body.key, 'key2');
          assert.equal(response.body.value, 'value2');
          putData({db: 'test', key: 'key3', value: 'value3'}, function(response){
            assert.equal(response.body.db, 'test');
            assert.equal(response.body.key, 'key3');
            assert.equal(response.body.value, 'value3');
            done();
          });
        });
      });
    });

    it('should get some data', function(done) {
      function getData(params, next){
        var url = _server.URLs().get;
        url = url.replace(':dbName', params.db).replace(':key', params.key);
        unirest.get(url).end(next);
      }

      getData({db: 'test', key: 'key1'}, function(response){
        assert.equal(response.body.db, 'test');
        assert.equal(response.body.key, 'key1');
        assert.equal(response.body.value, 'value1');
        getData({db: 'test', key: 'key2'}, function(response){
          assert.equal(response.body.db, 'test');
          assert.equal(response.body.key, 'key2');
          assert.equal(response.body.value, 'value2');
          getData({db: 'test', key: 'key3'}, function(response){
            assert.equal(response.body.db, 'test');
            assert.equal(response.body.key, 'key3');
            assert.equal(response.body.value, 'value3');
            getData({db: 'test', key: 'key4'}, function(response){
              assert.equal(response.body.error, 'Key not found in database [key4]');
              done();
            });
          });
        });
      });
    });

    it('should get a range of data', function(done) {
      function getAll(params, next){
        var url = _server.URLs().getAll;
        url = url.replace(':dbName', params.db)
                 .replace(':fromKey', params.fromKey)
                 .replace(':toKey', params.toKey);
        unirest.get(url).end(next);
      }

      getAll({db: 'test', fromKey: 'key2', toKey: 'key3'}, function(response){
        var data = response.body.data;
        assert.equal(response.body.db, 'test');
        assert.equal(response.body.fromKey, 'key2');
        assert.equal(response.body.toKey, 'key3');
        assert.equal(data.key2, 'value2');
        assert.equal(data.key3, 'value3');
        getAll({db: 'test', fromKey: 'key3', toKey: 'key4'}, function(response){
          var data = response.body.data;
          assert.equal(response.body.db, 'test');
          assert.equal(response.body.fromKey, 'key3');
          assert.equal(response.body.toKey, 'key4');
          assert.equal(data.key2, null);
          assert.equal(data.key3, 'value3');
          assert.equal(data.key4, null);
          done();
        });
      });
    });
  });
});
