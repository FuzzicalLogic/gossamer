"use strict";
module.exports = () => {
	return DHCPA;
}

var DHCPA = Object.create(null);
DHCPA.protocol = require('./protocol')(DHCPA);
DHCPA.parser = require('./parser')(DHCPA);
DHCPA.MessageOption = require('./dhcpamessageoption')(DHCPA);
DHCPA.Message = require('./dhcpamessage')(DHCPA);
DHCPA.Server = require('./server')(DHCPA);
DHCPA.Client = require('./client')(DHCPA);
DHCPA.createServer = (options) => {
	return new DHCPA.Server(options);
};
DHCPA.createClient = (options) => {
	return new DHCPA.Client(options);
};
Object.freeze(DHCPA);
