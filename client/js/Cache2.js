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

var txclock = require('./TxClock');
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
	read:function(read_time, table, key, max_age, no_cache){
		
	},
		//op_list is a 2d array (table, key) -> (op, value)
	write:function(condition_time, op_list){
	
	},

	put:function(read_time, value_time, table, key, value)
	{

	},

	get:function(read_time, table, key)
	{

	}
}

	t = TxClock(6);
	console.log(t.getValue());

	
	
