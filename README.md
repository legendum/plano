# plano
A simple single-process REST server for LevelDB.

## Why call it "plano"?
"Plano" is Spanish for flat or level. Simple really?

## Why use LevelDB?
LevelDB is more than just a key/value store. It's impressively fast, _and_ it
offers range queries to retrieve keys and values within bounds. This enables
LevelDB to be used to solve problems that would typically require an RDBMS.

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
    `{"db":"myDatabaseName","key":"myKey","value":"myStoredValue","time":1453889946843}`

#### GET `http://addr:port/db/:dbName/:key`

Get the value for a key in a database.

Params
* `:dbName` - your database name
* `:key` - the key whose value is to be retrieved from the database
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"db":"myDatabaseName","key":"myKey","value":"myStoredValue","time":1453889946843}`

Error response:
    `{"error":"Key not found in database [myOtherKey]","time":1453889946843}`
    
#### GET `http://addr:port/db/:dbName`

Get all keys and values in a database.

Example:
    `curl http://localhost:9999/db/myDatabaseName`

Response:
    `{"db":"myDatabaseName","data":{"myKey1":"myValue1","myKey2":"myValue2","myKey3":"myValue3"},"time":1453889946843}`

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

## JSONP

Yes, you can add `?callback=myCallback` to have the response be sent as JavaScript instead of JSON.

## TODO

* Add Basic Auth
