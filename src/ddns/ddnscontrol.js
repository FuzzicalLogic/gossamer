module.exports = (function(HTTP, CONNECT) {
	var service = CONNECT(),
		server,
		dnsEntries;

	service.use('/entries', function(request, response, next) {
		response.end(JSON.stringify(dnsEntries));
	});
	service.use(function(request, response, next) {
		response.end('DDNS Control Panel is live!');
	});

	return {
		start: function(ip, entries) {
			server = HTTP.createServer(service);
			dnsEntries = entries;
			server.listen(80, ip);
		},
		close: function() {
			server.close();
		}
	}

}) (require('http'), require('connect'));
