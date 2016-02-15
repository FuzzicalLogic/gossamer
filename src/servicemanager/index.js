"use strict";
module.exports = (http, connect, dhcpa) => {
	if (http && typeof http.createServer === 'function')
		HTTP = http;
	if (typeof connect === 'function')
		CONNECT = connect;
	DHCPA = dhcpa;

	return (!!http && !!connect)
		? ServiceManager
		: () => {};
}

var HTTP, CONNECT, DHCPA;
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

	this.dhcpa = DHCPA.createServer();
	this.dhcpa.on('message', (msg) => {
		console.log('DHCP/A Message received: ' + util.inspect(msg, false, 3));
	});
	this.dhcpa.on('discover', (from, pkt) => {
		console.log('DHCP/A Discovery received: ' + util.inspect(from, false, 3));
		console.log('DHCP/A Discovery received: ' + util.inspect(pkt, false, 3));
		var spkt = this.dhcpa.createOfferPacket(pkt);
		this.dhcpa.send(spkt, from.port, from.address);
	});
	this.dhcpa.on('request', (from, pkt) => {
		console.log('DHCP/A Request received: ' + util.inspect(from, false, 3));
		console.log('DHCP/A Request contents: ' + util.inspect(pkt, false, 3));
		//var spkt = this.dhcpa.createOfferPacket(pkt);
		//this.dhcpa.send(spkt, from.port, from.address);
	});
	this.dhcpa.on('release', (from, pkt) => {
		console.log('DHCP/A Release received: ' + util.inspect(from, false, 3));
		console.log('DHCP/A Release contents: ' + util.inspect(pkt, false, 3));
		//var spkt = this.dhcpa.createOfferPacket(pkt);
		//this.dhcpa.send(spkt, from.port, from.address);

	});


	this.app = CONNECT();

	this.dns = dns;

	this.app.use((request, response, next) => {
		response.end('Service Manager is running!');
	});
	this.server = HTTP.createServer(this.app);
}

function startServer() {
	this.dhcpa.on('listening', () => {
		console.log('DHCP/A started successfully on: ' + address);
		this.server.listen(80, this.address(), () => {
			this.dns.entries().push({
				domain: this.hostname(),
				records: [
					{ type: 'A', address: this.address() }
				]
			});
		});
	});
	this.dhcpa.address(this.address()).start();

}

function closeServer() {
	this.server.close();
}
