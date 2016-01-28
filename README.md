# plano
A simple single-process REST server for LevelDB.

## Why call it "plano"?
"Plano" is Spanish for flat or level. Simple really?

## Why use LevelDB?
LevelDB is more than just a key/value store. It's impressively fast, _and_ it
offers range queries to retrieve keys and values within bounds. This enables
LevelDB to solve problems that might typically require a relational database.

## How to run the server

    > npm install plano
    > $(npm bin)/plano --addr=127.0.0.1 --port=9876 --path=./data &
    
#### Default command line options
* The default `addr` is `0.0.0.0`
* The default `port` is `9999`
* The default `path` is `./db` (a folder to store LevelDB data files)

## HTTP API

#### POST or PUT `http://addr:port/db/:dbName/:key`

The *body* of the POST or PUT request is the value to be stored in the database.

Params
* `:dbName` - your database name
* `:key` - the key whose value is to be stored in the database (in the body of the request)
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl -X PUT --data "myStoredValue" http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"db":"myDatabaseName","data":{"myKey":"myStoredValue"},"time":1453889946843}`

#### GET `http://addr:port/db/:dbName/:key`

Get the value for a key in a database.

Params
* `:dbName` - your database name
* `:key` - the key whose value is to be retrieved from the database
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"db":"myDatabaseName","data":{"myKey":"myStoredValue"},"time":1453889946843}`

Error response:
    `{"error":"Key not found in database [myOtherKey]","time":1453889946843}`
    
#### GET `http://addr:port/db/:dbName`

Get all keys and values in a database.

Example:
    `curl http://localhost:9999/db/myDatabaseName`

Response:
    `{"db":"myDatabaseName","data":{"myKey1":"myValue1","myKey2":"myValue2","myKey3":"myValue3"},"time":1453889946843}`

NOTE: This _optionally_ allows query parameters to be passed to LevelDB:
* `?lt` (less than) - return keys and values where the key is less than this param
* `?gt` (greater than) - return keys and values where the key is greater than this param
* `?lte` (less than or equal) - return keys and values where the key is less than or equal to this param
* `?gte` (greater than or equal) - return keys and values where the key is greater than or equal to this param

Example:
    `curl http://localhost:9999/db/myDatabaseName?lt=myKey2`

Response:
    `{"db":"myDatabaseName","data":{"myKey1":"myValue1"},"time":1453889946843}`

#### GET `http://addr:port/db/:dbName/:fromKey/:toKey`

Get the keys and values for a range of keys in a database (the range is inclusive).

Params
* `:dbName` - your database name
* `:fromKey` - the key at the start of the range
* `:toKey` - the key at the end of the range
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl http://localhost:9999/db/myDatabaseName/myKey1/myKey2`

Response:
    `{"db":"myDatabaseName","fromKey":"myKey1","toKey":"myKey2","data":{"myKey1":"myValue1","myKey2":"myValue2"},"time":1453889946843}`

#### GET `http://addr:port/version`

Get the current version.

Example:
    `curl http://localhost:9999/version`

Response:
    `{"version":"0.0.6","time":1453889946843}`

## API

Plano also makes a simple API available to Node programs, like this:

    var plano = new Plano({addr: '0.0.0.0', port: 9999, path: './db'});
    plano.start(function(){
      // We're running!
    });

All API methods return promises.

#### Put data using the API

    plano.API.put("myDatabaseName", "myKey1", "myValue1").then(function(body){
      // Our first key/value pair is now stored
      body.data.myKey1 === "myValue1";
      return plano.API.put("myDatabaseName", "myKey2", "myValue2");
    }).then(function(body){
      // Our second key/value pair is now stored
      body.data.myKey2 === "myValue2";
    });

#### Get data using the API

    plano.API.get("myDatabaseName", "myKey1").then(function(body){
      // Our key/value pair is retrieved
      body.data.myKey1 === "myValue1";
      body.data.myKey2 === null; // we didn't request it
    });

#### Get all data in a table using the API

    plano.API.getAll("myDatabaseName").then(function(body){
      // All key/value pairs are retrieved in "body.data"
      body.data.myKey1 === "myValue1";
      body.data.myKey2 === "myValue2";
    });

#### Get all data in a table using the API (with a "greater than" option)

    plano.API.getAll("myDatabaseName", {gt: "myKey1"}).then(function(body){
      // All key/value pairs are retrieved in "body.data"
      body.data.myKey1 === null; // it's not greater than "myKey1"
      body.data.myKey2 === "myValue2";
    });

#### Get a range of data using the API (the range is inclusive)

    plano.API.getRange("myDatabaseName", "myKey0", "myKey1").then(function(body){
      // All key/value pairs are retrieved in "body.data"
      body.data.myKey1 === "myValue1";
      body.data.myKey2 === null; // it's greater than "myKey1"
    });

## JSONP

Yes, you can add `?callback=myCallback` to have the response be sent as JavaScript instead of JSON.

## TODO

* Add Basic Auth
* Restrict the creation of new databases somehow
