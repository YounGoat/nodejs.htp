'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	, http = require('http')
	, https = require('https')
	, net = require('net')
	/* NPM */
	, ajv = require('ajv')
	/* in-package */
	, htp = require('../index')
	, schema = require('../response.schema')
	, ERRORS = require('../ERRORS')
	;

// The response should a prime object.
// This validate used to confirm its construction.
// 响应对象是一个简单对象，本方法用于检查其结构是否符合预期。
let validateResponse = (new ajv).compile(schema);

describe('HTTPS', function() {
	it('GET', (done) => {
		htp.get('https://wwww.baidu.com', (err, res) => {
			assert.equal(null, err);
			assert(res);
			done();
		});
	});
});
