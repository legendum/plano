#!/usr/bin/env node

var DEFAULT_ADDR = '0.0.0.0',
    DEFAULT_PORT = '9999',
    VERSION = '0.0.1',
    PATHS = {
      version:  'version',
      root:     '/'
    };

var restify = require('restify'),
    HttpStatus = require('http-status-codes'),
    argv = require('minimist');

function Plano(opts) {
  opts = opts || {};
  this.argv = argv;
  this.addr = opts.addr || argv.addr || DEFAULT_ADDR;
  this.port = opts.port || argv.port || DEFAULT_PORT;
}
Plano.VERSION = VERSION;
module.exports = Plano;

Plano.prototype.baseURL = function(){
  return 'http://' + this.addr + ':' + this.port + '/';
};

Plano.prototype.URLs = function(){
  var base = this.baseURL(),
      urls = {};
  for (var key in PATHS){
    urls[key] = base + PATHS[key];
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
  server.get(PATHS.root, function(req, res, next){
    return this.respond({README: 'https://TODO'}, res, next);
  });
  server.get(PATHS.version, function(req, res, next){
    return this.respond({version: VERSION}, res, next);
  }.bind(this));
};

Plano.prototype.respond = function(data, res, next, code){
  res.setHeader('Content-Type', 'application/json');
  res.send(code || HttpStatus.OK, {version: VERSION});
  return next(false);
};
