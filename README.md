# plano [![Build Status](https://travis-ci.org/legendum/plano.svg)](http://travis-ci.org/legendum/plano)

A simple single-process REST server for LevelDB.

## What is Plano?

Plano is a simple single-process REST server to provide LevelDB as a network
service. It performs like a Redis key/value store, except that it also allows
key range queries whereby all keys and values between a start-key and end-key
may be retrieved. LevelDB stores data on-disk for greater crash resilience
than an in-memory Redis server. By default, LevelDB data is compressed too.
(Note that Redis scales to multiple servers, whereas Plano runs on only one.)

## Why call it "plano"?

"Plano" is Spanish for flat or _level_. Simple really?

## Why use LevelDB?

LevelDB is more than just a key/value store. It's impressively fast, _and_ it
offers range queries to retrieve keys and values within bounds. This enables
LevelDB to solve problems that might typically require a relational database,
or MongoDB. LevelDB also offers data compression by default, unlike MongoDB.

Whereas servers like Redis offer the concept of TTL (expiring data), Plano
offers deletion over key ranges. Data tables that are keyed on epoch times
are easily purged of old data by using the `delRange` API method (below).

## Installing LevelDB

To use Plano, you'll first need to install LevelDB. On a Mac, install LevelDB
with Homebrew (see http://brew.sh/) like this:

    brew install leveldb

On Ubuntu Linux, install LevelDB with:

    apt-get install leveldb1v5

On Windows, heck I have no idea.

## Use cases for Plano

Generally it's a _Very Bad Idea_ to make Plano directly available to web/app
front-ends because the API doesn't (yet) support authentication/authorization.
Instead, Plano is ideally suited to the kinds of roles where you might use
MongoDB, Redis or Riak as part of a secured NodeJS back-end server system.
It's a great tool for prototyping projects where you'd like to avoid writing
complex database schemas and migrations.

## How to run the server

    > npm install plano
    > $(npm bin)/plano --addr=127.0.0.1 --port=9876 --path=./data &
    
#### Default command line options

* The default `addr` is `0.0.0.0`
* The default `port` is `9999`
* The default `path` is `./db` (a folder to store LevelDB data files)

## Native JavaScript API (see below for a raw HTTP API)

Start a Plano server from inside your JavaScript code like this:

    var Plano = require('plano'),
        plano = new Plano({addr: '0.0.0.0', port: 9999, path: './db'});
    plano.start(function(){
      // We're running!
    });

Once your Plano server is running, you can make API calls to it from multiple
servers. The only restrictions are:

1. Just one Plano server process may run at a time on each address and port.
2. The same databases cannot be served by more than one Plano server process.

All Plano API methods return `Promise` objects. See https://www.promisejs.org/
for details if you're not familiar with them.

Database names must be plain words, without any special characters except "\_".
Typically you will want to use what would usually be a table name, such as
"users", "customers" or "orders".

Keys _must_ be plain strings. If you need to use a different datatype
(e.g. a `Date`) or a more complex object, then use `JSON.stringify(key)`
to encode it as a string first.

Values may be plain strings, booleans, numbers, `Date` objects or more complex
objects like arrays or hashes. The API attempts to handle all data encoding and
decoding transparently and efficiently.

#### Put data using the API

    plano.API.put("myDatabaseName", "myKey1", "myValue1").then(function(body){
      // Our first key/value pair is now stored (a simple string)
      body.params.key === "myKey1";
      return plano.API.put("myDatabaseName", "myKey2", 2);
    }).then(function(body){
      // Our second key/value pair is now stored (a simple number)
      body.params.key === "myKey2";
      return plano.API.put("myDatabaseName", "myKey3", {num: 3, odd: true});
    }).then(function(body){
      // Our third key/value pair is now stored (a complex object)
      body.params.key === "myKey3";
    });

#### Put bulk updates using the API

    plano.API.putAll("myDatabaseName", {
      "myKey1": "myValue1",
      "myKey2": 2,
      "myKey3": {num: 3, odd: true}
    }).then(function(body){
      // Our first key/value pair is now stored (a simple string)
      // Our second key/value pair is now stored (a simple number)
      // Our third key/value pair is now stored (a complex object)
      body.params.keys === ["myKey1, "myKey2", "myKey3"];
    });

#### Get data using the API

    plano.API.get("myDatabaseName", "myKey1").then(function(body){
      // Our key/value pair is retrieved
      body.data.myKey1 === "myValue1";
      body.data.myKey2 === undefined; // we didn't request it
      body.data.myKey3 === undefined; // we didn't request it
    });

#### Get all data in a table using the API

    plano.API.getAll("myDatabaseName").then(function(body){
      // All key/value pairs are retrieved in "body.data"
      body.data.myKey1 === "myValue1";
      body.data.myKey2 === 2;
      body.data.myKey3.num === 3;
      body.data.myKey3.odd === true;
    });

#### Get all data in a table using the API (with a "greater than" option)

    plano.API.getAll("myDatabaseName", {gt: "myKey1"}).then(function(body){
      // All key/value pairs are retrieved in "body.data"
      body.data.myKey1 === undefined; // it's not greater than "myKey1"
      body.data.myKey2 === 2;
      body.data.myKey3.num === 3;
      body.data.myKey3.odd === true;
    });

#### Get a range of data using the API (the range is inclusive)

    plano.API.getRange("myDatabaseName", "myKey0", "myKey1").then(function(body){
      // All key/value pairs are retrieved in "body.data"
      body.data.myKey1 === "myValue1";
      body.data.myKey2 === undefined; // it's greater than "myKey1"
      body.data.myKey3 === undefined; // it's greater than "myKey1"
    });

#### Delete data using the API

    plano.API.del("myDatabaseName", "myKey1").then(function(body){
      // Our first key/value pair is now deleted
      body.deleted === "myKey1";
    });

#### Delete a range of data using the API (the range is inclusive)

    plano.API.delRange("myDatabaseName", "myKey0", "myKey3").then(function(body){
      // Our second and third key/value pairs are now deleted
      body.deleted === ["myKey2", "myKey3"]; // "myKey0" does not exist...
    });                                      // ...and "myKey1" was deleted

## HTTP API

The HTTP API returns JSON objects. Each response includes a server timestamp
called `time` and a server processing duration in milliseconds called `msecs`.
Params passed to the server are returned in the response as `params`, any data
in `data` and a list of deleted keys in `deleted`.

#### POST or PUT `http://addr:port/db/:db/:key`

The *body* of the POST or PUT request is the value to be stored in the database.
By default, values are plain strings and should be sent as "text/plain" content.
When sending a JSON value, be sure to use a content type of "application/json".
JSON objects _must_ have a JSON root of "data" and _must_ be key/value objects,
not arrays, booleans, dates or numbers.

If you want to PUT a JSON object, then you're probably better off using the API
(see above) because it handles the marshalling of various datatypes, including
arrays, booleans, dates and numbers.

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `:key` - the key whose value is to be stored in the database (in the body of the request)
* `?callback` - an optional JavaScript callback function for JSONP requests

Example (plain text value):
    `curl -X PUT --data "myStoredValue" http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"params":{"db":"myDatabaseName","key":"myKey"},"time":1453889946843,"msecs":20}`

Example (JSON value):
    `curl -X PUT -H 'content-type: application/json' --data '{"data":{"ok":true}}' http://localhost:9999/db/myDatabaseName/status`

Response:
    `{"params":{"db":"myDatabaseName","key":"status"},"time":1453972791640,"msecs":20}`

#### POST or PUT `http://addr:port/db/:db` (for batch updates)

The *body* of the POST or PUT request is a map of keys and values to be stored
in the database, encoded as JSON with a root of "data" (be sure to use a content
type of "application/json").

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl -X PUT --data '{"data":{"myKey1":"myStoredValue1","myKey2":{"value":2}}}' http://localhost:9999/db/myDatabaseName`

Response:
    `{"params":{"db":"myDatabaseName","keys":["myKey1","myKey2"]},"time":1453889946843,"msecs":20}`

#### GET `http://addr:port/db/:db/:key`

Get the value for a key in a database.

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `:key` - the key whose value is to be retrieved from the database
* `?callback` - an optional JavaScript callback function for JSONP requests

Example (plain text value):
    `curl http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"params":{"db":"myDatabaseName","key":"myKey"},"data":{"myKey":"myStoredValue"},"time":1453889946843,"msecs":20}`

Example (JSON value):
    `curl http://localhost:9999/db/myDatabaseName/status`

Response:
    `{"params":{"db":"myDatabaseName","key":"status"},"data":{"status":{"ok":true}},"time":1453972859367,"msecs":20}`

Error response:
    `{"error":"Key not found in database [myOtherKey]","time":1453889946843,"msecs":20}`
    
#### GET `http://addr:port/db/:db`

Get all keys and values in a database.

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)

Example:
    `curl http://localhost:9999/db/myDatabaseName`

Response:
    `{"params":{"db":"myDatabaseName"},"data":{"myKey1":"myValue1","myKey2":"myValue2","myKey3":"myValue3"},"time":1453889946843,"msecs":20}`

NOTE: This _optionally_ allows query parameters to be passed to LevelDB:
* `?lt` (less than) - return keys and values where the key is less than this param
* `?gt` (greater than) - return keys and values where the key is greater than this param
* `?lte` (less than or equal) - return keys and values where the key is less than or equal to this param
* `?gte` (greater than or equal) - return keys and values where the key is greater than or equal to this param

Example:
    `curl http://localhost:9999/db/myDatabaseName?lt=myKey2`

Response:
    `{"params":{"db":"myDatabaseName","lt":"myKey2"},"data":{"myKey1":"myValue1"},"time":1453889946843,"msecs":20}`

#### GET `http://addr:port/db/:db/:fromKey/:toKey`

Get the keys and values for a range of keys in a database (the range is inclusive). If either of your keys includes a slash ("/") then use the following query instead:

GET `http://addr:port/db/:db?gte=:fromKey&lte=:toKey`

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `:fromKey` - the key at the start of the range
* `:toKey` - the key at the end of the range
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl http://localhost:9999/db/myDatabaseName/myKey1/myKey2`

Response:
    `{"params":{"db":"myDatabaseName","fromKey":"myKey1","toKey":"myKey2"},"data":{"myKey1":"myValue1","myKey2":"myValue2"},"time":1453889946843,"msecs":20}`

#### DELETE `http://addr:port/db/:db`

Delete all key/value pairs in a database.

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl -X DELETE http://localhost:9999/db/myDatabaseName`

Response:
    `{"params":{"db":"myDatabaseName"},"deleted":["myKey1","myKey2"],"time":1453889946843,"msecs":20}`

NOTE: This _optionally_ allows query parameters to be passed to LevelDB:
* `?lt` (less than) - delete keys and values where the key is less than this param
* `?gt` (greater than) - delete keys and values where the key is greater than this param
* `?lte` (less than or equal) - delete keys and values where the key is less than or equal to this param
* `?gte` (greater than or equal) - delete keys and values where the key is greater than or equal to this param

Example:
    `curl -X DELETE http://localhost:9999/db/myDatabaseName?lt=myKey2`

Response:
    `{"params":{"db":"myDatabaseName","lt":"myKey2"},"deleted":["myKey1"],"time":1453889946843,"msecs":20}`

#### DELETE `http://addr:port/db/:db/:key`

Delete a key/value pair in a database.

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `:key` - the key whose value is to be retrieved from the database
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl -X DELETE http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"params":{"db":"myDatabaseName","key":"myKey"},"deleted":"myKey","time":1453889946843,"msecs":20}`

#### DELETE `http://addr:port/db/:db/:fromKey/:toKey`

Delete a range of key/value pairs in a database. If either of your keys includes a slash ("/") then use the following query instead:

DELETE `http://addr:port/db/:db?gte=:fromKey&lte=:toKey`

__Params__
* `:db` - your database name (it'll be created if it doesn't exist)
* `:fromKey` - the key at the start of the range
* `:toKey` - the key at the end of the range
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl -X DELETE http://localhost:9999/db/myDatabaseName/myKey1/myKey2`

Response:
    `{params:{"db":"myDatabaseName","fromKey":"myKey1","toKey":"myKey2"},"deleted":["myKey1","myKey2"],"time":1453889946843,"msecs":20}`

#### GET `http://addr:port/version`

Get the current version.

Example:
    `curl http://localhost:9999/version`

Response:
    `{"version":"2.1.3","time":1453889946843,"msecs":5}`

## JSONP

Yes, you can add a `?callback=myCallback` query parameter to have the response be sent as JavaScript instead of JSON. But remember it's a _Very Bad Idea_ to
connect a Plano server to a web/app front-end because there's no auth (yet).

## TODO

* Mirroring/replication/backups
