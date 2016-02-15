"use strict";
module.exports = (namespace) => {
	DHCPA = 'object' === typeof namespace
		? namespace
		: Object.create(null);

	return Server;
}
var DHCPA;
var VALID_IP4_ADDRESS = /^(?:(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])$/;

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dgram = require('dgram');
var V4Address = require('ip-address').Address4;
var hex = require('hex');

function Server(options) {
    if (options) {
        if (typeof(options) !== 'object')
            throw new TypeError('Server options must be an object');
    } else {
        options = {};
    }

    var self = this;
    EventEmitter.call(this, options);

	var address, hostname;
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

    this.server = dgram.createSocket('udp4');
    this.server.on('message', (msg, rinfo) => {

		console.log('DHCP/A Message received from: ' + rinfo.address + ':' + rinfo.port );
		var pkt = DHCPA.parser.parse( msg, rinfo );
    	this.emit('message', rinfo, pkt);
		switch (pkt.options.dhcpMessageType) {
		case DHCPA.protocol.DHCPMessageType.DHCP_DISCOVER:
			this.emit('discover', rinfo, pkt);
			break;
		case DHCPA.protocol.DHCPMessageType.DHCP_REQUEST:
			this.emit('request', rinfo, pkt);
			break;
		case DHCPA.protocol.DHCPMessageType.DHCP_RELEASE:
			this.emit('release', rinfo, pkt);
			break;
		}
    });
    this.server.on('listening', () => {
        var address = self.server.address();
        this.emit('listening', address.address + ':' + address.port);
    });
}
util.inherits(Server, EventEmitter);

Server.prototype.bind = function(host, port) {
    if (!port) port = 67;
    this.server.bind(port, host, () => {
    	this.server.setBroadcast(true);
    });
}
Server.prototype.start = startServer;
Server.prototype.close = closeServer;

function startServer(host, port) {
	if (!port) port = 67;
    this.server.bind(port, this.address(), () => {
    	this.server.setBroadcast(true);
    });
}

function closeServer() {
	this.server.close();
}

Server.prototype.send = function(pkt, port, host, cb) {
	console.log('Sending Packet to:' + host + ':' + port);
	this.server.send(pkt, 0, pkt.length, port, host, cb);
}

Server.prototype.createPacket = function(pkt) {
    if (!('xid' in pkt))
        throw new Error('pkt.xid required');

    var ci = new Buffer(('ciaddr' in pkt) ?
        new V4Address(pkt.ciaddr).toArray() : [0, 0, 0, 0]);
    var yi = new Buffer(('yiaddr' in pkt) ?
        new V4Address(pkt.yiaddr).toArray() : [0, 0, 0, 0]);
    var si = new Buffer(new V4Address(this.server.address().address).toArray());
    var gi = new Buffer(('giaddr' in pkt) ?
        new V4Address(pkt.giaddr).toArray() : [0, 0, 0, 0]);

    if (!('chaddr' in pkt))
        throw new Error('pkt.chaddr required');
    var hw = new Buffer(pkt.chaddr.address.split(':').map(function(part) {
        return parseInt(part, 16);
    }));
    if (hw.length !== 6)
        throw new Error('pkt.chaddr malformed, only ' + hw.length + ' bytes');

    var p = new Buffer(1500);
    var i = 0;

    p.writeUInt8(pkt.op,    i++);
    p.writeUInt8(pkt.htype, i++);
    p.writeUInt8(pkt.hlen,  i++);
    p.writeUInt8(pkt.hops,  i++);
    p.writeUInt32BE(pkt.xid,   i); i += 4;
    p.writeUInt16BE(pkt.secs,  i); i += 2;
    p.writeUInt16BE(pkt.flags, i); i += 2;
    ci.copy(p, i); i += ci.length;
    yi.copy(p, i); i += yi.length;
    si.copy(p, i); i += si.length;
    gi.copy(p, i); i += gi.length;
    hw.copy(p, i); i += hw.length;
    p.fill(0, i, i + 10); i += 10; // hw address padding
    p.fill(0, i, i + 192); i += 192;
    p.writeUInt32BE(0x63825363, i); i += 4;

    if (pkt.options && 'requestedIpAddress' in pkt.options) {
        p.writeUInt8(50, i++); // option 50
        var requestedIpAddress = new Buffer(
            new v4.Address(pkt.options.requestedIpAddress).toArray());
        p.writeUInt8(requestedIpAddress.length, i++);
        requestedIpAddress.copy(p, i); i += requestedIpAddress.length;
    }
    if (pkt.options && 'dhcpMessageType' in pkt.options) {
        p.writeUInt8(53, i++); // option 53
        p.writeUInt8(1, i++);  // length
        p.writeUInt8(pkt.options.dhcpMessageType, i++);
    }
    if (pkt.options && 'serverIdentifier' in pkt.options) {
        p.writeUInt8(54, i++); // option 54
        var serverIdentifier = new Buffer(
            new v4.Address(pkt.options.serverIdentifier).toArray());
        p.writeUInt8(serverIdentifier.length, i++);
        serverIdentifier.copy(p, i); i += serverIdentifier.length;
    }
    if (pkt.options && 'parameterRequestList' in pkt.options) {
        p.writeUInt8(55, i++); // option 55
        var parameterRequestList = new Buffer(pkt.options.parameterRequestList);
        if (parameterRequestList.length > 16)
            throw new Error('pkt.options.parameterRequestList malformed');
        p.writeUInt8(parameterRequestList.length, i++);
        parameterRequestList.copy(p, i); i += parameterRequestList.length;
    }
    if (pkt.options && 'clientIdentifier' in pkt.options) {
        var clientIdentifier = new Buffer(pkt.options.clientIdentifier);
        var optionLength = 1 + clientIdentifier.length;
        if (optionLength > 0xff)
            throw new Error('pkt.options.clientIdentifier malformed');
        p.writeUInt8(61, i++);           // option 61
        p.writeUInt8(optionLength, i++); // length
        p.writeUInt8(0, i++);            // hardware type 0
        clientIdentifier.copy(p, i); i += clientIdentifier.length;
    }

    // option 255 - end
    p.writeUInt8(0xff, i++);

    // padding
    if ((i % 2) > 0) {
        p.writeUInt8(0, i++);
    } else {
        p.writeUInt16BE(0, i++);
    }

    var remaining = 300 - i;
    if (remaining) {
        p.fill(0, i, i + remaining); i+= remaining;
    }

    //console.log('createPacket:', i, 'bytes');
    return p.slice(0, i);
}

Server.prototype.createOfferPacket = function(user) {
	user.options.dhcpMessageType = DHCPA.protocol.DHCPMessageType.DHCP_OFFER.value;
    return this.createPacket(user);
}

/*Server.prototype.createAckPacket = function(user) {
    var pkt = {
        op:     0x01,
        htype:  0x01,
        hlen:   0x06,
        hops:   0x00,
        xid:    0x00000000,
        secs:   0x0000,
        flags:  0x0000,
        ciaddr: '0.0.0.0',
        yiaddr: '0.0.0.0',
        siaddr: '0.0.0.0',
        giaddr: '0.0.0.0',
    };
    if ('xid' in user) pkt.xid = user.xid;
    if ('chaddr' in user) pkt.chaddr = user.chaddr;
    if ('options' in user) pkt.options = user.options;
    return Server.prototype.createPacket(pkt);
}

Server.prototype.createNakPacket = function(user) {
    var pkt = {
        op:     0x01,
        htype:  0x01,
        hlen:   0x06,
        hops:   0x00,
        xid:    0x00000000,
        secs:   0x0000,
        flags:  0x0000,
        ciaddr: '0.0.0.0',
        yiaddr: '0.0.0.0',
        siaddr: '0.0.0.0',
        giaddr: '0.0.0.0',
    };
    if ('xid' in user) pkt.xid = user.xid;
    if ('chaddr' in user) pkt.chaddr = user.chaddr;
    if ('options' in user) pkt.options = user.options;
    return Server.prototype.createPacket(pkt);
}*/
