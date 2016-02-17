"use strict";
module.exports = () => {
	return DHCPA;
}

var DHCPA = Object.create(null),
	Enum = require('./util/enum');
DHCPA.protocol = require('./codec/protocol')(DHCPA);
DHCPA.MessageOption = require('./codec/dhcpamessageoption')(DHCPA);
DHCPA.Message = require('./codec/dhcpamessage')(DHCPA, Enum);
DHCPA.DHCP = {};
DHCPA.DHCP.Host = require('./dhcp/dhcphost')(DHCPA);
DHCPA.Server = require('./dhcpaserver')(DHCPA, DHCPA.DHCP.Host);
DHCPA.Client = require('./dhcpaclient')(DHCPA, DHCPA.DHCP.Host);
DHCPA.createServer = (options) => {
	return new DHCPA.Server(options);
};
DHCPA.createClient = (options) => {
	return new DHCPA.Client(options);
};
Object.freeze(DHCPA);
