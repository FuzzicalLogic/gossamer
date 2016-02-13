module.exports = (function(HTTP, CONNECT) {
	var configServer = CONNECT(),
		dnsEntries;

	configServer.use('/entries', function(request, response, next) {
		response.end(JSON.stringify(dnsEntries));
	});
	configServer.use(function(request, response, next) {
		response.end('DDNS Control Panel is live!');
	});

	return {
		start: function(ip, entries) {
			HTTP.createServer(configServer);
			dnsEntries = entries;
			configServer.listen(80, ip);
		},
		close: function() {
			configServer.close();
		}
	}

}) (require('http'), require('connect'));
