
	function tx_clock(time){
		this.time = time;
	}

	tx_clock.prototype = {
		constructor:tx_clock,
		get_time:function(){
			return this.time;
		}
	}
	module.exports = tx_clock;

	