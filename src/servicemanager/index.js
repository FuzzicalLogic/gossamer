"use strict";
module.exports = (http, connect, dhcps) => {
	if (http && typeof http.createServer === 'function')
		HTTP = http;
	if (typeof connect === 'function')
		CONNECT = connect;
	DHCPS = dhcps;

	return (!!http && !!connect)
		? ServiceManager
		: () => {};
}

var HTTP, CONNECT, DHCPS;
var VALID_IP4_ADDRESS = /^(?:(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])$/;

var util = require('util');

ServiceManager.prototype = Object.create(null);
ServiceManager.prototype.start = startServer;
ServiceManager.prototype.close = closeServer;

function ServiceManager(dns) {
	var hostname = 'services.local',
		address = '127.0.0.1',
		port = 80,
		services = [];

	this.address = (ip) => {
		if ('string' === typeof ip && VALID_IP4_ADDRESS.exec(ip)) {
			address = ip;
			return this;
		}
		return address;
	}
	this.hostname = (name) => {
		if ('string' === typeof name && name !== '') {
			hostname = name;
			return this;
		}
		return hostname;
	};

	this.dhcps = DHCPS.createServer();
	this.dhcps.on('discover', (msg) => {
		var spkt = this.dhcps.offer(msg).encode(new Buffer(1500));
		this.dhcps.broadcast(spkt);
	});
	this.dhcps.on('request', (msg) => {
		var packet;
		if (msg.options && msg.options.serverIdentifier === ''+this.address()) {
			packet = this.dhcps.ack(msg).encode(new Buffer(1500));
			this.dhcps.broadcast(packet);
		}
	});
	this.dhcps.on('decline', (msg) => {
		//var spkt = this.dhcps.createOfferPacket(pkt);
		//this.dhcps.send(spkt, from.port, from.address);
	});
	this.dhcps.on('release', (msg) => {
		//var spkt = this.dhcps.createOfferPacket(pkt);
		//this.dhcps.send(spkt, from.port, from.address);

	});


	this.app = CONNECT();

	this.dns = dns;

	this.app.use((request, response, next) => {
		response.end('Service Manager is running!');
	});
	this.server = HTTP.createServer(this.app);
}

function startServer() {
	this.dhcps.on('listening', () => {
		console.log('DHCP/S started successfully on: ' + this.dhcps.address());
		this.server.listen(80, this.address(), () => {
			this.dns.entries().push({
				domain: this.hostname(),
				records: [
					{ type: 'A', address: this.address() }
				]
			});
		});
	});
	this.dhcps.address(this.address()).start();

}

function closeServer() {
	this.server.close();
}
