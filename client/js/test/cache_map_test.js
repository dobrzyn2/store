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

	it('evict the first three items placed in cache p1', function(done){
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
				console.log(v);
				if(v != "1" && v != "2" && v != "3")
					pass_condition_1 &= false;

				
				if(v == "a" || v == "b" || v == "c")
					pass_condition_2 &= false;
				
			}
		}
		var pass_condition = pass_condition_1 && pass_condition_2;
		console.log(pass_condition);
		if(pass_condition == false)
			return -1;

		pass_condition &= (count_keys == cache_size);
		console.log(pass_condition);
		if(pass_condition)
			done();
		else return -1;
		
	});
});

