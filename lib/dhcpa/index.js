"use strict";
module.exports = () => {
	return DHCPA;
}

var DHCPA = Object.create(null),
	Enum = require('./util/enum');
DHCPA.protocol = require('./codec/protocol')(DHCPA);
DHCPA.MessageOption = require('./codec/dhcpamessageoption')(DHCPA);
DHCPA.Message = require('./codec/dhcpamessage')(DHCPA, Enum);
DHCPA.Server = require('./dhcpaserver')(DHCPA);
DHCPA.Client = require('./dhcpaclient')(DHCPA);
DHCPA.createServer = (options) => {
	return new DHCPA.Server(options);
};
DHCPA.createClient = (options) => {
	return new DHCPA.Client(options);
};
Object.freeze(DHCPA);
