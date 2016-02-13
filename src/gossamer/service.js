
"use strict";
module.exports = (http, connect) => {
	if (http && typeof http.createServer === 'function')
		HTTP = http;
	if (typeof connect === 'function')
		CONNECT = connect;

	return (!!http && !!connect)
		? GossamerService
		: () => {};
}

var HTTP, CONNECT;

GossamerService.prototype = Object.create(null);
GossamerService.prototype.start = startServer;
GossamerService.prototype.restart = restartServer;
GossamerService.prototype.close = closeServer;

function GossamerService() {
	this.app = CONNECT();
	this.server = HTTP.createServer(this.app);

	this.app.use(function isLocal(request, response, next) {
		next();
	});
	this.app.use('/services', function(request, response, next) {
		res.end('Here is the list of services...');
	});
	this.app.use(require('../servicerouter'))
	this.app.use(function onerror(err, request, response, next) {
		console.log('Error:')
		next();
	});
	this.app.use('/request_token', function(request, response, next) {
		response.end('We are making a token!');
	});
	this.app.use(function(req, res, next) {
		res.end('We are connected!');
	});


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
}

function startServer() {
	this.server.listen(80, '0.0.0.0', 511, () => {
		console.log('Server Started');
		this.server.on('close', () => {
			console.log('Server Stopped');
		});
	});
}

function closeServer() {
	this.server.close();
}

function restartServer() {
	this.close();
	this.start();
}
