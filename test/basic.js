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

let httpServer = new HttpServer('basic');

// The response should a prime object.
// This validate used to confirm its construction.
// 响应对象是一个简单对象，本方法用于检查其结构是否符合预期。
let validateResponse = (new ajv).compile(schema);

// Check the err and response carried by callbacker.
// Expected statusCode, body and length of bodyBuffer will be checked.
// 检查回调函数实参 err 和 response。
// 检查响应对象的 statusCode / body / bodyBuffer 长度是否与预期相符。
let commonValidate = (err, response, statusCode, body, lengthOfBodyBuffer) => {
	// No error.
	assert.strictEqual(err, null);

	// Validate response format.
	if (!validateResponse(response)) {
		throw validateResponse.errors[0];
	}

	// Validate response statusCode
	assert.equal(statusCode, response.statusCode);

	// Validate body content.
	assert.equal(body, response.body);

	// Validate the length of bodyBuffer.
	if (lengthOfBodyBuffer != undefined && typeof body == 'string') {
		lengthOfBodyBuffer = body.length;
	}
	if (lengthOfBodyBuffer != undefined) {
		assert.equal(lengthOfBodyBuffer, response.bodyBuffer.length);
	}
};

before((done) => {
	httpServer.start(done);
});

after((done) => {
	httpServer.stop(done);
});

describe('Basic request without payload', () => {
	it('HEAD, url, headers, null, callback', (done) => {
		htp.request('HEAD', httpServer.genUrl('/'), {}, null, (err, response) => {
			// If mothod is HEAD, node.js built-in http.IncomingMessage will not
			// receive entity body even if it is sent.
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('HEAD, url, headers, undefined, callback', (done) => {
		htp.request('HEAD', httpServer.genUrl('/'), {}, undefined, (err, response) => {
			// If mothod is HEAD, node.js built-in http.IncomingMessage will not
			// receive entity body even if it is sent.
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('GET, url, headers, callback', (done) => {
		htp.request('GET', httpServer.genUrl('/'), {}, (err, response) => {
			commonValidate(err, response, 200, 'GET')
			done();
		});
	});

	it('OPTIONS, url, headers, callback', (done) => {
		htp.request('OPTIONS', httpServer.genUrl('/'), {}, (err, response) => {
			commonValidate(err, response, 200, 'OPTIONS')
			done();
		});
	});

	it('HEAD, url, callback', (done) => {
		htp.request('HEAD', httpServer.genUrl('/'), (err, response) => {
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('HEAD, url, headers', (done) => {
		let promise = htp.request('HEAD', httpServer.genUrl('/'), {});
		promise
			.then((response) => {
				commonValidate(null, response, 200, '');
				done();
			})
			.catch(asyncThrow);
	});

	it('HEAD, url', (done) => {
		let promise = htp.request('HEAD', httpServer.genUrl('/'));
		promise
			.then((response) => {
				commonValidate(null, response, 200, '');
				done();
			})
			.catch(asyncThrow);
	});
});

describe('Basic request with payload', () => {
	it('POST, url, headers, body, callback', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', httpServer.genUrl('/'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('PUT, url, headers, body, callback', (done) => {
		let body = 'BODY CONTENT';
		htp.request('PUT', httpServer.genUrl('/'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('POST, url, body, callback', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', httpServer.genUrl('/'), body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('POST, url, null, callback', (done) => {
		let body = null;
		let expectResponseBody = '';
		htp.request('POST', httpServer.genUrl('/'), body, (err, response) => {
			commonValidate(err, response, 200, expectResponseBody);
			done();
		});
	});

	it('POST, url, headers, body', (done) => {
		let body = 'BODY CONTENT';
		var promise = htp.request('POST', httpServer.genUrl('/'), {}, body);
		promise
			.then((response) => {
				commonValidate(null, response, 200, body);
				done();
			})
			.catch(asyncThrow);
	});

	it('POST, url, body', (done) => {
		let body = 'BODY CONTENT';
		var promise = htp.request('POST', httpServer.genUrl('/'), body);
		promise
			.then((response) => {
				commonValidate(null, response, 200, body);
				done();
			})
			.catch(asyncThrow);
	});
});

describe('Lambda form', () => {
	it('htp.head()', (done) => {
		htp.head(httpServer.genUrl('/'), (err, response) => {
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('htp.get()', (done) => {
		htp.get(httpServer.genUrl('/'), (err, response) => {
			commonValidate(err, response, 200, 'GET');
			done();
		});
	});
});

describe('De-compress', () => {
	it('gzip', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', httpServer.genUrl('/gzip'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('deflate', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', httpServer.genUrl('/deflate'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});
});

describe('Promise Returned', () => {
	it('Resolve', (done) => {
		let p = htp.request('HEAD', httpServer.genUrl('/'));
		p.then(entity => done());
	});

	it('Reject', (done) => {
		let p = htp.request('GET', httpServer.genUrl('/timeout/chunk'));
		p.catch(err => done());
	});
});

describe('Error Captured', () => {
	it.skip('Hostname not found', (done) => {
		htp.request('HEAD', 'http://null.example.com/', {}, (err, response) => {
			assert.equal('ENOTFOUND', err.code);
			done();
		});
	});
});

describe('Timeout Errors', () => {
	var client = new htp({
		"response_timeout": 100,
		"chunk_timeout": 200,
		"data_timeout": 1000,
	});

	it('Timeout (response)', (done) => {
		client.request('GET', httpServer.genUrl('/timeout/response'), {}, (err, response) => {
			assert(err instanceof ERRORS.TIMEOUT);
			assert.equal('response', err.type);
			done();
		});
	});

	it('Timeout (chunk)', (done) => {
		client.request('GET', httpServer.genUrl('/timeout/chunk'), {}, (err, response) => {
			assert(err instanceof ERRORS.TIMEOUT);
			assert.equal('chunk', err.type);
			done();
		});
	});

	it('Timeout (data)', (done) => {
		client.request('GET', httpServer.genUrl('/timeout/data'), {}, (err, response) => {
			assert(err instanceof ERRORS.TIMEOUT);
			assert.equal('data', err.type);
			done();
		});
	});

});
