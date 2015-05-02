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
 * DLL internals : https://github.com/adriano-di-giovanni/doubly-linked-list-js/blob/master/DoublyLinkedList.js
 */


var tx_clock         = require('./tx_clock');
var DoublyLinkedList = require('doubly-linked-list-js');		//keeps track of mru and lru
var LRU_POS = 0;

/**
*	Constructor
*/

function cache_map(cache_limit){
	this.size  = 0;
	this.limit = cache_limit;
	this.map   = {};	
	this.list  = new DoublyLinkedList();
}

cache_map.prototype = {
	constructor: cache_map,

	/*
	* Description: Converts input params into tx_clocks, based on whether there exists
	*			an associated list for the give key,value we either append the list or
	*			create a brand new entry in the map. 	
	*/
	put:function(read_time, value_time, table, key, value)
	{
		if(read_time.constructor == Number)
			read_time = new tx_clock(read_time);
		if(value_time.constructor == Number)
			value_time = new tx_clock(value_time);

		var k     = this.key_gen(key, table);
		var array = this.map[k];
		if(array === undefined)					//there exists no entry for that key
			this.addList(read_time, value_time, table, key, value);
		else
			this.appendList(read_time, value_time, table, key, value);
		
	},

	/*
	*	Description: subroutine for creating new entry in map. Will generate
	*			new object entry and insert into list, then place reference to 
	*			list entry into a new list in the object map
	*/
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
		this.map[k] = [this.list._tail];		//list containing reference to list obj
		this.size++;
		this.prune();
		return;

	},

	/*
	*	Description: subroutine for appending to an existing list for a specific key
	*			Checks for an element in our list which contains a value_time equal
	*			to the value_time we are inserting. If so, update the cached_time to 
	*			the later of the element's cached_time and the read_time parameter.
	*			If updating, promote list element to mru, otherwise create a new entry
	*/
	appendList:function(read_time, value_time, table, key, value)
	{
		var k = this.key_gen(key, table);
		for(var i in this.map[k])			//for each key:table
		{
			var cur_val_time   = this.getValTime(this.map[k][i]);
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
	
	/*
	*	Description: wrapper function to remove the lru object from list and map
	*/
	prune:function()
	{
		while(this.size > this.limit)
			this.evict_one();		
		
	},

	/*
	*	Description: Designed to remove the lru element from the list and then remove the 
	*			empty entry from the map. If removal of the map element results in an empty
	*			list then we completely remove the entry in the map. In this implementation
	*			of the linked list, the lru entry is at the head of the list.
	*/
	evict_one:function()
	{
		var lru     = this.list.removeAt(LRU_POS);
		var key     = this.key_gen(lru.key,lru.table);
		var array   = this.map[key];
		
		for(var i in this.map[key])
		{
			var lru_time = lru.value_time.get_time();
			var cur_time = this.getValTime(this.map[key][i]);

			if(cur_time === lru_time)
			{
				this.map[key].splice(i, 1);			//will remove cell from array
				this.size--;		
			}
		}
		
		//check for an empty list length and remove key entirely if empty
		if(this.map[key].length == 0)
		{
			delete this.map[key];
		}
	},
	
	/*
	*	Description: retrives a tuple of value_time, cached_time, and value based
	*			on the time we are reading for a given object associated with the
	*			given table and key. Finding a specific element requires finding a
	*			an element whose value was written sometime before we are reading, 
	*			from that subset of elements we choose the maximum value_time.
	*			Finally, the element that we find gets promoted.
	*/
	get:function(read_time, table, key)
	{
		
		//1)search map for table:key and the most recent value_time on or before the given read_time
		//2)promute the use time in this.list
	
		//convert read_time param to a tx_clock 
		if(read_time.constructor == Number)
			read_time = new tx_clock(read_time);

		var k = this.key_gen(key, table);
		var array = this.map[k];
		
		//check for a completely invalid key, table pair
		if(array == undefined || array.length == 0)
			return -1;

		var max         = undefined; 			//maybe we won't find anything
		var found_first = false;				//select the first plausible object
		for(var i in this.map[k])
		{
			var val_time = this.getValTime(this.map[k][i]);
			var r_time   = read_time.get_time();
			if(val_time <= r_time && !found_first) 		//so we can set the max to the first eligible val.
			{
				max = this.map[k][i];
				found_first = true;
				continue;
			}
			if(found_first)						//so we don't worry about reading an invalid 'max'
			{
				var val_time     = this.getValTime(this.map[k][i]);
				var r_time       = read_time.get_time();
				var max_val_time = this.getValTime(max);
				if(val_time <= r_time && val_time > max_val_time)
					max = this.map[k][i];
			}	
		}
		if(max == undefined)
			return -1; 							//couldn't find in the cache
		
		this.promote(max);
		
		var data   = max.data;
		var v_time = this.getValTime(max);
		var c_time = data.cached_time.get_time();
		var val    = data.value;
		
		return {
			value_time:v_time,
			cached_time:c_time, 
			value:val
		};
	},

	/*
	*	Description: generates a single string for a given key and table. 
	*			This format is used to read and write to the internal map.
	*/
	key_gen:function(key, table)
	{
		return key + ":" + table;
	},

	/*
	*	Description: promotes a given list element to the front of our dll.
	*			in this implementation of the dll, the mru object is at the tail of the
	*			list, and the lru is at the head of the list. If the node is at the 
	*			tail then its already the mru. If node is at the head then we set 
	*			pointers to create a new head. If node is neither head nor tail then
	*			rearrange pointers to evict element from cur position and insert at tail.
	*/
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
				node.next.previous = null;				//cut off from list
				this.list._head = node.next;
				this.list._tail.next = node;			//add to front
				node.previous = this.list._tail;		//link to rest
				this.list._tail = node;					//set pointer to new mru
				return;
			}
			node.next.previous = node.previous;
			node.previous.next = node.next;
			this.list._tail.next = node;
			node.previous = this.list._tail;
			this.list._tail = node;
		}
	},

	max:function(a, b)
	{
		if(a > b)
			return a;
		return b;
	},

	getValTime:function(obj){
		return obj.data.value_time.get_time();
	}
}

module.exports = cache_map;



