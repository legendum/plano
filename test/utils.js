#!/usr/bin/env node

var assert = require('chai').assert,
    utils = require('../lib/utils');

describe('Plano utils', function(){

  it('should check if a directory exists', function(){
    assert.isTrue(utils.dirExists('.'));
    assert.isFalse(utils.dirExists('./missingDir'));
  });

  it('should extend an object', function(){
    var obj1 = {a: 1, b: 'two', c: {three: 3}},
        obj2 = {c: 3, d: true},
        obj3 = utils.extend(obj1, obj2);
    assert.equal(obj3.a, 1);
    assert.equal(obj3.b, 'two');
    assert.deepEqual(obj3.c, 3); // over-written by "extend"
    assert.equal(obj3.d, true);
  });

  it('should select key/value pairs from an object', function(){
    var obj1 = {a: 1, b: 'two', c: {three: 3}, d: true},
        keys = ['b', 'c'],
        obj2 = utils.select(obj1, keys);
    assert.isUndefined(obj2.a);
    assert.equal(obj2.b, 'two');
    assert.deepEqual(obj2.c, {three: 3});
    assert.isUndefined(obj2.d);
  });

  it('should wrap non-string values', function(){
    var date = new Date();
    assert.equal(utils.wrap("simple string"), "simple string");
    assert.deepEqual(utils.wrap(123), {__plano__: 123});
    assert.deepEqual(utils.wrap({a: 1}), {a: 1});
    assert.deepEqual(utils.wrap(date), {__plano__: JSON.stringify(date)});
    assert.deepEqual(utils.wrap(false), {__plano__: false});
  });

  it('should wrap all non-string values in a hash object', function(){
    var date = new Date(),
        hash = {
          a: "simple string",
          b: 123,
          c: {a: 1},
          d: date,
          e: false
        },
        wrapped = utils.wrapAll(hash);
    assert.equal(wrapped.a, "simple string");
    assert.deepEqual(wrapped.b, {__plano__: 123});
    assert.deepEqual(wrapped.c, {a: 1});
    assert.deepEqual(wrapped.d, {__plano__: JSON.stringify(date)});
    assert.deepEqual(wrapped.e, {__plano__: false});
  });

  it('should unwrap wrapped values', function(){
    var date = new Date();
    assert.equal(utils.unwrap("simple string"), "simple string");
    assert.deepEqual(utils.unwrap({__plano__: 123}), 123);
    assert.deepEqual(utils.unwrap({a: 1}), {a: 1});
    assert.equal(utils.unwrap({__plano__: JSON.stringify(date)}).toString(),
                 date.toString());
    assert.isFalse(utils.unwrap({__plano__: false}));
  });

  it('should unwrap all wrapped values in a hash object', function(){
    var date = new Date(),
        hash = {
          a: "simple string",
          b: {__plano__: 123},
          c: {a: 1},
          d: {__plano__: JSON.stringify(date)},
          e: {__plano__: false}
        },
        unwrapped = utils.unwrapAll(hash);
    assert.equal(unwrapped.a, "simple string");
    assert.equal(unwrapped.b, 123);
    assert.deepEqual(unwrapped.c, {a: 1});
    assert.equal(new Date(unwrapped.d).toString(), date.toString());
    assert.isFalse(unwrapped.e);
  });
});
