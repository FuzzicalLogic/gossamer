(function registerElement() {
	Polymer({
		is: "array-list",
		created: onElementCreated,
		ready: onElementReady,
		attached: onElementAttached,
		detached: onElementDetached,
		properties: {
			element: {
				type: String,
				value: "div",
				notify: true,
			},
			items: {
				type: Array,
				value: function() {
					return [];
				},
				notify: true,
				observer: "_onChangeItems"
			}
		},
		_onChangeItems: onItemsChanged

	});

	function onElementCreated() {

	}

	function onElementReady() {

	}

	function onElementAttached() {

	}

	function onElementDetached() {

	}

	function onItemsChanged(newValue, oldValue) {
		if (oldValue != null && oldValue.length)
			removeChildren(this, this.querySelectorAll(this.element));

		var _self = this;
		if (newValue != null && newValue.length) {
			newValue.forEach(function(item, k, a) {
				var child = document.createElement(_self.element);
				Object.getOwnPropertyNames(item).forEach(function(name,k,a) {
					child.setAttribute(name, item[name]);
				});
				_self.appendChild(child)
			});
		}
	}

	function removeChildren(parent, children) {
		Array.prototype.forEach.call(children, function(v, k, a) {
			parent.removeChild(v);
		})
	}

}) ();
