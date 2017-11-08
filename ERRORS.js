'use strict';

const MODULE_REQUIRE = 1
	/* built-in */

	/* NPM */

	/* in-package */
	, declareError = require('./lib/declareError')
	;

module.exports = {

	BADURL: declareError('HTP.BadUrl', Error, function(url) {
		this.message = `bad url: ${url}`;
	}),

	TIMEOUT: declareError('HTP.TimeoutError', Error, function(type, timeout) {
		this.message = `${type} timeout (exceeded ${timeout}ms)`;
		this.type = type;
		this.timeout = timeout;
		Object.defineProperty(this, 'stack', {
			enumerable: false
		});
	}),
}
