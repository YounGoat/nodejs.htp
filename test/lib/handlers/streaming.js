'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, zlib = require('zlib')

	/* NPM */

	/* in-package */
	, METHODS_WITHOUT_PAYLOAD = require('../../../methods-without-payload')
	;

module.exports = function(req, res) {
	switch (req.url) {
		case '/streaming':
			let i = 0;
			let interval = setInterval(() => {
				res.write('--' + i);
				if (i++ > 10) {
					res.end('--END--');
					clearInterval(interval);
				}
			}, 100);
			return;

		default:
			res.end('');
	}
};
