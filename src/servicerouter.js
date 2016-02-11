module.exports = (function() {
	var services = require('./services.js');

	return function(request, response, next) {
		var serviceName = request.url.replace('/', '');
		var service = services.find(function(v, k, a) {
			if (v.name === serviceName)
				return v;
		}, services);
		response.end('Service found!');
		if (!!!service)
			next();
	};
}) ();
