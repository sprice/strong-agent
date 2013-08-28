var should = require('should');

var Uhura = require('uhura');
var tiers = require('../lib/tiers');
var config = require('../lib/config');
var Transport = require('../lib/transport/uhura');
var nf = require('../lib/main');

function verifyDataIntegrity (data) {
	data.should.have.property('tiers');
	data.tiers.should.have.property('http');

	data.tiers.http.should.have.property('sum');
	data.tiers.http.sum.should.be.a('number');

	//TODO: replaced with mean, median, and stddev
	data.tiers.http.should.have.property('avg');
	data.tiers.http.avg.should.be.a('number');

	data.tiers.http.should.have.property('count');
	data.tiers.http.count.should.be.a('number');
}

describe('tiers', function () {

	// Unit test
	it('should store data in measured', function () {
		// Stub out start and initialize
		var oldStart = tiers.prototype.start;
		tiers.prototype.start = function () {};
		var test = tiers.init();
		tiers.prototype.start = oldStart;

		// Add some data
		test.sample('http', { ms: Date.now() });

		// Restore old start
		tiers.prototype.start = oldStart;

		// Verify data structure is as expected
		var data = test.stats.toJSON();
		try { verifyDataIntegrity(data); }
		catch (e) { throw new Error(e); }
	});

	// Integration test
	it('should output correctly to collector', function (next) {
		this.timeout(5000);

		// Do some cheating to speed up the test
		config.tiersInterval = 500;

		// Black hole
		var uhuraServer = Uhura.createServer(function (c) {
			c.on('createSession', function () {
				c.send('newSession', null, {
					sessionId: 'foo'
					, appHash: 'bar'
				});
			});

			function verify (err, data) {
				nf.transport.disconnect();
				c.disconnect();

				expressServer.close(function () {
					uhuraServer.close(function () {
						try { verifyDataIntegrity(data); }
						catch (e) { next(e); }
						next(err);
					});
				});
			}

			c.on('update', function (data) {
				data.tiers && data.tiers.http && verify(data);
			});
		}).listen(config.uhura.port);

		// Start profiling
		nf.profile('foo', 'bar');

		// Start an express server and make a request to it
		var express = require('express');
		var request = require('request');

		var app = express();
		app.get('/', function (req, res) { res.end('bar'); });
		var expressServer = app.listen(9876, function () {
			request('http://127.0.0.1:9876/', function () {});
		});
	});

});
