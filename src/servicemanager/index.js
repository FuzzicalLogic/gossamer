var HTTP, CONNECT;

var VALID_IP4_ADDRESS = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
module.exports = (http, connect) => {
	if (http && typeof http.createServer === 'function')
		HTTP = http;
	if (typeof connect === 'function')
		CONNECT = connect;

	return (!!http && !!connect)
		? ServiceManager
		: () => {};
}


ServiceManager.prototype = Object.create(null);
ServiceManager.prototype.start = startServer;
ServiceManager.prototype.close = closeServer;

function ServiceManager(dhcp) {
	var address, hostname;

	this.app = CONNECT();
	this.dhcp = dhcp;
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
	this.app.use((request, response, next) => {
		response.end('Service Manager is running!');
	});
	this.server = HTTP.createServer(this.app);
}

function startServer() {
	this.server.listen(80, this.address(), () => {
		this.dhcp.entries().push({
			domain: this.hostname(),
			records: [
				{ type: 'A', address: this.address() }
			]
		});
	});
}

function closeServer() {
	this.server.close();
}
