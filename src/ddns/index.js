"use strict";
module.exports = (dns, async) => {
	if (dns && typeof dns.createServer === 'function')
		DNS = dns;
	if (async)
		ASYNC = async;

	return (!!dns && !!async)
		? DDNSServer
		: () => {};
}

var DNS, ASYNC;
var VALID_IP4_ADDRESS = /^(?:(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])$/;
var VALID_IP6_SEGMENT = /^((?:[1-9a-f][0-9a-f]{0,2})?[0-9a-f])$/i;
var VALID_IP6_ADDRESS = /^(((?:[1-9a-f][0-9a-f]{0,2})?[0-9a-f]:){1,6}(:(?:[1-9a-f][0-9a-f]{0,2})?[0-9a-f]){1,6}|:(:|(:(?:[1-9a-f][0-9a-f]{0,2})?[0-9a-f]){0,7})|((?:[1-9a-f][0-9a-f]{0,2})?[0-9a-f]:){1,7}:)$/i;

DDNSServer.prototype = Object.create(null);
DDNSServer.prototype.start = startServer;
DDNSServer.prototype.entries = getEntries;
DDNSServer.prototype.request = requestAddress;
DDNSServer.prototype.close = closeServer;

var authority = {
		address: '8.8.8.8',
		port: 53,
		type: 'udp'
	};

function DDNSServer() {
	this._entries = [];
	this.server = DNS.createServer();
	this.ddnscontrol = require('./ddnscontrol');

	this.server.on('listening', () => {
		this.ddnscontrol.start(this.server.address().address, this._entries);
	});
	this.server.on('socketError', function(err, socket) {
		console.error(err);
	});
	this.server.on('error', function(err, buff, req, res) {
		console.error(err.stack);
	});
	this.server.on('request', handleRequest.bind(this));
	this.server.on('close', () => {
		this.ddnscontrol.close();
	});
}

function startServer(ip) {
	this._entries.push({
		domain: 'ddns.' + require('os').hostname() + '.local',
		records:[
			{ type: 'A', address: ip }
		]
	});
	this.server.serve(53, ip);
}

function getEntries() {
	return this._entries;
}

function handleRequest(request, response) {
	var f = [];

console.log('DNS Request made...');
	request.question.forEach((question) => {
		var entry = this._entries.filter((r) => {
			return new RegExp('^'+r.domain.replace(/\./g, '\\.')+'$', 'i').exec(question.name)
		});
		if (entry.length) {
			entry[0].records.forEach((record) => {
				record.name = question.name;
				record.ttl = record.ttl || 1800;
				response.answer.push(DNS[record.type](record));
			});
		}
		else {
			f.push((cb) => {
				proxyRequest(question, response, cb);
			});
		}
	});

	ASYNC.parallel(f, function() { response.send(); });
}

function proxyRequest(question, response, cb) {
	var request = DNS.Request({
		question: question, // forwarding the question
		server: authority,  // this is the DNS server we are asking
		timeout: 1000
	});

  // when we get answers, append them to the response
	request.on('message', (err, msg) => {
		msg.answer.forEach((a) => {
			response.answer.push(a);
		});
	});

	request.on('end', cb);
	request.send();
}

function requestAddress(type, range) {
	type = type || 'A';
	this.entries().forEach((entry) => {
		entry.records.forEach((record) => {
			if (record.type === type)
				;
		});
	});
}

function parseIPv4Address(address) {
	var segments = address.split('.').map((segment) => {
		return (!isNaN(segment)) ? +segment : segment;
	});
}

function parseIPv6Address(address) {
	var segments = address.split(':').map((segment) => {
			var hex = '0x' + segment;
			return (!isNaN(hex)) ? +hex : segment;
		}),
		nSegments = segments.length;

	if (nSegments > 8 || nSegments < 3)
		return false;
	else if ((nSegments <= 6) && segments[nSegments - 1])
		return false;
}

function closeServer() {
	this.server.close();
}
