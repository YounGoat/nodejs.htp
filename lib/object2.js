'use strict';

const MODULE_REQUIRE = 1
	/* built-in */

	/* NPM */

	/* in-package */
	;

function clone(source, keys) {
	if (!keys) {
		keys = Object.keys(source);
	}

	var copy = {};
	keys.forEach(key => {
		if (typeof key == 'string') {
			copy[key] = source[key];
		}
		else if (key instanceof RegExp) {
			Object.keys(source).forEach(keyname => {
				if (key.test(keyname)) {
					copy[keyname] = source[keyname];
				}
			});
		}
	});
	return copy;
}

module.exports = {
	clone
};
