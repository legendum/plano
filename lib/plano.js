#!/usr/bin/env node

var DEFAULT_ADDR = '0.0.0.0',
    DEFAULT_PORT = '9999',
    DEFAULT_PATH = './db',
    VERSION = '0.0.3',
    HELP = 'Options: \n' +
           '--addr=0.0.0.0   The address where our Plano server is running\n' +
           '--port=9999      The port on which our Plano server is running\n' +
           '--path=./db      The path to a folder to hold LevelDB data files\n';

var restify = require('restify'),
    parseArgs = require('minimist'),
    API = require('./api');

function Plano(opts){
  opts = opts || {};
  this.argv = parseArgs(process.argv);
  this.addr = opts.addr || this.argv.addr || DEFAULT_ADDR;
  this.port = opts.port || this.argv.port || DEFAULT_PORT;
  this.path = opts.path || this.argv.path || DEFAULT_PATH;
  this.api = new API({dbPath: this.path, version: VERSION});
  if (this.argv.help) {
    console.log(HELP);
    process.exit();
  }
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
    console.log('Databases are in folder %s', this.path);
    if (next) next();
  }.bind(this));
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
    server[method](path, this.createResponder(route));
  }
};

Plano.prototype.createResponder = function(route){
  var api = this.api;
  return function(req, res, next){
    try {
      return api[route].call(api, req, res, next);
    } catch(e) {
      api.error(e, req, res, next);
    }
  };
}
