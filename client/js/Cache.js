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
var txclock = require('TxClock');
var http = require('http');
var Skiplist = require('skiplist');
var DoublyLinkedList = require('doubly-linked-list-js');

function Cache(cache_limit){
	this.size = 0;
	this.limit = cache_limit;
	//this.map = new Skiplist();
	this.map = {};
	this.list = new DoublyLinkedList();
	// should be :(string, string) -> List (TxClock, TxClock, JSON)
	
}

Cache.prototype = {
	constructor: Cache,
	read:function(table, key){
		var result = this.map[key + ":" + table];
		if(result == undefined)
		{
			console.log("that key does not have a value");
			return result;
		}
		//need to promote the value to the head of the dll
		var value = result.value;
		var entry = {key:key, table:table, value:value};
		//find the node in the dll, remove it and then add it back to the top of the list.
		
		//first convert list to array for easy search
		var currentList = [];
		this.list.forEach(function (data) {
    		currentList.push(data);
		}, '');
 		var i;
		for(i in currentList)
		{	
			//find the (key, table)
			if(currentList[i].key == key && currentList[i].table == table)
			{
				this.list.removeAt(i);
				break;
			}
		}
		this.list.add(entry);
		return result;
		//returns JSON
	},
		//op_list is a 2d array (table, key) -> (op, value)
	write:function(condition_time, op_list){
		//returns TxClock, throws StaleException
		var table_in = op_list[0][0];
		var key_in = op_list[0][1];
		var op = op_list[1][0];
		var value = op_list[1][1];
		var entry = {key:key_in, table:table_in, value:value};

		//create or hold or update or delete
		if (op == "create")
		{
			this.map[key_in + ":" + table_in] = [entry];
				if(this.size === this.limit)				//remove the last used entry
				{	
					var node = this.list.removeAt(0)					//remove from the list
					delete this.map[node.key + ":" + node.table];		//remove from the hash
					this.size--;
				}
			this.list.add(entry);							//added to tail
			this.size++;
		}

		if (op == "hold")
		{	
			//TODO ^
		}

		if (op == "update")
		{
			this.map[key_in + ":" + table_in].push(entry);	//append the new value
		}

		if(op == "delete")
		{
			delete this.map[key_in + ":" + table_in];
			var currentList = [];
			this.list.forEach(function (data) {
    			currentList.push(data);
			}, '');
 			var i;
			for(i in currentList)
			{	
				//find the (key, table)
				if(currentList[i].key == key_in && currentList[i].table == table_in)
				{
					this.list.removeAt(i);
					break;
				}
			}	
		}
	}
}

	var c = new Cache(5);

	c.write(0,[["a","a"],["create", "4"]]);
	c.write(0,[["a","a"],["delete"]]);
	//c.write(2,[["a","a"],["create", "5"]]);
	//c.write(4,[["b","b"],["create", "5"]]);
	//c.write(5,[["c","c"],["create", "6"]]);
	//c.write(6,[["d","d"],["create", "7"]]);
	JSON.stringify(c.map);
	//PRINTS THE LINKED LIST
	for (var i in c.map)
	{
		//console.log(typeof(c.map[i]));
		console.log(c.map[i]);
		for(var x in i.length)
			console.log(c.map[i][x]);
	} 

	
	
