var nf = require('../nodefly');
var proxy = require('../proxy');
var counts = require('../counts');

var samples = require('../samples');
var tiers = require('../tiers');
var topFunctions = require('../topFunctions');
var graphHelper = require('../graphHelper');

module.exports = function (levelup) {
	proxy.after(levelup, 'create', function (obj, args, connection) {
		proxy.after(connection, ['createPushQueue','createPubQueue'], function (obj, args, queue) {
			proxy.after(queue, 'publish', function (obj, args, queue) {
				counts.sample('strongmq_out');
			});
		});
		proxy.after(connection, ['createPullQueue','createSubQueue'], function (obj, args, queue) {
			queue.on('message', function () {
				counts.sample('strongmq_in');
			});
		});
	});
};