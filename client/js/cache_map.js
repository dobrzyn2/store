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
 */

var Txclock = require('./TxClock');
var DoublyLinkedList = require('doubly-linked-list-js');


function cache_map(cache_limit){
	
	this.size = 0;
	this.limit = cache_limit;
	this.map = {};	
	this.list = new DoublyLinkedList();
	this.list.makeLinear();

}

cache_map.prototype = {
	constructor: cache_map,

	//DONE
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
	//DONE
	addList:function(read_time, value_time, table, key, value)
	{
		//create new entry in map
		var k = this.key_gen(key, table);
		
		//create new entry in list
		var list_entry = {key:key, table:table, value_time:value_time, cached_time:read_time, value:value};
		this.list.add(list_entry);				//currently at the tail, need to push to head..
		this.map[k] = [this.list._tail];	//pass reference to dll node
		this.size++;
		this.prune();
		return;

	},
	//NOTDONE
	appendList:function(read_time, value_time, table, key, value)
	{
		var k = this.key_gen(key, table);
		for(var i in this.map[k])
		{
			if(this.map[k][i].data.value_time == value_time)
			{
				this.map[k][i].data.cached_time = this.max(this.map[k][i].data.cached_time, read_time);
				this.promote(this.map[k][i]);
				return;
			}
		}
		var list_entry = {key:key, table:table, value_time:value_time, cached_time:read_time, value:value};
		this.list.add(list_entry);
		this.map[k].push(this.list._getAt(0));
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
		//need to check if the associated array value is non empty
		
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
		for(var i in this.map[k])
		{
			if(this.map[k][i].data.value_time <= read_time && !found_first)
			{
				max = this.map[k][i];
				found_first = true;
				continue;
			}
			var map_object= this.map[k][i].data;
			if(map_object.value_time <= read_time && map_object.value_time > max.data.value_time)
				max = this.map[k][i];
		}
		if(max == undefined)
			return -1; 							//couldn't find in the cache
		//this.promote(key, table, max.value_time);
		//promote max to front
		//(value_time, cached_time, JSON value)
		this.list.makeLinear();
		this.promote(max);
		return {value_time:max.data.value_time, cached_time:max.data.cached_time, value:max.data.value};
	},

	key_gen:function(key, table)
	{
		return key + ":" + table;
	},

//THIS IS BROKEN FOR SURE
	promote:function(node)
	{
		//first lets setup the node behind us...
		var isHead = this.list._isHead(node);
		var isTail = this.list._isTail(node);
		if(node !== null)
		{
			if(isTail)
				return; //we are already at the mru
			if(isHead)
			{
				node.next.previous = null;	//cut off from list
				this.list._head = node.next;
				this.list._tail.next = node;	//add to front
				node.previous = this.list._tail;	//link to rest
				this.list._tail = node;			//set pointer to new mru
				return;
			}
			node.next.previous = node.previous;
			node.previous.next = node.next;
			this.list._tail.next = node;
			node.previous = this.list._tail;
			this.list._tail = node;

		}
		

	},

	sameNode:function(a, b)
	{
		var sameKey = a.data.key == b.data.key;
		var sameTable = a.data.table == b.data.table;
		var sameValue_time = a.data.value_time == b.data.value_time;
		return sameKey && sameTable && sameValue_time;
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

var c = new cache_map(2);
c.put(4,3,"fruit","a","red");
c.put(7,7,"fruit","b","yellow");
c.put(9,10,"fruit","d","brown");
c.put(8,7,"fruit","b","yellow");

c.put(11,11,"x","y","d");
c.put(12,13,"z","a","b");
c.list.makeLinear();
//should get yellow xy za


for(var i = 0; i < c.size; i++)
	console.log(c.list._getAt(i).data);
//console.log("tail ");
//console.log(c.list._tail.data);
//for(var i in c.map)
//	console.log(c.map[i]);
//console.log(c.map["apple:fruit"]);
//console.log(c.list._tail);
//console.log(c.list._head);
/*
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

	