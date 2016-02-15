"use strict";

var util = require('util'),
	HTTP = require('http'),
	CONNECT = require('CONNECT'),
	DNS = require('native-dns'),
	DHCPA = require('../../lib/dhcpa')(),
	ASYNC = require('async');

module.exports = function runApplication(ELECTRON) {
	var root = 'file://' + __dirname + '/';
	var DOMAIN_SUFFIX = '.' + require('os').hostname() + '.local';

	var BrowserWindow = ELECTRON.BrowserWindow;  // Module to create native browser window.
	var Tray = ELECTRON.Tray;
	var Menu = ELECTRON.Menu;

	var DDNSServer = require('../ddns')(DNS, ASYNC);
	//var DHCPAServer = require('../dhcpa')(DHCPA, CONNECT);
	var ServiceManager = require('../servicemanager')(HTTP, CONNECT, DHCPA);
	var GossamerService = require('./service')(HTTP, CONNECT);

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

	global.dnsserver = new DDNSServer();
	//global.dhcpaserver = new DHCPAServer();
	global.server = new GossamerService();
	global.serviceManager = new ServiceManager(global.dnsserver);

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
			//global.dhcpaserver.address('127.90.0.1')
			//	.start();
			global.serviceManager.address('127.99.0.1')
				.hostname('services' + DOMAIN_SUFFIX)
				.start();

			global.server.start();
		}

		var dhcpaClient = new DHCPA.Client();
		dhcpaClient.on('listening', (address) => {
			console.log('DHCP/A Test Client listening on: ' + address);
		});
		dhcpaClient.on('message', function(pkt) {
		    console.log('DHCP/A Message:', util.inspect(pkt, false, 3));
		});
		dhcpaClient.on('offer', (from, pkt) => {
		    console.log('DHCP/A Offer:', util.inspect(pkt, false, 3));
			var spkt = dhcpaClient.createRequestPacket(pkt);
			dhcpaClient.send(spkt, from.port, from.address)
		});
		dhcpaClient.on('acknowledge', function(pkt) {
		    console.log('DHCP/A Acknowledge:', util.inspect(pkt, false, 3));
		});
		dhcpaClient.on('deny', function(pkt) {
		    console.log('DHCP/A Non-acknowledge:', util.inspect(pkt, false, 3));
		});
		dhcpaClient.bind('127.255.255.253');

		var disc = dhcpaClient.createDiscoverPacket({
			xid: 0x01,
			chaddr: {
				address: '00:01:02:03:04:05'
			},
			options: {
				dhcpMessageType: DHCPA.protocol.DHCPMessageType.DHCP_DISCOVER.value,
			}
		});
		console.log('Sending DHCP/A Discover:', util.inspect(disc, false, 3))
		dhcpaClient.broadcastPacket(disc, undefined, () => {
			console.log('dhcpDiscover sent');
		});

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
