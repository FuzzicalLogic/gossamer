"use strict";
module.exports = (dhcpa, connect) => {
	if (dhcpa && typeof dhcpa.createServer === 'function')
		DHCPA = dhcpa;
	if (typeof connect === 'function')
		CONNECT = connect;

	return (!!dhcpa && !!connect)
		? DHCPAServer
		: () => {};
}

var DHCPA, CONNECT;
var util = require('util');
var VALID_IP4_ADDRESS = /^(?:(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])$/;

DHCPAServer.prototype = Object.create(null);
DHCPAServer.prototype.start = startServer;
DHCPAServer.prototype.close = closeServer;

function DHCPAServer() {
	var address, hostname;
	this.server = DHCPA.createServer();

	this.address = (ip) => {
		if ('string' === typeof ip && VALID_IP4_ADDRESS.exec(ip)) {
			address = ip;
			return this;
		}
		return address;
	};
	this.hostname = (name) => {
		if ('string' === typeof name && name !== '') {
			hostname = name;
			return this;
		}
		return hostname;
	};

	this.server.on('listening', (address) => {
		console.log('DHCP/A started successfully on: ' + address);
	});
	this.server.on('message', (msg) => {
		console.log('DHCP/A Message received: ' + util.inspect(msg, false, 3));
	});
}

function startServer() {
	this.server.bind(this.address());
}

function closeServer() {
	this.server.close();
}
