"use strict";
module.exports = (dns, async) => {
	if (dns && typeof dns.createServer === 'function')
		DNS = dns;
	if (async)
		ASYNC = async;

	return (!!dns && !!async)
		? DHCPAServer
		: () => {};
}

DCHPAServer.prototype = Object.create(null);
DCHPAServer.prototype.start = startServer;
DCHPAServer.prototype.close = closeServer;

function DHCPAServer() {
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

}
