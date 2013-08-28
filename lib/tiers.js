var nf;

var stats = require('measured').createCollection('tiers');

exports.init = function() {
	nf = global.nodefly;
	start();
}

exports.sample = function(code,time) {
	stats.histogram(code).update(time.ms);
}

function start() {
	setInterval(function(){
		var data = stats.toJSON();
		//data._ts = nf.millis();
		nf.emit('tiers', data.tiers);
		Object.keys(data.tiers).forEach(function (key) {
			stats.histogram(key).reset();
		})
	}, 15*1000);
}
