'use strict';
module.exports = function(fn) {
	let count = 0;
	return function() {
		if (count++ === 0) {
			return fn.apply(this, arguments);
		}
	};
};
