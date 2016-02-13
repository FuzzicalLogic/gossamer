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

DDNSServer.prototype = Object.create(null);
DDNSServer.prototype.start = startServer;
DDNSServer.prototype.entries = getEntries;
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

function closeServer() {
	this.server.close();
}
