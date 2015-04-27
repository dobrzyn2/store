/*
 * Copyright 2014 Treode, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 /*
 * DLL : https://www.npmjs.com/package/doubly-linked-list-js
 * SkipList    : https://www.npmjs.com/package/skiplist
 * hashtable   : https://www.npmjs.com/package/hashtable
 * http request: https://www.npmjs.com/package/request
 */

//TODO- handle read and write functionality and specifically max age and no cache restrictions within
var Txclock = require('./TxClock');
var http = require('http');
var Skiplist = require('skiplist');
var DoublyLinkedList = require('doubly-linked-list-js');
var request = require('request');
var RESPONSE = 0;
var BODY = 1;

function Cache(cache_limit, server, port, max_age, no_cache){
	this.server = server;
	this.port = port;
	this.max_age = max_age;
	this.no_cache = no_cache;
	this.size = 0;
	this.limit = cache_limit;
	this.map = {};	
	this.list = new DoublyLinkedList();

}

Cache.prototype = {
	constructor: Cache,

	read:function(read_time, table, key, max_age, no_cache){
		var cache_result = this.get(read_time, table, key);
		if(cache_result != -1)
			return cache_result;

		var options = this._get_options(read_time, max_age, no_cache, key, table);
		//Problem: value is received in callback and table and key exist outside of callback,
		//aside from creating global variables I am unable to communicate between the read and callback
		var received = request.get(options, this._read_callback)
		if(received == undefined)
			return -1;		
		var json = received[RESPONSE].responseToJSON();
		var headers = json["headers"];
		read_time = headers["ReadTxClock"];
		value_time = headers["ValueTxClock"];
		var value = response[BODY];
		this.put(read_time, value_time, table, key, value);	
		return this.get(read_time, table, key);
	},

	_read_callback:function(error, response, body)
	{

		if(!error && response.statusCode == 200)	//success
			return [respose, body];	
		return undefined;

		
	},
	_construct_path:function(key, table)
	{
		return this.server + ":" + this.port + "/" + table + "/" + key;
	},
	_get_options:function(read_time, max_age, no_cache, key, table, condition_time)
	{
		var _url = this.server + ":" + this.port + "/" + table + "/" + key;
		var option;
		if(typeof condition_time === 'undefined')
		{
			option = {
			url:_url,
			headers: {
					ReadTxClock:read_time,
					CacheControl:no_cache
				}
			}
			return option;
			
		}
		else
		{
			option = {
				url:_url,
				headers: {
					ReadTxClock:read_time,
					CacheControl:no_cache,
					IfModifiedSince:condition_time.time(),	//is there a difference?
					ConditionTxClock:condition_time.time()	
				}
			}
		}
		return option;
	},
		//op_list is a 2d array (table, key) -> (op, value)
	write:function(condition_time, op_list){
	
	},

	put:function(read_time, value_time, table, key, value)
	{
		//1) look up map for table:key and same value_time.
		//2) If found
		//		set the cached_time to greater of the read_time or cached_time within the tuple
		//3)else add a new tuple 
		//4)remove lru tuple *in the cache*
		var k = this.key_gen(key, table);
		var array = this.map[k];
		if(array === undefined)
		{
			this.addList(read_time, value_time, table, key, value);
		}
		else
		{
			this.appendList(read_time, value_time, table, key, value);
		}
		
	},

	addList:function(read_time, value_time, table, key, value)
	{
		//create new entry in map
		var k = this.key_gen(key, table);
		var entry = {cached_time:read_time, value_time:value_time, value:value};
		this.map[k] = [entry];
		//create new entry in list
		var list_entry = {key:key, table:table, value_time:value_time};
		this.list.add(list_entry);
		this.size++;
		this.prune();
		return;

	},

	appendList:function(read_time, value_time, table, key, value)
	{
		var k = this.key_gen(key, table);
		var array = this.map[k];
		for(var i in array)
		{
			if(array[i].value_time == value_time)
			{
				array[i].cached_time = max(array[i].cached_time, read_time);
				this.map[k] = array;
				this.promote(array[i].key, array[i].table, array[i].value_time);
				return;
			}
		}
		//couldn't find same value_time so we just add a new one
		var entry = {cached_time:read_time, value_time:value_time, value:value};
		this.map[k].push(entry);
		var list_entry = {key:key, table:table, value_time:value_time};
		this.list.add(list_entry);
		this.size++;
		this.prune();

	},

	prune:function()
	{
		while(this.size > this.limit)
		{
			this.evict_one();		
		}
	},

	evict_one:function()
	{
		var lru = this.list.removeAt(0);
		this.size--;
		var key = lru.key;
		var table = lru.table;
		var value_time = lru.value_time;
		var k = this.key_gen(key, table);
		var array = this.map[k];
		if(array == undefined)
			return; 			//there is nothing here
		if(array.length == 0)
		{
			delete this.map[k];	//there is nothing here
			return;
		}
		for(var i in array)
		{
			if(array[i].value_time == value_time)
			{
				array.splice(i,1);
				if(array.length == 0)	//delete entire array if we just emptied it out
				{
					delete this.map[k];
					return;
				}
				this.map[k] = array;
				return;
			}
		}
	},

	get:function(read_time, table, key)
	{
		
		//1)search map for table:key and most recent value_time that is less than or equal to read_time
		//2)promute the use time in this.list
		
		var k = this.key_gen(key, table);
		var array = this.map[k];
		if(array == undefined)
			return -1;
		if(array.length == 0)
			return -1;
		var max = undefined;
		var found_first = false;
		for(var i in array)
		{
			if(array[i].value_time <= read_time && !found_first)
			{
				max = array[i];
				found_first = true;
				continue;
			}
			if(array[i].value_time <= read_time && array[i].value_time > max.value_time)
				max = array[i];
		}
		if(max == undefined)
			return -1; 							//couldn't find in the cache
		this.promote(key, table, max.value_time);
		return max.value;
	},

	key_gen:function(key, table)
	{
		return key + ":" + table;
	},

	promote:function(key, table, value_time)
	{
		var currentList = [];
		this.list.forEach(function (data) {
    		currentList.push(data);
		}, '');
 
		for(var i in currentList)
		{	
			//find the (key, table)
			if(currentList[i].key == key && currentList[i].table == table && currentList[i].value_time == value_time)
			{
				var promoted = this.list.removeAt(i);
				this.list.add(promoted);
				return;
			}
		}	
	},

	max:function(a, b)
	{
		if(a > b)
			return a;
		return b;
	}
}

//naive test
//TODO get real test framework, Junit doesn't work for js, Qunit?
//many test frameworks for js are specifically built for browsers,
//not certain if this is an issue
/*
var dummy = "abc";
var c = new Cache(3, dummy, dummy, dummy, dummy);
c.put(4,3,"fruit","apple","red");
c.put(5,4,"fruit","banana","yellow");
c.put(7,6,"fruit","orange","orange");
c.put(9,8,"fruit","banana","green");

//regular test
if(c.get(100,"fruit","orange") == "orange")
	console.log("Pass 0");

//eviction test
if(c.get(100,"fruit","apple") == -1)
	console.log("Pass 1");

//test read_time 1
if(c.get(100,"fruit","banana") == "green")
	console.log("Pass 2");

//test read_time 2
if(c.get(4,"fruit","banana") == "yellow")
	console.log("Pass 3");
*/
//put(read_time, value_time, table, key, value)
/*
var cache_size = 100;
var num_entries = 1000;
var max_size = 10000;
var c = new Cache(cache_size, "bbc.com", "80", undefined, false);
for(var i = 0; i < max_size; i++)
{
	c.put( Math.random()*max_size,
		Math.random()*max_size,
		Math.random()*max_size,
		Math.random()*max_size,
		Math.random()*max_size );
}
*/
//for(var i in Object.keys(c.map))
//	console.log(i);
//console.log(Object.keys(c.map));
//console.log(Object.keys(c.map).len());


	
	
	
