"use strict";

var util = require('util'),
	HTTP = require('http'),
	CONNECT = require('CONNECT'),
	DNS = require('native-dns'),
	DHCPS,
	ASYNC = require('async');

var ON_UTIL = Promise.resolve(require('util')),
	ON_ASYNC = Promise.resolve(require('async')),
	ON_HTTP = Promise.resolve(require('http')),
	ON_CONNECT = Promise.resolve(require('CONNECT')),
	ON_DNS = Promise.resolve(require('native-dns')),
	ON_OUTCLASS = require('outclass').initialize(),
	ON_DHCPS = Promise.resolve(require('dhcps'));

ON_DHCPS.then((module) => {
	DHCPS = module;
});

module.exports = function runApplication(ELECTRON) {
	const Promise = this.cimport.Promise || (global.Promise || self.Promise);

	this.cimport('outclass').initialize(() => {
			return { Promise: Promise };
		})
		.then(() => {console.log('It worked!')});

	var root = 'file://' + __dirname + '/';
	var DOMAIN_SUFFIX = '.' + require('os').hostname() + '.local';

	var BrowserWindow = ELECTRON.BrowserWindow;  // Module to create native browser window.
	var Tray = ELECTRON.Tray;
	var Menu = ELECTRON.Menu;

	var onDdns = Promise.all([ON_DNS, ON_ASYNC])
		.spread(require('../ddns'))
		.then((DDNSServer) => {
			console.log('Creating DNS Sever');
			global.dnsserver = new DDNSServer()
		});

	Promise.all([ON_HTTP, CONNECT])
		.then(spread(require('./service')))
		.then((Service) => {
			global.server = new GossamerService();
		});

	Promise.all([ON_HTTP, ON_CONNECT, ON_DHCPS])
		.then(spread(require('../servicemanager')))
		.then((ServiceManager) => {
			global.serviceManager = new ServiceManager(global.dnsserver);
		});

//	var DDNSServer = require('../ddns')(DNS, ASYNC);
//	var ServiceManager = require('../servicemanager')(HTTP, CONNECT, DHCPS);
//	var GossamerService = require('./service')(HTTP, CONNECT);

	this.commandLine.appendSwitch('v', -1);
	this.commandLine.appendSwitch('vmodule', 'console=0');

	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the javascript object is GCed.
	var mainWindow = null;
	var appTray = null, mnuTray = null;

	var quitApp = this.makeSingleInstance((cmd, cwd) => {
		!!appTray && (console.log('Forwarding: ' + cmd));
		return !!appTray
	});
	if (quitApp) {
		this.quit();
		return;
	}

//	global.dnsserver = new DDNSServer();
//	global.server = new GossamerService();


	// This method will be called when Electron has done everything
	// initialization and ready for creating browser windows.
	this.on('ready', () => {
		if (!!!appTray) {
			appTray = new Tray('./icons/tray.png');
			mnuTray = Menu.buildFromTemplate([
				{label: 'Item1'},
				{label: 'Item2'},
				{label: 'Item3'},
				{label: 'Quit Gossamer', click: () => {
					if (!!mainWindow) {
						mainWindow.destroy();
					}
					this.quit();
				}}
			]);
			appTray.setToolTip('Gossamer');
			appTray.setContextMenu(mnuTray);
			appTray.on('click', showMainWindow);

			global.dnsserver.start('127.255.255.254');
			global.serviceManager.address('127.99.0.1')
				.hostname('services' + DOMAIN_SUFFIX)
				.start();

			global.server.start();
		}

		onDHCPS.then((dhcps) => {
			var dhcpaClient = new dhcps.Client();
			dhcpaClient.address('127.255.255.253')
				.start();

			dhcpaClient.on('listening', (address) => {
				console.log('DHCP/S Test Client listening on: ' + address);
			});
			dhcpaClient.on('offer', (msg) => {
				console.log('Creating Request...');
				console.log('From Server: ' + msg.siaddr);
				var msg = dhcpaClient.request(msg, {
						serverIdentifier: msg.options.serverIdentifier
					}),
					spkt = msg.encode(new Buffer(1500));
				dhcpaClient.broadcast(spkt)
			});
			dhcpaClient.on('ack', (msg) => {
				console.log('DHCPS Request accepted');
			});
			dhcpaClient.on('nak', (pkt) => {
				console.log('DHCPS Request declined');
			});
			dhcpaClient.on('unhandled', () => {
				console.log('Could not find DCHP Message Type');
			});
		});
		//dhcpaClient.bind('127.255.255.253');
	});
	this.on('will-quit', function() {
		global.dnsserver.close();
		global.server.close();
		global.serviceManager.close();
	});
	// Quit when all windows are closed.
	this.on('window-all-closed', function() { });

	function showMainWindow() {
		if (!!!mainWindow) {

		// Create the browser window.
			mainWindow = new BrowserWindow({
				width: 350,
				height: ELECTRON.screen.getPrimaryDisplay().workAreaSize.height,
				x: ELECTRON.screen.getPrimaryDisplay().workAreaSize.width - 350,
				y: 0,
				icon: './icons/tray.png',
				transparent: true,
				frame: false
			});
			mainWindow.on('close', function(event) {
				event.preventDefault();
				mainWindow.hide();
			})
		// and load the index.html of the app.
			mainWindow.loadURL(root + '../control-panel/index.html');

		// Open the devtools.
			//mainWindow.openDevTools({detach: true});
		}
		else mainWindow.show();
	}
};

function spread(fn) {
	return function(dependencies) {
		return fn.apply(this, dependencies);
	};
}
