# plano
A simple single-process REST server for LevelDB.

## Why call it "plano"?
"Plano" is Spanish for flat or level. Simple really?

## How to run the server

    > npm install plano
    > $(npm bin)/plano --addr=127.0.0.1 --port=9876 --path=./data &
    
#### Default command line options
* The default `addr` is `0.0.0.0`
* The default `port` is `9999`
* Teh default `path` is `./db` (a folder to store LevelDB data files)

## HTTP API

#### PUT `http://addr:port/db/:dbName/:key`

The *body* of the PUT request is the value to be stored in the database.

Params
* `:dbName` - your database name
* `:key` - the key whose value is to be stored in the database (in the body of the request)
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl -X PUT --data "myStoredValue" http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"db":"myDatabaseName","key":"myKey","value":"myStoredValue"}`

#### GET `http://addr:port/db/:dbName/:key`

Get the value for a key in a database.

Params
* `:dbName` - your database name
* `:key` - the key whose value is to be retrieved from the database
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl http://localhost:9999/db/myDatabaseName/myKey`

Response:
    `{"db":"myDatabaseName","key":"myKey","value":"myStoredValue"}`

Error response:
    `{"error":"Key not found in database [myOtherKey]"}`
    
#### GET `http://addr:port/db/:dbName/:fromKey/:toKey`

Get all keys and values for a range of keys in a database (the range is inclusive).

Params
* `:dbName` - your database name
* `:fromKey` - the key at the start of the range
* `:toKey` - the key at the end of the range
* `?callback` - an optional JavaScript callback function for JSONP requests

Example:
    `curl http://localhost:9999/db/myDatabaseName/myKey1/myKey2`

Response:
    `{"db":"myDatabaseName","fromKey":"myKey1","toKey":"myKey2","data":{"myKey1":"myValue1","myKey2":"myValue2"}}`

## JSONP

Yes, you can add `?callback=myCallback` to have the response be sent as JavaScript instead of JSON.

## TODO

* Add Basic Auth
