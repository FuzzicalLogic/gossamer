module.exports = (function() {
	var services = require('./services.js');

	return function(request, response, next) {
		var paths = request.url.split('/'),
			serviceName = paths[1];
		var service = services.find(function(v, k, a) {
			if (v.name === serviceName)
				return v;
		}, services);



		if (!!!service)
			next();
		else {
			console.log('Service: ' + service.name);
			var proxyUrl = request.url.replace('/' + service.name, '');
			console.log('New Request URL: ' + proxyUrl);
			proxyRequest('http://localhost:' + service.port + proxyUrl);
		}

		response.end('Service found!');
	};

	function proxyRequest(url) {
		console.log('Proxy Request to: ' + url);
	}
}) ();
