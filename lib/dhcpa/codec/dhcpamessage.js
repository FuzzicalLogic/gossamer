"use strict";
module.exports = (namespace, enumClass) => {
	DHCPA = 'object' === typeof namespace
		? namespace
		: Object.create(null);
	Enum = enumClass;


	DHCPAMessage.TYPES = Object.freeze(new Enum()
		.add('DHCP_DISCOVER', 1)
		.add('DHCP_OFFER', 2)
		.add('DHCP_REQUEST', 3)
		.add('DHCP_DECLINE', 4)
		.add('DHCP_ACK', 5)
		.add('DHCP_NAK', 6)
		.add('DHCP_RELEASE', 7)
	);

	return DHCPAMessage;
}
var DHCPA;
var Enum;
var assert = require('assert');

function DHCPAMessage() {
	this.op = 0x01;
	this.htype = 0;
	this.hlen = 0;
	this.hops = 0;
	this.xid = 0;
	this.secs = 0;
	this.flags = 0;
	this.hw = new Buffer(pkt.chaddr.split(':').map(function(part) {
        return parseInt(part, 16);
    }));

	this.ciaddr = this.yiaddr = this.siaddr = this.giaddr = [0, 0, 0, 0];
}
DHCPAMessage.decode = decodeMessage;

DHCPAMessage.prototype = Object.create(null);
DHCPAMessage.prototype.encode = encodeMessage;

function encodeMessage(type, xid, options) {
	if (!('xid' in pkt))
        throw new Error('pkt.xid required');

    var ci = new Buffer(('ciaddr' in pkt) ?
        new V4Address(pkt.ciaddr).toArray() : [0, 0, 0, 0]);
    var yi = new Buffer(('yiaddr' in pkt) ?
        new V4Address(pkt.yiaddr).toArray() : [0, 0, 0, 0]);
    var si = new Buffer(('siaddr' in pkt) ?
        new V4Address(pkt.siaddr).toArray() : [0, 0, 0, 0]);
    var gi = new Buffer(('giaddr' in pkt) ?
        new V4Address(pkt.giaddr).toArray() : [0, 0, 0, 0]);

    if (!('chaddr' in pkt))
        throw new Error('pkt.chaddr required');
    var hw = new Buffer(pkt.chaddr.split(':').map(function(part) {
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

function decodeMessage(msg, rinfo) {
	//console.log(rinfo.address + ':' + rinfo.port + '/' + msg.length + 'b');

    var p = {
        op: DHCPA.protocol.BOOTPMessageType.get(msg.readUInt8(0)),
        // htype is combined into chaddr field object
        hlen: msg.readUInt8(2),
        hops: msg.readUInt8(3),
        xid: msg.readUInt32BE(4),
        secs: msg.readUInt16BE(8),
        flags: msg.readUInt16BE(10),
        ciaddr: readIpRaw(msg, 12),
        yiaddr: readIpRaw(msg, 16),
        siaddr: readIpRaw(msg, 20),
        giaddr: readIpRaw(msg, 24),
        chaddr: DHCPA.protocol.createHardwareAddress(
                    DHCPA.protocol.ARPHardwareType.get(msg.readUInt8(1)),
                    readAddressRaw(msg, 28, msg.readUInt8(2))),
        sname: trimNulls(msg.toString('ascii', 44, 108)),
        file: trimNulls(msg.toString('ascii', 108, 236)),
        magic: msg.readUInt32BE(236),
        options: {}
    };
    var offset = 240;
    var code = 0;
    while (code != 255 && offset < msg.length) {
        code = msg.readUInt8(offset++);
        switch (code) {
            case 0: continue;   // pad
            case 255: break;    // end
            case 1: {           // subnetMask
                offset = readIp(msg, offset, p, 'subnetMask');
                break;
            }
            case 2: {           // timeOffset
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 4);
                p.options.timeOffset = msg.readUInt32BE(offset);
                offset += len;
                break;
            }
            case 3: {           // routerOption
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len % 4, 0);
                p.options.routerOption = [];
                while (len > 0) {
                    p.options.routerOption.push(readIpRaw(msg, offset));
                    offset += 4;
                    len -= 4;
                }
                break;
            }
            case 4: {           // timeServerOption
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len % 4, 0);
                p.options.timeServerOption = [];
                while (len > 0) {
                    p.options.timeServerOption.push(readIpRaw(msg, offset));
                    offset += 4;
                    len -= 4;
                }
                break;
            }
            case 6: {           // domainNameServerOption
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len % 4, 0);
                p.options.domainNameServerOption = [];
                while (len > 0) {
                    p.options.domainNameServerOption.push(
                        readIpRaw(msg, offset));
                    offset += 4;
                    len -= 4;
                }
                break;
            }
            case 12: {          // hostName
                offset = readString(msg, offset, p, 'hostName');
                break;
            }
            case 15: {          // domainName
                offset = readString(msg, offset, p, 'domainName');
                break;
            }
            case 43: {          // vendorOptions
                var len = msg.readUInt8(offset++);
                p.options.vendorOptions = {};
                while (len > 0) {
                    var vendop = msg.readUInt8(offset++);
                    var vendoplen = msg.readUInt8(offset++);
                    var buf = new Buffer(vendoplen);
                    msg.copy(buf, 0, offset, offset + vendoplen);
                    p.options.vendorOptions[vendop] = buf;
                    len -= 2 + vendoplen;
                }
                break;
            }
            case 50: {          // requestedIpAddress
                offset = readIp(msg, offset, p, 'requestedIpAddress');
                break;
            }
            case 51: {          // ipAddressLeaseTime
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 4);
                p.options.ipAddressLeaseTime =
                    msg.readUInt32BE(offset);
                offset += 4;
                break;
            }
            case 52: {          // optionOverload
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 1);
                p.options.optionOverload = msg.readUInt8(offset++);
                break;
            }
            case 53: {          // dhcpMessageType
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 1);
                var mtype = msg.readUInt8(offset++);
                assert.ok(1 <= mtype);
                assert.ok(8 >= mtype);
                p.options.dhcpMessageType = DHCPAMessage.TYPES.get(mtype);
                break;
            }
            case 54: {          // serverIdentifier
                offset = readIp(msg, offset, p, 'serverIdentifier');
                break;
            }
            case 55: {          // parameterRequestList
                var len = msg.readUInt8(offset++);
                p.options.parameterRequestList = [];
                while (len-- > 0) {
                    var option = msg.readUInt8(offset++);
                    p.options.parameterRequestList.push(option);
                }
                break;
            }
            case 57: {          // maximumMessageSize
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 2);
                p.options.maximumMessageSize = msg.readUInt16BE(offset);
                offset += len;
                break;
            }
            case 58: {          // renewalTimeValue
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 4);
                p.options.renewalTimeValue = msg.readUInt32BE(offset);
                offset += len;
                break;
            }
            case 59: {          // rebindingTimeValue
                var len = msg.readUInt8(offset++);
                assert.strictEqual(len, 4);
                p.options.rebindingTimeValue = msg.readUInt32BE(offset);
                offset += len;
                break;
            }
            case 60: {          // vendorClassIdentifier
                offset = readString(msg, offset, p, 'vendorClassIdentifier');
                break;
            }
            case 61: {          // clientIdentifier
                var len = msg.readUInt8(offset++);
                p.options.clientIdentifier =
                    DHCPA.protocol.createHardwareAddress(
                        DHCPA.protocol.ARPHardwareType.get(msg.readUInt8(offset)),
                        readAddressRaw(msg, offset + 1, len - 1));
                offset += len;
                break;
            }
            case 81: {          // fullyQualifiedDomainName
                var len = msg.readUInt8(offset++);
                p.options.fullyQualifiedDomainName = {
                    flags: msg.readUInt8(offset),
                    name: msg.toString('ascii', offset + 3, offset + len)
                };
                offset += len;
                break;
            }
            case 118: {		    // subnetSelection
                offset = readIp(msg, offset, p, 'subnetAddress');
                break;
            }
            default: {
                var len = msg.readUInt8(offset++);
                console.log('Unhandled DHCP option ' + code + '/' + len + 'b');
                offset += len;
                break;
            }
        }
    }
    return p;
}

function trimNulls(str) {
	var idx = str.indexOf('\u0000');
	return (-1 === idx) ? str : str.substr(0, idx);
}
function readIpRaw(msg, offset) {
	//if (0 === msg.readUInt8(offset))
		//return undefined;
	return '' +
		msg.readUInt8(offset++) + '.' +
		msg.readUInt8(offset++) + '.' +
		msg.readUInt8(offset++) + '.' +
		msg.readUInt8(offset++);
}
function readIp(msg, offset, obj, name) {
	var len = msg.readUInt8(offset++);
	assert.strictEqual(len, 4);
	p.options[name] = readIpRaw(msg, offset);
	return offset + len;
}
function readString(msg, offset, obj, name) {
	var len = msg.readUInt8(offset++);
	p.options[name] = msg.toString('ascii', offset, offset + len);
	offset += len;
	return offset;
}
function readAddressRaw(msg, offset, len) {
	var addr = '';
	while (len-- > 0) {
		var b = msg.readUInt8(offset++);
		addr += (b + 0x100).toString(16).substr(-2);
		if (len > 0) {
			addr += ':';
		}
	}
	return addr;
}


/*
function readIP(msg, offset, obj, name) {

}

function readRawIP(msg, offset) {
	return [0,0,0,0]
		.map(() => { return msg.readUInt8(offset++) })
		.join('.');
}

function readAddressRaw(msg, offset, len) {
	var addr = [];
	while (len-- > 0) {
		addr.push(msg.readUInt8(offset++));
	}
	return addr.map((v) => {
		return (v + 0x100).toString(16).substr(-2);
	}).join(':')
}

function trimNulls(str) {
	return str.replace(/\u0000+/, '');
}
*/
