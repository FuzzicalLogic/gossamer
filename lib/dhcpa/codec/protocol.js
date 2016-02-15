var DHCPA;
module.exports = (namespace) => {
	DHCPA = 'object' === typeof namespace
		? namespace
		: Object.create(null);

	return {
	    createHardwareAddress: createHardwareAddress,

	    BOOTPMessageType: Object.freeze(new Enum()
			.add('BOOTPREQUEST', 1)
	    	.add('BOOTPREPLY', 2)
		),

	    // rfc1700 hardware types
	    ARPHardwareType: Object.freeze(new Enum()
	        .add('HW_ETHERNET', 1)
	        .add('HW_EXPERIMENTAL_ETHERNET', 2)
	        .add('HW_AMATEUR_RADIO_AX_25', 3)
	        .add('HW_PROTEON_TOKEN_RING', 4)
	        .add('HW_CHAOS', 5)
	        .add('HW_IEEE_802_NETWORKS', 6)
	        .add('HW_ARCNET', 7)
	        .add('HW_HYPERCHANNEL', 8)
	        .add('HW_LANSTAR', 9)
	    ),
	}
}

// Copyright (c) 2011 Andrew Paprocki
var createHardwareAddress = function(t, a) {
    return Object.freeze({ type: t, address: a });
}

function Enum() {
	this._idxStart = 1;
	this._idxCurrent = 1;
}

Enum.prototype = Object.create(null);
Enum.prototype.add = function(name, value) {
	this[name] = new EnumKey(name, value);
	return this;
};
Enum.prototype.get = function(value) {
	var o = undefined;
	Object.keys(this).forEach((v, k, a) => {
		if (this[v] == value)
			o = this[v];
	});
	return o;
};
Object.freeze(Enum.prototype);


function EnumKey(name, value) {
	this.name = name;
	this.value = value;
}

EnumKey.prototype = Object.create(null);
EnumKey.prototype.toString = function() {
	return this.name;
};
EnumKey.prototype.valueOf = function() {
	return this.value;
};
Object.freeze(EnumKey.prototype);
