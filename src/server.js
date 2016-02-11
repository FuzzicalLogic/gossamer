module.exports = (function(HTTP, CONNECT) {
	var app = CONNECT();

	app.use(function isLocal(req, res, next) {
		next();
	});
	app.use('/services', function() {
		res.end('Here is the list of services...');
	});
	app.use(require('./servicerouter'))
	app.use(function onerror(err, req, res, next) {
		console.log('Error:')
		next();
	});
	app.use('/request_token', function(req, res, next) {
		res.end('We are making a token!');
	});
	app.use(function(req, res, next) {
		res.end('We are connected!');
	});


	return (function(SERVER) {

		var server = {
			start: function() {
				SERVER.listen(80, '0.0.0.0', 511, onStartServer.bind(SERVER));
			},
			close: function() {
				SERVER.close();
			},
			restart: restartServer.bind(server)
		};
		return server;

	}) (HTTP.createServer(app));

	function onStartServer(event) {
		console.log('Server Started');
		this.on('close', onCloseServer.bind(this));
		console.log(arguments);
	}

	function onRequest(request, response) {
		console.log('Request Received for: ' + request.url);
		console.log('From:' + request.connection.remoteAddress)
		console.log('Headers: \n' );
		console.log(request.headers);

		if (request.url === '/request_token') {

			global.oauth.requestToken(function(client, callbackURL, done) {
				console.log(arguments);
			    var token = utils.uid(8)
			      , secret = utils.uid(32)

			    var t = new RequestToken(token, secret, client.id, callbackURL);
			    t.save(function(err) {
			      if (err) { return done(err); }
			      return done(null, token, secret);
			    });
			});

		}
		else response.end('It works!!');
	}

	function onCloseServer() {
		console.log('Server Stopped');
	}

	function restartServer() {
		this.close();
		this.start();
	}

}) (require('http'), require('connect'));
