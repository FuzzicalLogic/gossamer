"use strict";
/*module.exports = (function() {
	!!('function' === typeof crypto.randomBytes)
		? function b(a) {
			return a
		  		? (a ^ crypto.randomBytes(1)[0] % 16 >> a/4).toString(16)
		    	: ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
		}
		: function b(a) {
			return a
		  		? (a ^ crypto.getRandomValues(new Uint8Array(1))[0] % 16 >> a/4).toString(16)
		    	: ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
		}
}) ();*/

module.exports = (() => {
	return {
		initialize: () => {
			return {
				SuperClass: undefined,
				PromiseClass: undefined,
			}
		},
		inject: (dependencies) => {
			return class extends dependencies.SuperClass {
				constructor() {
					super();
				}

				test() {
					console.log('Test Succeeded');
				}
			}
		}
	};
}) ();
