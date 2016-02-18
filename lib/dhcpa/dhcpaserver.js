"use strict";
module.exports = (namespace, Host) => {
	DHCPA = 'object' === typeof namespace
		? namespace
		: Object.create(null);
	DHCPHost = 'function' === typeof Host
		? Host
		: () => {};
	util.inherits(DHCPAServer, DHCPHost);

	return DHCPAServer;
}
var DHCPA, DHCPHost;
var VALID_IP4_ADDRESS = /^(?:(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])$/;

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dgram = require('dgram');
var V4Address = require('ip-address').Address4;
var hex = require('hex');

function DHCPAServer(options) {
	options = options || { };
	options.address = options.address || '127.0.0.1';
	options.port = options.port || 67;

	DHCPHost.call(this, options);
}

DHCPAServer.prototype.createOfferPacket = function(msg) {
	msg.options.dhcpMessageType = DHCPA.Message.TYPES.DHCP_OFFER.value;
    return this.createPacket(msg);
}

DHCPAServer.prototype.createAckPacket = function(msg) {
	msg.options.dhcpMessageType = DHCPA.Message.TYPES.DHCP_ACK.value;
    return this.createPacket(msg);
}

DHCPAServer.prototype.createNakPacket = function(msg) {
	msg.options.dhcpMessageType = DHCPA.Message.TYPES.DHCP_NAK.value;
    return this.createPacket(msg);
}
