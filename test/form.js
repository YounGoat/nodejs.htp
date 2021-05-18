'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	, net = require('net')
	/* NPM */
	, ajv = require('ajv')
	/* in-package */
	, htp = require('../htp')
	, schema = require('../response.schema')
	, ERRORS = require('../ERRORS')
	, HttpServer = require('./lib/HttpServer')
	;

let asyncThrow = (err) => {
	if (typeof err === 'string') err = new Error(err);
	process.nextTick(() => { throw err; });
};

let httpServer = new HttpServer('form');

// The response should a prime object.
// This validate used to confirm its construction.
// 响应对象是一个简单对象，本方法用于检查其结构是否符合预期。
let validateResponse = (new ajv).compile(schema);

// Check the err and response carried by callbacker.
// Expected statusCode, body and length of bodyBuffer will be checked.
// 检查回调函数实参 err 和 response。
// 检查响应对象的 statusCode / body / bodyBuffer 长度是否与预期相符。
let commonValidate = (response, statusCode, body, lengthOfBodyBuffer) => {
	// Validate response format.
	if (!validateResponse(response)) {
		throw JSON.stringify(validateResponse.errors[0]);
	}

	// Validate response statusCode
	assert.strictEqual(statusCode, response.statusCode);

	// Validate body content.
	assert.deepStrictEqual(body, response.body);

	// Validate the length of bodyBuffer.
	if (lengthOfBodyBuffer != undefined && typeof body == 'string') {
		lengthOfBodyBuffer = body.length;
	}
	if (lengthOfBodyBuffer != undefined) {
		assert.strictEqual(lengthOfBodyBuffer, response.bodyBuffer.length);
	}
};

before((done) => {
	httpServer.start(done);
});

after((done) => {
	httpServer.stop(done);
});

describe('POST request with payload (body) other than JSON', () => {
	it('application/x-www-urlencoded', async () => {
		let headers = {
			'content-type': htp.FORM.URLENCODED,
		};
		let payload = {
			'name': 'CHING',
			'gender': 'male',
		};
		let response = await htp.request('POST', httpServer.genUrl('/'), headers, payload);
		commonValidate(response, 200, payload);
	});

	it('multipart/form-data', async () => {
		let headers = {
			'content-type': htp.FORM.MULTIPART,
		};
		let payload = {
			'name': 'CHING',
			'gender': 'male',
			'hobby': [ 'writing', 'cycling' ],
		};
		let response = await htp.request('POST', httpServer.genUrl('/'), headers, payload);
		commonValidate(response, 200, payload);
	});
});
