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


var tx_clock         = require('./tx_clock');
var DoublyLinkedList = require('doubly-linked-list-js');
var LRU_POS = 0;
//TODO: Find out if makeLinear affects the state of the dll in a significant way

function cache_map(cache_limit){
	
	this.size  = 0;
	this.limit = cache_limit;
	this.map   = {};	
	this.list  = new DoublyLinkedList();
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
		if(read_time.constructor == Number)
			read_time = new tx_clock(read_time);
		if(value_time.constructor == Number)
			value_time = new tx_clock(value_time);

		var k     = this.key_gen(key, table);
		var array = this.map[k];
		if(array === undefined)
			this.addList(read_time, value_time, table, key, value);
		else
			this.appendList(read_time, value_time, table, key, value);
		
	},
	//DONE
	addList:function(read_time, value_time, table, key, value)
	{
		//create new entry in map
		var k = this.key_gen(key, table);
		
		//create new entry in list
		var list_entry = {
			key:key, 
			table:table, 
			value_time:value_time, 
			cached_time:read_time, 
			value:value
		};

		this.list.add(list_entry);				//currently at the tail, need to push to head..
		this.map[k] = [this.list._tail];	//pass reference to dll node
		this.size++;
		this.prune();
		return;

	},
	//DONE
	appendList:function(read_time, value_time, table, key, value)
	{
		var k = this.key_gen(key, table);
		for(var i in this.map[k])			//for each key:table
		{
			var cur_val_time   = this.map[k][i].data.value_time.get_time();
			var param_val_time = value_time.get_time();
			
			if(cur_val_time == param_val_time)
			{
				var cached_time = this.map[k][i].data.cached_time.get_time();
				var r_time      = read_time.get_time();
				var optimal     = new tx_clock(this.max(cached_time, r_time));
				this.map[k][i].data.cached_time = optimal;
				this.promote(this.map[k][i]);					//mru, so promote it
				return 1;
			}
		}

		var list_entry = {
			key:key, 
			table:table, 
			value_time:value_time, 
			cached_time:read_time, 
			value:value
		};
		this.list.add(list_entry);
		this.map[k].push(this.list._tail);
		this.size++;
		this.prune();
		return 1;

		
	},
	//DONE
	prune:function()
	{
		while(this.size > this.limit)
			this.evict_one();		
		
	},

	//DONE
	evict_one:function()
	{
		
		//var lru     = this.list._head;
		var lru     = this.list.removeAt(LRU_POS);
		var key     = this.key_gen(lru.key,lru.table);
		var array   = this.map[key];
		
		for(var i in this.map[key])
		{
			var lru_time = lru.value_time.get_time();
			var cur_time = this.map[key][i].data.value_time.get_time();

			if(cur_time === lru_time)
			{
				this.map[key].splice(i, 1);			//will remove cell from array
				this.size--;		
			}
		}
		
		if(this.map[key].length == 0)
		{
			delete this.map[key];
		}
	},
	//DONE
	get:function(read_time, table, key)
	{
		
		//1)search map for table:key and most recent value_time that is less than or equal to read_time
		//2)promute the use time in this.list
		if(read_time.constructor == Number)
			read_time = new tx_clock(read_time);

		var k = this.key_gen(key, table);
		var array = this.map[k];
		
		if(array == undefined || array.length == 0)
			return -1;

		var max         = undefined; 			//maybe we won't find anything
		var found_first = false;		//select the first plausible object
		for(var i in this.map[k])
		{
			var val_time = this.map[k][i].data.value_time.get_time();
			var r_time   = read_time.get_time();
			if(val_time <= r_time && !found_first)
			{
				max = this.map[k][i];
				found_first = true;
				continue;
			}
			if(found_first)
			{
				var map_object   = this.map[k][i].data;
				var val_time     = map_object.value_time.get_time();
				var r_time       = read_time.get_time();
				var max_val_time = max.data.value_time.get_time();
				if(val_time <= r_time && val_time > max_val_time)
					max = this.map[k][i];
			}	
		}
		if(max == undefined)
			return -1; 							//couldn't find in the cache
		this.list.makeLinear();
		this.promote(max);
		
		var data   = max.data;
		var v_time = data.value_time.get_time();
		var c_time = data.cached_time.get_time();
		var val    = data.value;
		
		return {
			value_time:v_time,
			cached_time:c_time, 
			value:val
		};
	},

	key_gen:function(key, table)
	{
		return key + ":" + table;
	},

	promote:function(node)
	{
		
		if(node.previous == null)
			this.list._head = node;
		var isHead = this.list._isHead(node);
		var isTail = this.list._isTail(node);
		if(node !== null)
		{
			if(isTail)
				return; 		//we are already at the mru position
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
module.exports = cache_map;



