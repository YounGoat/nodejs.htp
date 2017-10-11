'use strict';
module.exports = function(fn /* , predefined_argument, ... */) {
	let predetermined = Array.from(arguments).slice(1);
	return function() {
		let remainders = Array.from(arguments);
		let args = predetermined.concat(remainders);
		return fn.apply(this, args);
	};
}
