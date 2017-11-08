'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	, http = require('http')
	, net = require('net')
	/* NPM */
	, ajv = require('ajv')
	/* in-package */
	, htp = require('../htp')
	, schema = require('../response.schema')
	, ERRORS = require('../ERRORS')

	, getAvailablePort = require('./lib/getAvailablePort')
	, httpHandler = require('./lib/httpHandler')
	;

let asyncThrow = (err) => {
	if (typeof err === 'string') err = new Error(err);
	process.nextTick(() => { throw err; });
};

// The response should a prime object.
// This validate used to confirm its construction.
// 响应对象是一个简单对象，本方法用于检查其结构是否符合预期。
let validateResponse = (new ajv).compile(schema);

// Available listening port.
// 可用的监听端口。
let httpPort;

// Http server to be accessed.
// 供测试访问的 HTTP 服务。
let httpServer = http.createServer(httpHandler);

// As protocol, hostname and port have been predetermined, this method will generate a URL with pathname supplied.
// 根据预先确定的协议名、主机名和端口号，按照路径生成完整 URL。
let genUrl = (pathname) => `http://127.0.0.1:${httpPort}${pathname}`;

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
	if (typeof lengthOfBodyBuffer === 'undefined') {
		lengthOfBodyBuffer = body.length;
	}
	assert.equal(lengthOfBodyBuffer, response.bodyBuffer.length);
};

before((done) => {
	// Get available server port and then start http server.
	getAvailablePort((port) => {
		httpPort = port;
		httpServer.listen(httpPort);
		done();
	});
})

describe('Basic request without payload', () => {
	it('HEAD, url, headers, null, callback', (done) => {
		htp.request('HEAD', genUrl('/'), {}, null, (err, response) => {
			// If mothod is HEAD, node.js built-in http.IncomingMessage will not
			// receive entity body even if it is sent.
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('HEAD, url, headers, undefined, callback', (done) => {
		htp.request('HEAD', genUrl('/'), {}, undefined, (err, response) => {
			// If mothod is HEAD, node.js built-in http.IncomingMessage will not
			// receive entity body even if it is sent.
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('GET, url, headers, callback', (done) => {
		htp.request('GET', genUrl('/'), {}, (err, response) => {
			commonValidate(err, response, 200, 'GET')
			done();
		});
	});

	it('OPTIONS, url, headers, callback', (done) => {
		htp.request('OPTIONS', genUrl('/'), {}, (err, response) => {
			commonValidate(err, response, 200, 'OPTIONS')
			done();
		});
	});

	it('HEAD, url, callback', (done) => {
		htp.request('HEAD', genUrl('/'), (err, response) => {
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('HEAD, url, headers', (done) => {
		let promise = htp.request('HEAD', genUrl('/'), {});
		promise
			.then((response) => {
				commonValidate(null, response, 200, '');
				done();
			})
			.catch(asyncThrow);
	});

	it('HEAD, url', (done) => {
		let promise = htp.request('HEAD', genUrl('/'));
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
		htp.request('POST', genUrl('/'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('PUT, url, headers, body, callback', (done) => {
		let body = 'BODY CONTENT';
		htp.request('PUT', genUrl('/'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('POST, url, body, callback', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', genUrl('/'), body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('POST, url, null, callback', (done) => {
		let body = null;
		let expectResponseBody = '';
		htp.request('POST', genUrl('/'), body, (err, response) => {
			commonValidate(err, response, 200, expectResponseBody);
			done();
		});
	});

	it('POST, url, headers, body', (done) => {
		let body = 'BODY CONTENT';
		var promise = htp.request('POST', genUrl('/'), {}, body);
		promise
			.then((response) => {
				commonValidate(null, response, 200, body);
				done();
			})
			.catch(asyncThrow);
	});

	it('POST, url, body', (done) => {
		let body = 'BODY CONTENT';
		var promise = htp.request('POST', genUrl('/'), body);
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
		htp.head(genUrl('/'), (err, response) => {
			commonValidate(err, response, 200, '');
			done();
		});
	});

	it('htp.get()', (done) => {
		htp.get(genUrl('/'), (err, response) => {
			commonValidate(err, response, 200, 'GET');
			done();
		});
	});
});

describe('De-compress', () => {
	it('gzip', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', genUrl('/gzip'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});

	it('deflate', (done) => {
		let body = 'BODY CONTENT';
		htp.request('POST', genUrl('/deflate'), {}, body, (err, response) => {
			commonValidate(err, response, 200, body);
			done();
		});
	});
});

describe('Promise Returned', () => {
	it('Resolve', (done) => {
		let p = htp.request('HEAD', genUrl('/'));
		p.then((entity) => done());
	});

	it('Reject', (done) => {
		let p = htp.request('GET', genUrl('/timeout/chunk'));
		p.catch((err) => { done(); });
	});
});

describe('Error Captured', () => {
	it('Hostname not found', (done) => {
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
		"data_timeout": 1000
	});

	it('Timeout (response)', (done) => {
		client.request('GET', genUrl('/timeout/response'), {}, (err, response) => {
			assert(err instanceof ERRORS.TIMEOUT);
			assert.equal('response', err.type);
			done();
		});
	});

	it('Timeout (chunk)', (done) => {
		client.request('GET', genUrl('/timeout/chunk'), {}, (err, response) => {
			assert(err instanceof ERRORS.TIMEOUT);
			assert.equal('chunk', err.type);
			done();
		});
	});

	it('Timeout (data)', (done) => {
		client.request('GET', genUrl('/timeout/data'), {}, (err, response) => {
			assert(err instanceof ERRORS.TIMEOUT);
			assert.equal('data', err.type);
			done();
		});
	});

});
