'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')

	/* NPM */

	/* in-package */
	, htp = require('../htp')
	;

describe('customized htp user-agent', () => {
	it('predefined hostname', (done) => {
		let agent = new htp({
			hostname: 'www.baidu.com',
		});

		agent.request('GET', '/', (err, response) => {
			done(err || response.statusCode >= 400);
		});
	});

	it('shortcut of methods', (done) => {
		let agent = new htp({
			hostname: 'www.baidu.com',
		});

		agent.get('/', (err, response) => {
			done(err || response.statusCode >= 400);
		})
	});
});
