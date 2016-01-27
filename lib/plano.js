#!/usr/bin/env node

var DEFAULT_ADDR = '0.0.0.0',
    DEFAULT_PORT = '9999',
    VERSION = '0.0.1';

var restify = require('restify'),
    parseArgs = require('minimist'),
    API = require('./api');

function Plano(opts) {
  opts = opts || {};
  this.argv = parseArgs(process.argv);
  this.addr = opts.addr || this.argv.addr || DEFAULT_ADDR;
  this.port = opts.port || this.argv.port || DEFAULT_PORT;
  this.api = new API(VERSION);
}
Plano.VERSION = VERSION;
module.exports = Plano;

Plano.prototype.baseURL = function(){
  return 'http://' + this.addr + ':' + this.port + '/';
};

Plano.prototype.URLs = function(){
  var routes = this.api.routes(),
      base = this.baseURL(),
      urls = {};
  for (var name in routes){
    urls[name] = base + routes[name][1];
  }
  return urls;
};

Plano.prototype.start = function(next){
  var server = this.createServer();
  server.listen(this.port, this.addr, function(){
    console.log('Started %s at %s (ver. %s)', server.name, server.url, VERSION);
    if (next) next();
  });
};

Plano.prototype.createServer = function(){
  var server = restify.createServer({name: 'Plano'});
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(restify.throttle({burst: 100, rate: 50, xff: true}));
  server.pre(restify.pre.userAgentConnection()); // ...for "curl" clients
  this.setupRoutes(server);
  return server;
};

Plano.prototype.setupRoutes = function(server){
  var routes = this.api.routes();
  for (var route in routes){
    var spec = routes[route],
        method = spec[0].toLowerCase(),
        path = spec[1];
    server[method](path, this.createResponse(route));
  }
};

Plano.prototype.createResponse = function(route){
  var api = this.api;
  return function(req, res, next){
    try {
      return api[route].call(api, req, res, next);
    } catch(e) {
      api.error(e.message, req, res, next);
    }
  };
}
