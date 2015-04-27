
	function TxClock(time){
		this.time = time;
	}

	TxClock.prototype = {
		constructor:TxClock,
		get_time:function(){
			return this.time;
		}
	}
	module.exports = TxClock;
	