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
	Run by using 'mocha' on the parent dir of test
*/
var cache_map = require('../cache_map.js');
var should    = require('should'),
	supertest = require('supertest');

//cache_map put tests
describe('cache_map.put()',function(){

	//most basic test, should accept 3 puts and all elements should be in the cache map
	//does not validate values, that is done in 'get' tests
	it('should place 3 objects with different keys in the cache ', function(done){
		var cache_size = 3;
		var pass_condition = false;
		var c = new cache_map(cache_size);

		c.put(1,2,"fruit","apple","red");
		c.put(3,4,"fruit","banana","yellow");
		c.put(5,6,"sport","tennis","racquet");
		
		//check that each item gets its own list in the cache
		var count = 0;
		for(var i in c.map)
			count++;
		//make sure we counted correct number of entries
		pass_condition = (count == cache_size && c.size == cache_size);
		if(pass_condition)
			done();
		else return -1;
	});

	//maps same key:table with varying value_times and values, 
	//there should be 3 distinct elements in a single list entry

	it('should place 3 objects with different same keys in the cache ', function(done){
		var cache_size = 3;
		var pass_condition = false;
		var c = new cache_map(cache_size);

		c.put(1,2,"key","table","val_1");
		c.put(3,4,"key","table","val_2");
		c.put(5,6,"key","table","val_3");

		var count_keys = 0;
		var count_len  = 0;
		for(var i in c.map)			//for keys in map
		{
			count_keys++;
			for(var x in c.map[i])	//for entries in map[key]'s list
				count_len++;
		}
		pass_condition  = (count_keys == 1);
		pass_condition &= (count_len == cache_size);
		if(pass_condition)
			done();
		else return -1;
		
	});

	//cache should run out of space and evict the first 3 items to make room for new puts

	it('should evict the first three items placed in cache p1', function(done){
		var cache_size = 3;
		var pass_condition_1 = true;
		var pass_condition_2 = true;
		var c = new cache_map(cache_size);

		c.put(1,2,"fruit","apple",    "a");
		c.put(3,4,"fruit","banana",   "b");
		c.put(5,6,"sport","tennis",   "c");
		c.put(7,8,"furniture","chair","1");
		c.put(9,0,"ascii","letter",   "2");
		c.put(1,2,"book","biography", "3");


		var count_keys = 0;
		var count_elements = 0;
		for(var key in c.map)
		{
			count_keys++;
			var arr = c.map[key];
			for(var i in c.map[key])
			{
				count_elements++;
				var v = arr[i].data.value;
				if(v != "1" && v != "2" && v != "3")	//check for valid values without using get
					pass_condition_1 &= false;

				if(v == "a" || v == "b" || v == "c")	//check for invalid values without using get
					pass_condition_2 &= false;
				
			}
		}
		var pass_condition = pass_condition_1 && pass_condition_2;
		if(pass_condition == false)
			return -1;

		pass_condition &= (count_elements == cache_size);
		pass_condition &= (count_keys == cache_size);	//check that we deleted array entirely if empty
		if(pass_condition)
			done();
		else return -1;
		
	});

	//similar test except this checks if eviction works when there exists only 1 key for multiple values

	it('should evict the first three items placed in cache p2', function(done){
		var cache_size = 3;
		var pass_condition_1 = true;
		var pass_condition_2 = true;
		var c = new cache_map(cache_size);

		c.put(1,1,"table","key","a");
		c.put(2,2,"table","key","b");
		c.put(3,3,"table","key","c");
		c.put(4,4,"table","key","1");
		c.put(5,5,"table","key","2");
		c.put(6,6,"table","key","3");


		var count_keys = 0;
		for(var key in c.map)				
		{
			var arr = c.map[key];
			for(var i in c.map[key])		
			{
				count_keys++;
				var v = arr[i].data.value;
				if(v != "1" && v != "2" && v != "3")	//check for an valid value
					pass_condition_1 &= false;

				if(v == "a" || v == "b" || v == "c")	//check for an invalid value
					pass_condition_2 &= false;
				
			}
		}
		var pass_condition = pass_condition_1 && pass_condition_2;
		if(pass_condition == false)
			return -1;

		pass_condition &= (count_keys == cache_size);
		if(pass_condition)
			done();
		else return -1;
		
	});
	
	//tests that updating the cached_time of an object makes it mru and doesn't add new entry

	it('should evict the first 2 items placed in cache and update cache_time p1', function(done){
		var cache_size = 3;
		var pass_condition_1 = true;
		var pass_condition_2 = true;
		var c = new cache_map(cache_size);

		c.put(1,2,"fruit","apple",    "a");
		c.put(3,4,"fruit","banana",   "b");
		c.put(5,6,"sport","tennis",   "1");
		c.put(7,8,"furniture","chair","2");
		c.put(6,6,"sport","tennis",   "1");			//picking a value_time equivalent to 3rd element, should be mru
		c.put(1,2,"book","biography", "3");


		var count_keys = 0;
		for(var key in c.map)					
		{
			var arr = c.map[key];
			for(var i in c.map[key])			
			{
				count_keys++;
				var v = arr[i].data.value;
				if(v != "1" && v != "2" && v != "3")	//check for valid
					pass_condition_1 &= false;

				if(v == "a" || v == "b")				//check for invalid
					pass_condition_2 &= false;
			}
		}
		var pass_condition = pass_condition_1 && pass_condition_2;
		if(pass_condition == false)
			return -1;

		pass_condition &= (count_keys == cache_size);
		if(pass_condition)
			done();
		else return -1;
		
	});

	//tests that updating works similarly when we have multiple elements in the map[key] list

	it('should evict 2 items from cache and update cache_time for the first element', function(done){
		var cache_size = 3;
		var pass_condition_1 = true;
		var pass_condition_2 = true;
		var c = new cache_map(cache_size);

		c.put(1,1,"table","key","a");
		c.put(2,2,"table","key","b");
		c.put(3,3,"table","key","c");
		c.put(2,1,"table","key","a");	//should update first put
		c.put(5,5,"table","key","1");
		c.put(6,6,"table","key","2");


		var count_keys = 0;
		for(var key in c.map)				
		{
			var arr = c.map[key];
			for(var i in c.map[key])
			{
				count_keys++;
				var v = arr[i].data.value;
				if(v != "a" && v != "1" && v != "2")
					pass_condition_1 &= false;

				if( v == "b" || v == "c")
					pass_condition_2 &= false;
				
			}
		}
		var pass_condition = pass_condition_1 && pass_condition_2;
		if(pass_condition == false)
			return -1;

		pass_condition &= (count_keys == cache_size);
		if(pass_condition)
			done();
		else return -1;
		
	});

});

//Tests related to checking correct values for a given key, table, and readtime

describe('cache_map.get()',function(){

	//basic test to ensure all elements made it into the cache

	it('should retrive all elements in cache p1', function(done){
		var late_time = 100;				
		var cache_size = 3;
		var c = new cache_map(cache_size);
		var pass_condition = true;

		c.put(1,2,"fruit","apple", "a");
		c.put(3,4,"fruit","banana","b");
		c.put(5,6,"sport","tennis","c");


		if(c.get(late_time,"fruit","apple").value != 'a')
			pass_condition &= false;

		if(c.get(late_time,"fruit","banana").value != 'b')
			pass_condition &= false;

		if(c.get(late_time,"sport","tennis").value != 'c')
			pass_condition &= false;

		if(pass_condition)
			done();
		else return -1;
	});

	//similar test but instead mapping elements to the same key with different value_times

	it('should retrive all elements in cache p2', function(done){
		var late_time = 100;
		var cache_size = 3;
		var c = new cache_map(cache_size);
		var pass_condition = true;

		c.put(1,1,"table","key","a");
		c.put(2,2,"table","key","b");
		c.put(3,3,"table","key","c");


		if(c.get(1,"table","key").value != 'a')
			pass_condition &= false;

		if(c.get(2,"table","key").value != 'b')
			pass_condition &= false;

		if(c.get(3,"table","key").value != 'c')
			pass_condition &= false;

		if(pass_condition)
			done();
		else return -1;
	});

	//check if reading at earlier time prevents reading values written at a later time

	it('should miss certain elements due to early read times p1', function(done){
		var late_time  = 100;
		var early_time = 1;
		var cache_size = 3;
		var c = new cache_map(cache_size);
		var pass_condition = true;

		c.put(10,20,"fruit","apple", "a");
		c.put(30,40,"fruit","banana","b");
		c.put(50,60,"sport","tennis","c");

		if(c.get(late_time,"fruit","apple").value != 'a')
			pass_condition &= false;

		if(c.get(early_time,"fruit","banana") != -1)		//should miss due to early read time
			pass_condition &= false;

		if(c.get(early_time,"sport","tennis") != -1)		//should miss due to early read time
			pass_condition &= false;

		if(c.get(late_time,"fruit","banana").value != "b")		//should hit with later read time
			pass_condition &= false;

		if(c.get(late_time,"sport","tennis").value != "c")		//should hit with later read time
			pass_condition &= false;

		if(pass_condition)
			done();
		else return -1;
	});

	it('should miss certain elements due to early read times p2', function(done){
		var late_time = 100;
		var med_time = 1;
		var early_time = 0;
		var cache_size = 3;
		var c = new cache_map(cache_size);
		var pass_condition = true;

		c.put(3,3,"table","key","a");
		c.put(2,2,"table","key","b");
		c.put(1,1,"table","key","c");
		

		if(c.get(late_time,"table","key").value != 'a')
			pass_condition &= false;

		if(c.get(early_time,"table","key") != -1)
			pass_condition &= false;
		
		if(c.get(med_time,"table","key").value != 'c')
			pass_condition &= false;
		
		if(pass_condition)
			done();
		else return -1;
	});

	//should ensure getting an element promotes that element to mru
	//also checks that invalid 'get' doesn't mistakenly update another value
	it('should promote a get request to most recently used', function(done){
		var late_time  = 100;
		var early_time = 1
		var cache_size = 3;
		var c = new cache_map(cache_size);
		var pass_condition = true;

		c.put(10,20,"fruit","apple", "a");
		c.put(30,40,"fruit","banana","b");
		c.put(50,60,"sport","tennis","c");
		c.get(late_time, "fruit", "apple");			//will update first element that was entered
		c.put(70,80,"device","phone", "cell");
		c.get(early_time,"fruit","banana");			//will not update to mru
		c.put(80,90,"U.S","Chicago","park");

	
		if(c.get(late_time,"sport","tennis") != -1)			//should get evicted
			pass_condition &= false;

		if(c.get(late_time,"fruit","apple").value != "a")
			pass_condition &= false;

		if(c.get(late_time, "device","phone").value != "cell")
			pass_condition &= false;

		if(c.get(late_time, "U.S", "Chicago").value != "park")
			pass_condition &= false;

		if(c.get(late_time,"fruit","banana") != -1)
			pass_condition &= false;

		if(pass_condition)
			done();
		else return -1;
	});
	
	//should ensure we dont have access to things outside of cachelimits

	it('should miss on entries outside of cache and non existent entries', function(done){
	
		var late_time = 100;
		var early_time = 1;
		var cache_size = 3;
		var c  = new cache_map(cache_size);
		var pass_condition = true;

		c.put(10,10,"k","t","v0");	
		c.put(11,11,"k","t","v1");	
		c.put(12,12,"k","t","v2");	
		c.get(10,"k","t");
		c.put(14,14,"fruit","apple","red");	

		if(c.get(9,"k","t") != -1)
			pass_condition &= false;
	
		if(c.get(15,"fruit","apple").value != "red")
			pass_condition &= false;
		
		if(c.get(10,"k","t").value != "v0")
			pass_condition &= false;
	
		if(c.get(11,"k","t").value != "v0")
			pass_condition &= false;

		if(c.get(late_time,"key","table") != -1)
			pass_condition &= false;

		if(pass_condition)
			done();
		return -1;
	});

});

