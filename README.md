# plano
A simple single-process REST server for LevelDB.

## Why call it "plano"?
"Plano" is Spanish for flat or level. Simple really?

## How to run the server

    $(npm bin)/plano --addr=127.0.0.1 --port=9876 &
    
#### Default command line options
* The default `addr` is `0.0.0.0`
* The default `port` is `9999`

## HTTP API

#### PUT `http://addr:port/dbName/key`

The *body* of the PUT request is the value to be stored in the database.

Response:
    {"db":"myDatabaseName","key":"myKey","value":"theStoredValue"}

#### GET `http://addr:port/dbName/key`

Get the value for a key in a database.

Response:
    {"db":"myDatabaseName","key":"myKey","value":"myStoredValue"}

Error response:
    {"error":"Key not found in database [myOtherKey]"}
    
#### GET `http://addr:port/dbName/fromKey/toKey`

Get all keys and values for a range of keys in a database (the range is inclusive).

Response:
  {"db":"myDatabaseName","fromKey":"key1","toKey":"key2","data":{"key1":"value1","key2":"value2"}}

## JSONP

Yes, you can add `?callback=myCallback` to have the response be sent as JavaScript instead of JSON.

## TODO

* Add Basic Auth
