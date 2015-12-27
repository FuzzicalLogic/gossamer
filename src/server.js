module.exports = (function(HTTP, PROXY) {
	var server = {
		httpserver: HTTP.createServer(onRequest.bind(server)),
		start: function() {
			server.httpserver.listen(80, 'localhost', 511, onStartServer.bind(server));
		},
		close: function() {
			server.httpserver.close();
		},
		restart: restartServer
	};
	return server;

	function onStartServer() {
		console.log('Server Started');
		this.httpserver.on('close', onCloseServer.bind(this));
	}

	function onRequest(msg, res) {
		console.log('Request Received');
		console.log(msg);
		console.log(res);
	}

	function onCloseServer() {
		console.log('Server Stopped');
	}

	function restartServer() {
		this.close();
		this.start();
	}

}) (require('http')/*, require('http-proxy')*/);
