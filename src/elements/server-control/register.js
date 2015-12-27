(function registerElement() {
	Polymer({
		is: 'server-control',

		created: onElementCreated,
		attached: onElementAttached,
		ready: onElementReady,
		detached: onElementDetached,

		properties: {
			domain: {
				value: "localhost"
			},
			port: {
				value: 0
			},
			state: {
				value: 0
			}
		},
	});

	function onElementCreated() {

	}

	function onElementAttached() {

	}

	function onElementReady() {

	}

	function onElementDetached() {

	}
}) ();
