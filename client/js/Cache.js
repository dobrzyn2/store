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
 * SkipList : https://www.npmjs.com/package/skiplist
 * hashtable: https://www.npmjs.com/package/hashtable
 */

//var txclock = require('./TxClock');
var http = require('http');
var Skiplist = require('skiplist');
var DoublyLinkedList = require('doubly-linked-list-js');

function Cache(cache_limit){
	this.size = 0;
	this.limit = cache_limit;
	this.map = {};
	// should be :(key, value) -> List (cacheTime, valueTime, JSON value)
	this.list = new DoublyLinkedList();
	//should be :(key, table, value_time)
}

Cache.prototype = {
	constructor: Cache,
	read:function(read_time, table, key, max_age, no_cache){
		
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
		return max;
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

//test code...
//put(read_time, value_time, table, key, value)
var c = new Cache(3);
c.put(1, 2, "t1", "k1", 1);
c.put(3, 4, "t2", "k2", 2);
c.put(5, 6, "t1", "t1", 3);
c.get(4,"t2","k2");
c.put(10,10,"t1","t1",10);
c.put(7, 8, "t4", "k4", 4);
for(var i in c.map)
{
	console.log(c.map[i]);
	//for(var x in c.map[i])
	//		console.log(c.map[i][x]);
}


	
	
	
