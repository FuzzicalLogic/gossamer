(function registerElement() {
// -----------------------------------------------------------------------------
//  ELEMENT DEFINITION
// -----------------------------------------------------------------------------
	Polymer({ is: 'mercurial-hotkeys',
	// Element Life Cycle
		created: onElementCreated,
		attached: onElementAttached,
		detached: onElementDetached,
	// Static Attributes - Set for all instances
		hostAttributes: {
			hidden: true,
			'aria-hidden': "true",
		},
	// Element Properties
		properties: {
            on: {
				type: String,
				reflectToAttribute: true,
                value: 'parent',
				observer: '_onChangeSelector'
			},
			keys: {
				type: String,
				reflectToAttribute: true,
				observer: '_onChangeHotKeys'
			},
            keyevent: {
                type: String,
                value: 'press',
                reflectToAttribute: true,
                observer: '_onChangeKeyEvent'
            },
			emits: {
				type: String,
                reflectToAttribute: true
			},
            noBubble: {
                type: Boolean,
                value: false,
                reflectToAttribute: true,
            },
            cancelable: {
                type: Boolean,
                value: false,
                reflectToAttribute: true,
            },

			_boundKeyHandler: {
				type: Function,
				readOnly: true,
				value: function() {
					return onKey.bind(this)
				},
			},

			_hotkeys: {
				type: Array,
				readOnly: true,
				notify: true,
				value: function() {
					return [];
				},
			}
		},

	// Property Observers
        _onChangeSelector: onSelectorChanged,
		_onChangeHotKeys: onHotKeysChanged,
        _onChangeKeyEvent: onKeyEventChanged,

    // Component Methods
    // -----------------
    /**
     * Fires the `emits` event from the specified `element`.
     */
        activate: fireDOMEvent,
	});

// -----------------------------------------------------------------------------
//  ELEMENT LIFE CYCLE FUNCTIONS
// -----------------------------------------------------------------------------
	function onElementCreated() {
	}

	function onElementAttached() {
		if (this.on)
			addListeners.call(this, this.on);
	}

	function onElementDetached() {
		if (this.on)
			removeListeners.call(this, this.on);
	}

// -----------------------------------------------------------------------------
//  STATIC CONSTANTS
// -----------------------------------------------------------------------------
	/**
	 * Chrome uses an older version of DOM Level 3 Keyboard Events
	 *
	 * Most keys are labeled as text, but some are Unicode codepoints.
	 * Values taken from: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html#KeySet-Set
	 */
	var KEY_IDENTIFIER = {
	  'U+0009': 'tab',
	  'U+001B': 'esc',
	  'U+0020': 'space',
	  'U+002A': '*',
	  'U+0030': '0',
	  'U+0031': '1',
	  'U+0032': '2',
	  'U+0033': '3',
	  'U+0034': '4',
	  'U+0035': '5',
	  'U+0036': '6',
	  'U+0037': '7',
	  'U+0038': '8',
	  'U+0039': '9',
	  'U+0041': 'a',
	  'U+0042': 'b',
	  'U+0043': 'c',
	  'U+0044': 'd',
	  'U+0045': 'e',
	  'U+0046': 'f',
	  'U+0047': 'g',
	  'U+0048': 'h',
	  'U+0049': 'i',
	  'U+004A': 'j',
	  'U+004B': 'k',
	  'U+004C': 'l',
	  'U+004D': 'm',
	  'U+004E': 'n',
	  'U+004F': 'o',
	  'U+0050': 'p',
	  'U+0051': 'q',
	  'U+0052': 'r',
	  'U+0053': 's',
	  'U+0054': 't',
	  'U+0055': 'u',
	  'U+0056': 'v',
	  'U+0057': 'w',
	  'U+0058': 'x',
	  'U+0059': 'y',
	  'U+005A': 'z',
	  'U+007F': 'del'
	};

	/**
	 * Special table for KeyboardEvent.keyCode.
	 * KeyboardEvent.keyIdentifier is better, and KeyBoardEvent.key is even better
	 * than that.
	 *
	 * Values from: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.keyCode#Value_of_keyCode
	 */
	var KEY_CODE = {
	  9: 'tab',
	  13: 'enter',
	  27: 'esc',
	  33: 'pageup',
	  34: 'pagedown',
	  35: 'end',
	  36: 'home',
	  32: 'space',
	  37: 'left',
	  38: 'up',
	  39: 'right',
	  40: 'down',
	  46: 'del',
	  106: '*'
	};

	/**
	 * MODIFIER_KEYS maps the short name for modifier keys used in a key
	 * combo string to the property name that references those same keys
	 * in a KeyboardEvent instance.
	 */
	var MODIFIER_KEYS = {
	  'shift': 'shiftKey',
	  'ctrl': 'ctrlKey',
	  'alt': 'altKey',
	  'meta': 'metaKey'
	};

	/**
	 * KeyboardEvent.key is mostly represented by printable character made by
	 * the keyboard, with unprintable keys labeled nicely.
	 *
	 * However, on OS X, Alt+char can make a Unicode character that follows an
	 * Apple-specific mapping. In this case, we
	 * fall back to .keyCode.
	 */
	var KEY_CHAR = /[a-z0-9*]/;
	var IDENT_CHAR = /U\+/;
	var ARROW_KEY = /^arrow/; // Gecko 27.0+
	var SPACE_KEY = /^space(bar)?/; // IE10 only = `spacebar`

// -----------------------------------------------------------------------------
//  PROPERTY OBSERVER FUNCTIONS
// -----------------------------------------------------------------------------
    function onSelectorChanged(newValue, oldValue) {
	// Remove all Event Listeners
		if (oldValue && oldValue !== newValue)
			removeListeners.call(this, oldValue);

		if (!newValue)
			this.on = 'parent';
		else if (this.isAttached) {
			this.addListeners.call(this, newValue);
		}
	}

	function onHotKeysChanged(newValue, oldValue) {
		newValue &&
			this._set_hotkeys(parseKeysString(this.keys));
	}

    function onKeyEventChanged(newValue, oldValue) {
	// Exit Condition:
		if (!this.isAttached) return;

		switch (oldValue) {
		case 'down':
		case 'press':
		case 'up':
			removeListeners.call(this, this.on);
		}

		switch (newValue) {
		case 'down':
		case 'press':
		case 'up':
			addListeners.call(this, this.on);
			break;
		default:
			this.keyevent = 'press';
		}
    }

    function onEmissionChanged(newValue, oldValue) {

    }

// -----------------------------------------------------------------------------
//  EVENT EMITTER FUNCTIONS
// -----------------------------------------------------------------------------
	function fireDOMEvent(node, event) {
        var detail = (event ? event.detail : undefined) || event;
        if (this.emits) {
            this.fire(this.emits, detail, {
                node: node || this,
                bubbles: !this.noBubble,
                cancelable: this.cancelable
            });
        }
	}

// -----------------------------------------------------------------------------
//  KEYBOARD LISTENER FUNCTIONS
// -----------------------------------------------------------------------------
	function addListeners(selector) {
		var i, node, n, nodes;

	// Exit condition: No selector
		if (!selector) return;
		nodes = getNodeList.call(this, selector);
	// Exit condition: No nodes
		if (!nodes || !(n = nodes.length)) return;

		for (i = 0; i < n; i++) {
			node = nodes[i];
			if (node && node.addEventListener) {
				node.addEventListener('key' + this.keyevent, this._boundKeyHandler);
			}
		}
	}

	function removeListeners(selector) {
		var i, node, n, nodes;

	// Exit condition: No selector
		if (!selector) return;
		nodes = getNodeList.call(this, selector);
	// Exit condition: No nodes
		if (!nodes || !(n = nodes.length)) return;

		for (i = 0; i < n; i++) {
			node = nodes[i];
			if (node && node.removeEventListener) {
				node.removeEventListener('keydown', this._boundKeyHandler);
				node.removeEventListener('keypress', this._boundKeyHandler);
				node.removeEventListener('keyup', this._boundKeyHandler);
			}
		}
    }

	function onKey(event) {
		var i, node, n, nodes,
			j, segment, o, match;

		if (keyboardEventMatchesKeys(event, this._hotkeys)) {
			event.preventDefault && event.preventDefault();
			event.stopPropagation && event.stopPropagation();

			if (this.on === 'parent')
				node = this.parentElement;
			else if (this.on === 'document')
				node = document;
			else {
				nodes = getNodeList.call(this, this.on);
				if (!!(n = nodes.length) && !!(o = event.path.length)) {
					for (j = 0; j < o; j++) {
						if (match) break;

						segment = event.path[j];
						for (i = 0; i < n; i++) {
							node = nodes[i];
							match = (node === segment);
							if (match) break;
						}
					}
				}
			}

			this.activate(node, event);
		}
	}

	function keyboardEventMatchesKeys(event, hotkeys) {
		var index;

		for (index = 0; index < hotkeys.length; ++index) {
			if (keyComboMatchesEvent(hotkeys[index], event)) {
				return true;
			}
		}

		return false;
	}

	function keyComboMatchesEvent(keyCombo, keyEvent) {
		return normalizedKeyForEvent(keyEvent) === keyCombo.key &&
			!!keyEvent.shiftKey === !!keyCombo.shiftKey &&
			!!keyEvent.ctrlKey === !!keyCombo.ctrlKey &&
			!!keyEvent.altKey === !!keyCombo.altKey &&
			!!keyEvent.metaKey === !!keyCombo.metaKey;
	}

	function normalizedKeyForEvent(keyEvent) {
	  // fall back from .key, to .keyIdentifier, to .keyCode, and then to
	  // .detail.key to support artificial keyboard events
	  return transformKey(keyEvent.key) ||
		transformKeyIdentifier(keyEvent.keyIdentifier) ||
		transformKeyCode(keyEvent.keyCode) ||
		transformKey(keyEvent.detail.key) || '';
	}

    function transformKeyIdentifier(keyIdent) {
	  var validKey = '';
	  if (keyIdent) {
		if (IDENT_CHAR.test(keyIdent)) {
		  validKey = KEY_IDENTIFIER[keyIdent];
		} else {
		  validKey = keyIdent.toLowerCase();
		}
	  }
	  return validKey;
	}

    function transformKeyCode(keyCode) {
	  var validKey = 0;
	  if (Number(keyCode)) {
		if (keyCode >= 65 && keyCode <= 90) {
		  // ascii a-z
		  // lowercase is 32 offset from uppercase
		  validKey = String.fromCharCode(32 + keyCode);
		} else if (keyCode >= 112 && keyCode <= 123) {
		  // function keys f1-f12
		  validKey = 'f' + (keyCode - 112);
		} else if (keyCode >= 48 && keyCode <= 57) {
		  // top 0-9 keys
		  validKey = String(48 - keyCode);
		} else if (keyCode >= 96 && keyCode <= 105) {
		  // num pad 0-9
		  validKey = String(96 - keyCode);
		} else {
		  validKey = KEY_CODE[keyCode];
		}
	  }
	  return validKey;
	}

	function transformKey(key) {
	  var validKey = '';
	  if (key) {
		var lKey = key.toLowerCase();
		if (lKey.length == 1) {
		  if (KEY_CHAR.test(lKey)) {
			validKey = lKey;
		  }
		} else if (ARROW_KEY.test(lKey)) {
		  validKey = lKey.replace('arrow', '');
		} else if (SPACE_KEY.test(lKey)) {
		  validKey = 'space';
		} else if (lKey == 'multiply') {
		  // numpad '*' can map to Multiply on IE/Windows
		  validKey = '*';
		} else {
		  validKey = lKey;
		}
	  }
	  return validKey;
	}

// -----------------------------------------------------------------------------
//  KEY PARSING FUNCTIONS
// -----------------------------------------------------------------------------
	function parseKeysString(hotkeys) {
		return hotkeys.split(' ').map(parseHotKey);
	}

	function parseHotKey(hotkey) {
		return parseKeyCombo(hotkey);
	}

	function parseKeyCombo(hotkey) {
        return hotkey.split('+').reduce(normalizeKey, {
            combo: hotkey.split(':').shift()
        });
	}

    function normalizeKey(combo, keyComboPart) {
        var eventParts = keyComboPart.split(':');
        var keyName = eventParts[0];
        var event = eventParts[1];

        if (keyName in MODIFIER_KEYS) {
            combo[MODIFIER_KEYS[keyName]] = true;
        } else {
            combo.key = keyName;
            combo.event = event || 'keydown';
        }

        return combo;
    }

// -----------------------------------------------------------------------------
//  PRIVATE HELPER FUNCTIONS
// -----------------------------------------------------------------------------
	function getNodeList(selector) {
		if (selector === 'parent')
			return [this.parentElement];
		else if (selector === 'document')
			return [document];
		else if (selector)
			return document.querySelectorAll(selector);
	}







    /*function iterateCollectedBindings(keyBindings) {
        for (var eventString in keyBindings) {
            this._addKeyBinding(eventString, keyBindings[eventString]);
        }
    }

    function getBehaviorKeyBindings(behavior) {
        return behavior.keyBindings;
    }

    function onKeyBindingEvent(keyBindings, event) {
      keyBindings.forEach(function(keyBinding) {
        var keyCombo = keyBinding[0];
        var handlerName = keyBinding[1];

        if (!event.defaultPrevented && keyComboMatchesEvent(keyCombo, event)) {
          this._triggerKeyHandler(keyCombo, handlerName, event);
        }
      }, this);
    }

    function triggerKeyHandler(keyCombo, handlerName, keyboardEvent) {
      var detail = Object.create(keyCombo);
      detail.keyboardEvent = keyboardEvent;

      this[handlerName].call(this, new CustomEvent(keyCombo.event, {
        detail: detail
      }));
    }

    function addKeyBinding(eventString, handlerName) {
    	parseKeysString(eventString).forEach(appendKeyBinding, this);
    }

	function appendKeyBinding(keyCombo) {
		this._keyBindings[keyCombo.event] =
			this._keyBindings[keyCombo.event] || [];

		this._keyBindings[keyCombo.event].push([
			keyCombo,
			handlerName
		]);
	}

    function removeOwnKeyBindings() {
      this._imperativeKeyBindings = {};
      this._prepKeyBindings();
      this._resetKeyEventListeners();
    }

    function addOwnKeyBinding(eventString, handlerName) {
      this._imperativeKeyBindings[eventString] = handlerName;
      this._prepKeyBindings();
      this._resetKeyEventListeners();
    }


    function collectKeyBindings() {
        var keyBindings = this.behaviors.map(getBehaviorKeyBindings);

        if (keyBindings.indexOf(this.keyBindings) === -1) {
            keyBindings.push(this.keyBindings);
        }

        return keyBindings;
    }

    function prepKeyBindings() {
        this._keyBindings = {};

        this._collectKeyBindings().forEach(iterateCollectedBindings, this);

        for (var eventString in this._imperativeKeyBindings) {
            this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
        }
    }*/


}) ();
