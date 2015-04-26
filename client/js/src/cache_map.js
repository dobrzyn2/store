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

<<<<<<< HEAD:client/js/src/cache_map.js


var tx_clock = require('./tx_clock');
=======


var tx_clock         = require('./tx_clock');
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
/**
*	Constructor
*/

function cache_map(cache_limit){
	this._size  = 0;
	this._limit = cache_limit;
	this._map   = {};	
	this._head = null;
	this._tail = null;
}

cache_map.prototype = {
	constructor: cache_map,

<<<<<<< HEAD:client/js/src/cache_map.js
	/**
	*	Description: Adds an object to the head of our list
	*	@private
	*/
	_add:function(node)
	{
		if(this._size == 0)			//if this is the only item
=======
	/*
	*	Description: Adds an object to the head of our list
	*/
	add:function(node)
	{
		if(this.size == 0)			//if this is the only item
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
		{
			this._head = node; 
			this._tail = node;
			return 1;
		}
		this._head.next = node;
		node.previous = this._head;
		this._head = node;
		return 1;
	},
	/**
	* Description: Converts input params into tx_clocks, based on whether there exists
	*			an associated list for the give key,value we either append the list or
	*			create a brand new entry in the map. 
	*	@public	
	*/
	put:function(read_time, value_time, table, key, value)
	{
		if(read_time.constructor == Number)
			read_time = new tx_clock(read_time);
		if(value_time.constructor == Number)
			value_time = new tx_clock(value_time);

		var k     = this._keyGen(key, table);
		var array = this._map[k];
		if(array === undefined)					//there exists no entry for that key
			this._addList(read_time, value_time, table, key, value);
		else
			this._appendList(read_time, value_time, table, key, value);
		
	},

	/**
	*	Description: subroutine for creating new entry in map. Will generate
	*			new object entry and insert into list, then place reference to 
	*			list entry into a new list in the object map
	*	@private
	*/
	_addList:function(read_time, value_time, table, key, value)
	{
		//create new entry in map
		var k = this._keyGen(key, table);
		
		//create new entry in list
		var list_entry = {
			key:key, 
			table:table, 
			value_time:value_time, 
			cached_time:read_time, 
			value:value,
			next:null,
			previous:null
		};

<<<<<<< HEAD:client/js/src/cache_map.js
		this._add(list_entry);		
		this._map[k] = [this._head];		//insert reference to list object	
		this._size++;
		this._prune();
=======
		this.add(list_entry);		
		this.map[k] = [this._head];		//insert reference to list object	
		this.size++;
		this.prune();
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
		return;

	},

	/**
	*	Description: subroutine for appending to an existing list for a specific key
	*			Checks for an element in our list which contains a value_time equal
	*			to the value_time we are inserting. If so, update the cached_time to 
	*			the later of the element's cached_time and the read_time parameter.
	*			If updating, promote list element to mru, otherwise create a new entry
	*	@private
	*/
	_appendList:function(read_time, value_time, table, key, value)
	{
		var k = this._keyGen(key, table);
		for(var i in this._map[k])			//for each key:table
		{
<<<<<<< HEAD:client/js/src/cache_map.js
			if(+this._map[k][i].value_time == +value_time)
			{
				var optimal = new tx_clock(
					Math.max(this._map[k][i].cached_time, read_time)
					);
				this._map[k][i].cached_time = optimal;
				this._promote(this._map[k][i]);					//mru, so promote it
=======
			if(+this.map[k][i].value_time == +value_time)
			{
				var optimal = new tx_clock(
					Math.max(this.map[k][i].cached_time, read_time)
					);
				this.map[k][i].cached_time = optimal;
				this.promote(this.map[k][i]);					//mru, so promote it
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
				return 1;
			}
		}

		var list_entry = {		
			key:key, 
			table:table, 
			value_time:value_time, 
			cached_time:read_time, 
			value:value,
			next:null,					//add will set next and prev pointers
			previous:null
		};
		this._add(list_entry);
		this._map[k].push(this._head);
		this._size++;
		this._prune();
		return 1;

		
	},
	
	/**
	*	Description: wrapper function to remove the lru object from list and map
	*	@private
	*/
	_prune:function()
	{
		while(this._size > this._limit)
			this._evictOne();		
		
	},

	/**
	*	Description: Designed to remove the lru element from the list and then remove the 
	*			empty entry from the map. If removal of the map element results in an empty
	*			list then we completely remove the entry in the map. In this implementation
	*			of the linked list, the lru entry is at the head of the list.
	*	@private
	*/
	_evictOne:function()
	{
<<<<<<< HEAD:client/js/src/cache_map.js
		var lru     = this._removeTail();
		var key     = this._keyGen(lru.key,lru.table);
		var array   = this._map[key];
=======
		var lru     = this.removeAt(0);
		var key     = this.key_gen(lru.key,lru.table);
		var array   = this.map[key];
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
		
		for(var i in this._map[key])
		{
<<<<<<< HEAD:client/js/src/cache_map.js
			if(+this._map[key][i].value_time == +lru.value_time)
			{
				this._map[key].splice(i, 1);			//will remove 1 cell from array
				this._size--;		
=======
			if(+this.map[key][i].value_time == +lru.value_time)
			{
				this.map[key].splice(i, 1);			//will remove 1 cell from array
				this.size--;		
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
			}
		}
		
		//check for an empty list length and remove key entirely if empty
		if(this._map[key].length == 0)
		{
			delete this._map[key];
		}
	},

<<<<<<< HEAD:client/js/src/cache_map.js
	/**
	*	Description: dissociates the tail from dll and returns it to caller
	*	@private
	*/
	_removeTail:function()
	{
		if(this._tail == null)
			return null;
		var removed = this._tail;
		if(this._size > 1)			//where the tail != head
=======
	/*
	*	Description: removes a node from a specified index and returns a reference
	*			to that object. Index counts from the tail of the list since that is
	*			where the lru object will exist. This should be close to an O(1) operation 
	*			for this use case.
	*/
	removeAt:function(loc)
	{
		
		var curNode = this._tail;
		while(loc > 0)
		{	
			curNode = curNode.next;
			loc--;
		}
		if(this.size < 2)					//must set an empty list
		{
			this._head = null;
			this._tail = null;
			return curNode;
		}
		if(curNode.previous == null)		//must set a new tail
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
		{
			removed.next.previous = null;
			this._tail = removed.next;
		}
<<<<<<< HEAD:client/js/src/cache_map.js
		else						//where the tail == head
=======
		if(curNode.next == null)			//must set a new head
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
		{
			this._tail = null;
			this._head = null;
		}
<<<<<<< HEAD:client/js/src/cache_map.js
		return removed;
=======
											//must set adjacent nodes
		curNode.previous.next = curNode.next;
		curNode.next.previous = curNode.previous;
		return curNode;

>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
	},
	
	
	/**
	*	Description: retrives a tuple of value_time, cached_time, and value based
	*			on the time we are reading for a given object associated with the
	*			given table and key. Finding a specific element requires finding a
	*			an element whose value was written sometime before we are reading, 
	*			from that subset of elements we choose the maximum value_time.
	*			Finally, the element that we find gets promoted.
	*	@public
	*/
	get:function(read_time, table, key)
	{
		
		//1)search map for table:key and the most recent value_time on or before the given read_time
		//2)promote the use time in this.list
	
		//convert read_time param to a tx_clock 
		if(read_time.constructor == Number)
			read_time = new tx_clock(read_time);

		var k = this._keyGen(key, table);
		var array = this._map[k];
		
		//check for a completely invalid key, table pair
		if(array == undefined || array.length == 0)
			return -1;

		var max         = undefined; 			//maybe we won't find anything
		var found_first = false;				//select the first plausible object
		for(var i in this._map[k])
		{
<<<<<<< HEAD:client/js/src/cache_map.js
			var vt = this._map[k][i].value_time
=======
			var vt = this.map[k][i].value_time
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
			if(+vt <= +read_time && !found_first) 		//so we can set the max to the first eligible val.
			{
				max = this._map[k][i];
				found_first = true;
				continue;
			}
			if(found_first)						//so we don't worry about reading an invalid 'max'
			{
				if(+vt <= +read_time && vt > max.value_time)
<<<<<<< HEAD:client/js/src/cache_map.js
					max = this._map[k][i];
=======
					max = this.map[k][i];
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
			}	
		}
		if(max == undefined)
			return -1; 							//couldn't find in the cache
		
<<<<<<< HEAD:client/js/src/cache_map.js
		this._promote(max);
=======
		this.promote(max);
>>>>>>> d026339... fixed some tx clock comparison operators to simplify code:client/js/cache_map.js
		
		return {
			value_time:max.value_time,
			cached_time:max.cached_time, 
			value:max.value
		};
	},

	/**
	*	Description: generates a single string for a given key and table. 
	*			This format is used to read and write to the internal map.
	*	@private
	*/
	_keyGen:function(key, table)
	{
		return key + ":" + table;
	},

	/**
	*	Description: promotes a given list element to the front of our dll.
	*			in this implementation of the dll, the mru object is at the tail of the
	*			list, and the lru is at the head of the list. If the node is at the 
	*			tail then its already the mru. If node is at the head then we set 
	*			pointers to create a new head. If node is neither head nor tail then
	*			rearrange pointers to _evict element from cur position and insert at tail.
	*	@private
	*/
	_promote:function(node)
	{
		var isHead = this._head == node;
		var isTail = this._tail == node;
		if(node !== null)
		{
			if(isHead)
				return; 				//we are already at the mru position 
			if(isTail)
			{
				node.next.previous = null;				//cut off from list
				this._tail = node.next;					//set tail ptr
				this._head.next = node;					//add to front
				node.previous = this._head;				//link backward to rest of list
				this._head = node;						//set hear ptr
				return;
			}
			node.next.previous = node.previous;			//removes references to this
			node.previous.next = node.next;
			this._head.next = node;						//point it to front
			node.previous = this._head;					//link backward to rest of list
			this._head = node;							//set head ptr
		}
	}
}

module.exports = cache_map;



