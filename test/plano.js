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
    _server.start(function(){
      done();
    });
  });

  describe('Check the server is running', function(){
   it('should get the version', function(done){
      unirest.get(_server.URLs().version)
        .end(function(response){
          assert.equal(response.request.path, '/version');
          assert.equal(response.body.version, Plano.VERSION);
          done();
        });
    });
  });

  describe('Check data storage and retrieval', function(){

    it('should put some data', function(done){
      function putData(params, next){
        var url = _server.URLs().put;
        url = url.replace(':dbName', params.db).replace(':key', params.key);
        unirest[params.method || 'put'](url)
          .type('text/plain')
          .send(params.value)
          .end(next);
      }

      function postData(params, next){
        params.method = 'post';
        putData(params, next);
      }

      // We'll do one post and a couple of puts, just to prove they all work...
      postData({db: 'test', key: 'key1', value: 'value1'}, function(response){
        assert.equal(response.body.db, 'test');
        assert.equal(response.body.data.key1, 'value1');
        putData({db: 'test', key: 'key2', value: 'value2'}, function(response){
          assert.equal(response.body.db, 'test');
          assert.equal(response.body.data.key2, 'value2');
          putData({db: 'test', key: 'key3', value: 'value3'}, function(response){
            assert.equal(response.body.db, 'test');
            assert.equal(response.body.data.key3, 'value3');
            done();
          });
        });
      });
    });

    it('should get some data', function(done){
      function getData(params, next){
        var url = _server.URLs().get;
        url = url.replace(':dbName', params.db).replace(':key', params.key);
        unirest.get(url).end(next);
      }

      getData({db: 'test', key: 'key1'}, function(response){
        assert.equal(response.body.db, 'test');
        assert.equal(response.body.data.key1, 'value1');
        getData({db: 'test', key: 'key2'}, function(response){
          assert.equal(response.body.db, 'test');
          assert.equal(response.body.data.key2, 'value2');
          getData({db: 'test', key: 'key3'}, function(response){
            assert.equal(response.body.db, 'test');
            assert.equal(response.body.data.key3, 'value3');
            getData({db: 'test', key: 'key4'}, function(response){
              assert.equal(response.body.error, 'Key not found in database [key4]');
              done();
            });
          });
        });
      });
    });

    it('should get all data in a database', function(done){
      function getAll(params, next){
        var url = _server.URLs().getAll + params.query;
        url = url.replace(':dbName', params.db);
        unirest.get(url).end(next);
      }

      getAll({db: 'test', query: ''}, function(response){
        var data = response.body.data;
        assert.equal(response.body.db, 'test');
        assert.equal(data.key1, 'value1');
        assert.equal(data.key2, 'value2');
        assert.equal(data.key3, 'value3');
        assert.equal(data.key4, null);
        getAll({db: 'test', query: '?gt=key2'}, function(response){
          var data = response.body.data;
          assert.equal(response.body.db, 'test');
          assert.equal(data.key1, null);
          assert.equal(data.key2, null);
          assert.equal(data.key3, 'value3');
          assert.equal(data.key4, null);
          done();
        });
      });
    });

    it('should get a range of data', function(done){
      function getRange(params, next){
        var url = _server.URLs().getRange;
        url = url.replace(':dbName', params.db)
                 .replace(':fromKey', params.fromKey)
                 .replace(':toKey', params.toKey);
        unirest.get(url).end(next);
      }

      getRange({db: 'test', fromKey: 'key2', toKey: 'key3'}, function(response){
        var data = response.body.data;
        assert.equal(response.body.db, 'test');
        assert.equal(response.body.fromKey, 'key2');
        assert.equal(response.body.toKey, 'key3');
        assert.equal(data.key2, 'value2');
        assert.equal(data.key3, 'value3');
        getRange({db: 'test', fromKey: 'key3', toKey: 'key4'}, function(response){
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

  describe('The client API', function(){

    it('should get the version', function(done){
      _server.API.version().then(function(version){
        assert.equal(version, Plano.VERSION);
      }).catch(function(error){
        console.error(error);
      }).then(function(){
        done();
      });
    });

    it('should put some data', function(done){
      _server.API.put('test', 'key5', 'value5').then(function(body){
        assert.equal(body.data.key5, 'value5');
      }).catch(function(error){
        console.error(error);
      }).then(function(){
        done();
      });
    });

    it('should get some data', function(done){
      _server.API.get('test', 'key5').then(function(body){
        assert.equal(body.data.key5, 'value5');
      }).catch(function(error){
        console.error(error);
      }).then(function(){
        done();
      });
    });

    it('should get all data', function(done){
      _server.API.getAll('test', {gt: 'key4'}).then(function(body){
        assert.equal(body.data.key3, null); // not greater than "key4"
        assert.equal(body.data.key4, null); // not set
        assert.equal(body.data.key5, 'value5');
        assert.equal(body.data.key6, null); // not set
      }).catch(function(error){
        console.error(error);
      }).then(function(){
        return _server.API.getAll('test')
      }).then(function(body){
        assert.equal(body.data.key3, 'value3'); // it's now included in all data
        assert.equal(body.data.key4, null); // not set
        assert.equal(body.data.key5, 'value5');
        assert.equal(body.data.key6, null); // not set
      }).then(function(){
        done();
      });
    });

    it('should get a range of data', function(done){
      _server.API.getRange('test', 'key3', 'key6').then(function(body){
        assert.equal(body.data.key3, 'value3');
        assert.equal(body.data.key4, null); // not set
        assert.equal(body.data.key5, 'value5');
        assert.equal(body.data.key6, null); // not set
      }).catch(function(error){
        console.error(error);
      }).then(function(){
        done();
      });
    });
  });
});
