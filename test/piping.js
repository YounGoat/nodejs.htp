'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	/* NPM */
	, ajv = require('ajv')
	/* in-package */
	, htp = require('../htp')
	, schema = require('../response.schema')
	, ERRORS = require('../ERRORS')
	, HttpServer = require('./lib/HttpServer')
    ;
    
// The response should a prime object.
// This validate used to confirm its construction.
// 响应对象是一个简单对象，本方法用于检查其结构是否符合预期。
let validateResponse = (new ajv).compile(schema);

let httpServer = new HttpServer('piping');

before((done) => {
    httpServer.start(done);
});

after((done) => {
    httpServer.stop(done);
});

describe('Pipe Style', function() {
	it('GET', (done) => {
		let bodyBuffer = null;
		let output = htp.pipingGet(httpServer.genUrl('/streaming'), (err, res) => {
				assert.equal(null, err);
				assert(bodyBuffer.equals(res.bodyBuffer));
				done();
			})
			;

		let chunks = [];
		output.on('data', chunk => chunks.push(chunk));
		output.on('end', () => {
			bodyBuffer = Buffer.concat(chunks);
		});
	});
});
