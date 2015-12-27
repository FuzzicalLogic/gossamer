(function(HTTP, PROXY) {
	Polymer({
		is: 'gossamer-server',

		created: onElementCreated,
		attached: onElementAttached,
		ready: onElementReady,
		detached: onElementDetached,

		properties: {
			server: {
				readOnly: true,
				value: function() {
					return HTTP.createServer(onRequest.bind(this));
				}
			}
		}
	});

	function onElementCreated() {

	}

	function onElementAttached() {

	}

	function onElementReady() {
		this.server.listen(80, 'localhost', 511, onStartServer.bind(this));
	}

	function onElementDetached() {
		this.server.close();
	}

	function onStartServer() {
		console.log('Server Started');
		this.server.on('close', onCloseServer.bind(this));
	}

	function onRequest(msg, res) {
		console.log('Request Received');
		console.log(msg);
		console.log(res);
	}

	function onCloseServer() {
		console.log('Server Stopped');
	}

}) (require('http')/*, require('http-proxy')*/);
