
	function tx_clock(u_sec){
		this.micro_sec = u_sec;
	}

	tx_clock.prototype = {
		constructor:tx_clock,
		get_usec:function(){
			return this.micro_sec;
		},
		valueOf:function(){
			return this.micro_sec;
		}
	}
	module.exports = tx_clock;

	