/** ****************************************************************************
	CLASS: Server (Controller)
================================================================================
	Creates an HTTP Server and binds the specified view to the specified model.

	Class Details
--------------------------------------------------------------------------------
	Inherits: Emitter
	Implements: StateMachine (not abstracted yet)

	Configuration
	----------------------------------------------------------------------------
	debug - truthy or falsey (default: false). Whether to run all instances of
		this Class in debug mode.
	htmlContainer - The Tag to render the ServerView into.
	View - the Constructor to use when creating a View for this Server.
	Model - the Model to use when interacting with the data for this Server.

	Properties
	----------------------------------------------------------------------------
	States - A list of states that the Server may attain.
	Events - A list of Events that each instance broadcasts.

	Instance Details
--------------------------------------------------------------------------------
	Options
	----------------------------------------------------------------------------
	debug - truthy or falsey (default: configuration.debug). Whether to run this
		Server in debug mode. This overrides the configuration when the Class
		was configured.
	parent - a reference to the Parent Controller.

	Properties (Quarks)
	----------------------------------------------------------------------------
	name - A user-readable name that describes the Server.
	type - The type of Server that will be run.
	host - The hostname or IP(v4 or v6) that the Server will run on.
	port - The port that this Server will listen on.

	Methods
	----------------------------------------------------------------------------
	start()
		Starts the Server. Fires OnServerStateChanged with Server.States.Running
		when the server has been successfully started.

	stop()
		Stops the Server. Fires OnServerStateChanged with Server.States.Standby
		when the server has been successfully stopped.

	toggle()
		Starts the Server if it is stopped. Stops the Server if it is running.

	on(event, callback)
		Subscribes to an event (as listed in ClassObj.Events).

	once(event, callback)
		Subscribes to an event and fires the next time the event is fired.

	off(event, callback)
		Unsubscribes from an event (as listed in ClassObj.Events).

	Events
	----------------------------------------------------------------------------
	OnServerStateChanged - Fired when the Server transitions to a different
		running state. States are listed in ClassObj.States. May additionally
		be accesssed by obj.constructor.States.
	OnDispose - Fired when the Server has received a request to be disposed.
	OnDestroy - Fired when the Server is ready to be destroyed (all references
		have been removed).

	Expected Events from Parent
	---------------------------
	onDispose - Indication from the parent that the Server is about to be
		destroyed.

	Expected Events from View
	--------------------------
	onDestroy - Indication from the view that it is ready to be destroyed by
		the Server.

**************************************************************************** **/
module.exports = require('a-umd')().Class(function(preCfg) {
	"use strict";
	var Emitter = require('causality')().Emitter('Emitter');
	this.inherits(Emitter);

// We only require these once...
	var http = require('http'),
		httpProxy = require('http-proxy').httpProxy;

//------------------------------------------------------------------------------
//	Class API
//------------------------------------------------------------------------------
	this.create = constructServer;
	this.States = {
		STANDBY: 0,
		WAITING: 1,
		RUNNING: 2
	};
	this.Events = {
		'onStateChanged': 'Server.onStateChanged',
		'onDispose': 'Server.onDispose',
		'onDestroy': 'Server.onDestroy'
	};

//------------------------------------------------------------------------------
//	Prototype API
//------------------------------------------------------------------------------
	this.prototype.constructor = this;
	this.prototype.start = startServer;
	this.prototype.stop = stopServer;
	this.prototype.toggle = onToggleRunning;

//------------------------------------------------------------------------------
//	Class Functions
//------------------------------------------------------------------------------
	function constructServer(opts) {
		Emitter.create.call(this);

		this.state = this.emits('stateChanged');
		this.ready = this.emits('ready');
		this.dispose = this.emits('dispose');
		this.destroy = this.emits('destroy');

		var quark = require('quark'),
			_opts = 'object' === typeof opts ? opts : {},
			_parent = _opts.parent,
			_server = 'object' === typeof _opts.server ? _opts.server : {};
		quark(this, 'type', {
			chains: 1, writable: 1
		}).type(_server.type || 'Static');
		quark(this, 'name', {
			chains: 1, writable: 1
		}).name(_server.name || 'Server X');
		quark(this, 'port', {
			chains: 1,
			writable: 1,
			validate: [
				function(val) {
					return (val >= 0 && val <= 65535);
				}
			]
		}).port(_server.port || 80);
		quark(this, 'host', {
			chains: 1, writable: 1,
			validate: [
				function(val) {
					return ('string' === typeof val)
						&& (val.length <= 255)
				},
				function(val) {
					return true;
						/* /^$/i.test(val)
						|| /^$/i.test(val)
						|| /^$/i.test(val)
						|| /^$/i.test(val)
						|| /^$/i.test(val)
						|| /^$/i.test(val)
						|| /^$/i.test(val)
						|| /^$fe80:(:[\da-f]{0,4}){0,4}%[\da-z]+/i.test(val)
						|| /^(::(ffff((:0){1,4})?:)?)?((0x[\da-f]{1,2})|(0[0-3]?[0-7]?[0-7])|(25[0-5]|(2[0-4]?|1\d?|[2-9])?\d))(\.((0x[\da-f]{1,2})|(0[0-3]?[0-7]?[0-7])|(25[0-5]|(2[0-4]?|1\d?|[2-9])?\d))){3}$/i.test(val)
						|| /^([\da-f]{1,4}:){1,4}:((0x[\da-f]{1,2})|(0[0-3]?[0-7]?[0-7])|(25[0-5]|(2[0-4]?|1\d?|[2-9])?\d))(\.((0x[\da-f]{1,2})|(0[0-3]?[0-7]?[0-7])|(25[0-5]|(2[0-4]?|1\d?|[2-9])?\d))){3}$/i.test(val)
						|| /^((0x[\da-f]{1,2})|(0[0-3]?[0-7]?[0-7])|(25[0-5]|(2[0-4]?|1\d?|[2-9])?\d))(\.((0x[\da-f]{1,2})|(0[0-3]?[0-7]?[0-7])|(25[0-5]|(2[0-4]?|1\d?|[2-9])?\d))){3}$/i.test(val)
						|| /^(([a-z\d]|[a-z\d][a-z\d\-]{0,61}[a-z\d])(\.([a-z\d]|[a-z\d][a-z\d\-]{0,61}[a-z\d]))+)\.?$/i.test(val);*/
				}
			]
		}).host(_server.host || 'domain.com');

		this.isRunning = false;
		_parent.onRender(onRender.bind(this));
		_parent.onDispose(onDestroyServerArray.bind(this), true);
	}

//------------------------------------------------------------------------------
//	Instance Methods
//------------------------------------------------------------------------------
	function startServer() {
		window.APP.notify(this.host + ':' + this.port, {title:'Preparing Server'});
		this.state(this.constructor.States.WAITING);
		this.httpServer = http.createServer(onRequest.bind(this));
		this.httpServer.on('close', onStopListening.bind(this));
		this.httpServer.listen(this.port(), this.host(), 511, onStartListening.bind(this));
		return false;
	}

	function stopServer() {
		window.APP.notify(this.host + ':' + this.port, {title: 'Stopping Server'});
		this.state(this.constructor.States.WAITING);
		this.httpServer.close();
		this.httpServer = null;
		return false;
	}

//------------------------------------------------------------------------------
//	Controller Event Listeners
//------------------------------------------------------------------------------
	function onRender() {
		var li = window.document.createElement('li')
		this.view = new window.APP.view.ServerView({
			container: li,
			controller: this,
			server: {
				name: this.name,
				hostIP: this.host,
				type: this.type,
				port: this.port
			}
		}, false);
		this.view.onDestroy(onDestroyChildren.bind(this));
		this.ready(this.view.view);
	}

	function onDestroyServerArray() {
		this.dispose();
	}

//------------------------------------------------------------------------------
//	View Event Listeners
//------------------------------------------------------------------------------
	function onToggleRunning(e) {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		return this.isRunning
			? stopServer.call(this)
			: startServer.call(this);
	}

	function onDestroyChildren() {
		this.destroy(this.name);
	}

//------------------------------------------------------------------------------
//	HTTP Server Event Listeners
//------------------------------------------------------------------------------
	function onStartListening() {
		this.isRunning = true;
		window.APP.notify(this.host, {title:"Server Started"});
		this.state(this.constructor.States.RUNNING);
	}

	function onStopListening() {
		this.isRunning = false;
		window.APP.notify(this.host, {title: 'Server Stopped'});
		this.state(this.constructor.States.STANDBY);
	}

	function onRequest(msg, res) {
		var _host, _port;
		if (msg.headers.host.indexOf(':') > -1) {
			_host = msg.headers.host.substr(0, msg.headers.host.indexOf(':'));
			_port = msg.headers.host.substr(msg.headers.host.indexOf(':') + 1);
		}
		else {
			_host = msg.headers.host;
			_port = 80;
		}

		if (_host === this.host()) {
			//window.APP.notify('Request received for:' + _host + ':' + _port, {title:'Testing'});
			res.setTimeout(5000);
			res.writeHead(200);
			res.end('Server found...');
		}
		else if (this.proxy && this.proxy[_host]) {
			var proxy = new httpProxy();
			proxy.init(msg, res);
			proxy.proxyRequest(_host, _port, msg, res);
		}
		else {
			res.setTimeout(5000);
			res.statusCode = 404;
			res.end('No Host Found');
		}
	}
});
