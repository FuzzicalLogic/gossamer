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
	this.dhcpa.on('message', (from, msg) => {

	});
	this.dhcpa.on('discover', (from, msg) => {
		var spkt = this.dhcpa.createOfferPacket(msg);
		this.dhcpa.send(spkt, from.port, from.address);
	});
	this.dhcpa.on('request', (from, msg) => {
		var spkt = this.dhcpa.createAckPacket(msg);
		//var spkt = this.dhcpa.createNakPacket(pkt);
		this.dhcpa.send(spkt, from.port, from.address);
	});
	this.dhcpa.on('decline', (from, msg) => {
		//var spkt = this.dhcpa.createOfferPacket(pkt);
		//this.dhcpa.send(spkt, from.port, from.address);
	});
	this.dhcpa.on('release', (from, msg) => {
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
		console.log('DHCP/A started successfully on: ' + this.dhcpa.address());
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
