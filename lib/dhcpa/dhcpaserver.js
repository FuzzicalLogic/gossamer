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

var util = require('util');

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
