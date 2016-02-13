var root = 'file://' + __dirname + '/';
var ELECTRON = require('electron');

var app = ELECTRON.app;  // Module to control application life.
var BrowserWindow = ELECTRON.BrowserWindow;  // Module to create native browser window.
var Tray = ELECTRON.Tray;
var Menu = ELECTRON.Menu;

app.commandLine.appendSwitch('v', -1);
app.commandLine.appendSwitch('vmodule', 'console=0');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
var appTray = null, mnuTray = null;

var quitApp = app.makeSingleInstance(forwardCommandLine);
if (quitApp) {
	app.quit();
	return;
}

global.dnsserver = require('./dnsproxy.js').start('ntmobiledev', '127.255.255.254');
global.server = require('./server.js');

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', runApplication);
app.on('will-quit', function() {
	global.server.close();
});
// Quit when all windows are closed.
app.on('window-all-closed', function() { });

function forwardCommandLine(command, working) {
	if (!!appTray) {
		console.log('Forwarding: ' + command);
	}
	return !!appTray
}

function runApplication() {
	if (!!!appTray) {
		appTray = new Tray('./icons/tray.png');
		mnuTray = Menu.buildFromTemplate([
			{label: 'Item1'},
			{label: 'Item2'},
			{label: 'Item3'},
			{label: 'Quit Gossamer', click: closeApplication}
		]);
		appTray.setToolTip('Gossamer');
		appTray.setContextMenu(mnuTray);
		appTray.on('click', showMainWindow);
		global.server.start();
	}
}

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
		mainWindow.loadURL(root + './control-panel/index.html');

	// Open the devtools.
		//mainWindow.openDevTools({detach: true});
	}
	else mainWindow.show();
}

function closeApplication() {
	if (!!mainWindow) {
		mainWindow.destroy();
	}
	app.quit();
}
