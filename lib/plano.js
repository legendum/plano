#!/usr/bin/env node

var DEFAULT_ADDR = '0.0.0.0',
    DEFAULT_PORT = '9999',
    DEFAULT_PATH = './db',
    VERSION = '2.1.6',
    HELP = '\nOptions: \n' +
           '--addr=0.0.0.0   The address where our Plano server is running\n' +
           '--port=9999      The port on which our Plano server is running\n' +
           '--path=./db      The path to a folder to hold LevelDB data files\n';

var restify = require('restify'),
    parseArgs = require('minimist'),
    utils = require('./utils'),
    REST = require('./rest'),
    API = require('./api');

function Plano(opts){
  var dbDir = false;
  opts = opts || {};
  this.argv = parseArgs(process.argv);
  this.addr = opts.addr || this.argv.addr || DEFAULT_ADDR;
  this.port = opts.port || this.argv.port || DEFAULT_PORT;
  this.path = opts.path || this.argv.path || DEFAULT_PATH;
  this.rest = new REST({dbPath: this.path, version: VERSION});
  this.API = new API(this.URLs());
  dbDir = utils.dirExists(this.path);
  if (!dbDir || this.argv.help) {
    if (!dbDir) {
      console.error('\nERROR: Database directory %s is missing', this.path);
    }
    console.log(HELP);
    process.exit();
  }

  process.on('SIGINT', function (){
    this.stop();
  }.bind(this));
}
Plano.utils = utils; // for "wrap" and "unwrap" methods, if needed
Plano.VERSION = VERSION;
module.exports = Plano;

Plano.prototype.baseURL = function(){
  return 'http://' + this.addr + ':' + this.port + '/';
};

Plano.prototype.URLs = function(){
  var routes = this.rest.routes(),
      base = this.baseURL(),
      urls = {};
  for (var name in routes) {
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

Plano.prototype.stop = function(wait){
  wait = wait || 100;
  this.rest.stop(function(){
    setTimeout(function(){
      console.log("Stopped Plano server");
      process.exit();
    }, wait);
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
  var routes = this.rest.routes();
  for (var route in routes) {
    var spec = routes[route],
        method = spec[0].toLowerCase(),
        path = spec[1];
    server[method](path, this.createResponder(route));
  }
};

Plano.prototype.createResponder = function(route){
  var rest = this.rest;
  return function(req, res, next){
    try {
      return rest[route].call(rest, req, res, next);
    } catch(err) {
      rest.error(err, req, res, next);
    }
  };
};
