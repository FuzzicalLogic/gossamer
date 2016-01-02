(function registerElement() {
	Polymer({
		is: 'native-developer-tools',

		created: onElementCreated,
		attached: onElementAttached,
		ready: onElementReady,
		detached: onElementDetached,

		listeners: {
			'devtools': '_onDevTools'
		},

		_onDevTools: onToggleDeveloperTools
	});

	function onElementCreated() {

	}

	function onElementAttached() {

	}

	function onElementReady() {

	}

	function onToggleDeveloperTools() {
		var win = require('electron').remote.getCurrentWindow();
		if (win.isDevToolsOpened())
			win.closeDevTools();
		else win.openDevTools({detach:true});
	}

	function onElementDetached() {

	}

}) ();
