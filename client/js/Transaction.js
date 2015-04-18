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
//import com.treode.store.{StaleException, TxClock}
 //requires
//Class constructor
 function Transaction(cache, read_timestamp, max_age, no_cache){
 	this.cache = cache;
 	this.read_timestamp = read_timestamp;
 	this.max_age = max_age;
 	this.no_cache = no_cache;
 	//this.min_rt; //TxClock.MaxValue
 	//this.max_vt; //TxClock.MinValue
 	//this.view = map of (table,key)->(op, value)
 }

 Transaction.prototype = {
 	constuctor: Transaction,
 	read:function(table, key, max_age, no_cache){
 		//returns JSON / throws StaleException
 	},
 	write:function(table, key, value){

 	},
 	delete:function(table, key){

 	},
 	commit:function(){
 		//returns TxClock, throws StaleException
 	}
 }