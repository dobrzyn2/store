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

describe('cache_map.put()',function(){

	it('should place 3 objects with different keys in the cache ', function(done){
		var cache_size = 3;
		var pass_condition = false;
		var c = new cache_map(cache_size);

		c.put(1,2,"fruit","apple","red");
		c.put(3,4,"fruit","banana","yellow");
		c.put(5,6,"sport","tennis","racquet");
		//check that each item gets its own container in the cache
		var count = 0;
		for(var i in c.map)
			count++;

		pass_condition = (count == cache_size && c.size == cache_size);
		if(pass_condition)
			done();
		else return -1;
	});

	it('should place 3 objects with different same keys in the cache ', function(done){
		var cache_size = 3;
		var pass_condition = false;
		var c = new cache_map(cache_size);

		c.put(1,2,"key","table","val_1");
		c.put(3,4,"key","table","val_2");
		c.put(5,6,"key","table","val_3");



		var count_keys = 0;
		var count_len  = 0;
		for(var i in c.map)
		{
			count_keys++;
			for(var x in c.map[i])
				count_len++;
		}
		pass_condition  = (count_keys == 1);
		pass_condition &= (count_len == cache_size);
		if(pass_condition)
			done();
		else return -1;
		
	});

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
		for(var key in c.map)
		{
			var arr = c.map[key];
			for(var i in c.map[key])
			{
				count_keys++;
				var v = arr[i].data.value;
				if(v != "1" && v != "2" && v != "3")
					pass_condition_1 &= false;

				if(v == "a" || v == "b" || v == "c")
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
				if(v != "1" && v != "2" && v != "3")
					pass_condition_1 &= false;

				if(v == "a" || v == "b" || v == "c")
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
	it('should evict the first 2 items placed in cache and update cache_time p1', function(done){
		var cache_size = 3;
		var pass_condition_1 = true;
		var pass_condition_2 = true;
		var c = new cache_map(cache_size);

		c.put(1,2,"fruit","apple",    "a");
		c.put(3,4,"fruit","banana",   "b");
		c.put(5,6,"sport","tennis",   "1");
		c.put(7,8,"furniture","chair","2");
		c.put(6,6,"sport","tennis",   "1");			//picking a value_time equivalent to 3rd element
		c.put(1,2,"book","biography", "3");


		var count_keys = 0;
		for(var key in c.map)
		{
			var arr = c.map[key];
			for(var i in c.map[key])
			{
				count_keys++;
				var v = arr[i].data.value;
				if(v != "1" && v != "2" && v != "3")
					pass_condition_1 &= false;

				if(v == "a" || v == "b")
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
	it('should evict 2 items from cache and update cache_time for the first element', function(done){
		var cache_size = 3;
		var pass_condition_1 = true;
		var pass_condition_2 = true;
		var c = new cache_map(cache_size);

		c.put(1,1,"table","key","a");
		c.put(2,2,"table","key","b");
		c.put(3,3,"table","key","c");
		c.put(2,1,"table","key","1");
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
				if(v != "a" && v != "2" && v != "3")
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

describe('cache_map.get()',function(){
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
		if(c.get(early_time,"fruit","banana") != -1)		//error
			pass_condition &= false;
		if(c.get(early_time,"sport","tennis") != -1)
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
	//should ensure getting promotes to mru
	it('should promote a get request to most recently used p1', function(done){
		var late_time  = 100;
		var early_time = 1
		var cache_size = 3;
		var c = new cache_map(cache_size);
		var pass_condition = true;

		c.put(10,20,"fruit","apple", "a");
		c.put(30,40,"fruit","banana","b");
		c.put(50,60,"sport","tennis","c");
		c.get(late_time, "fruit", "apple");
		c.put(70,80,"device","phone", "cell");
		c.put(80,90,"U.S","Chicago","park");
	
		if(c.get(late_time,"sport","tenns") != -1)
			pass_condition &= false;
		if(c.get(late_time,"fruit","apple").value != "a")
			pass_condition &= false;
		if(c.get(late_time, "device","phone").value != "cell")
			pass_condition &= false;
		if(c.get(late_time, "U.S", "Chicago").value != "park")
			pass_condition &= false;
		if(pass_condition)
			done();
		else return -1;
	});
	//should ensure we dont have access to things outside of cachelimits


});

