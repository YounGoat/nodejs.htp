'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, dns = require('dns')
	, events = require('events')
	, http = require('http')
	, https = require('https')
	, stream = require('stream')
	, url = require('url')
	, zlib = require('zlib')

	/* NPM */
	, overload2 = require('overload2')
	, Type = overload2.Type

	/* in-package */
	, object2 = require('./lib/object2')
	, lambda = require('./lib/lambda')
	, once = require('./lib/once')
	, Timeout = require('./lib/timeout')

	, ERRORS = require('./ERRORS')
	, defaultSettings = require('./settings')
	;

// ---------------------------
const NON_PAYLOAD_METHODS = ['GET', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'];

// ---------------------------
// Datatypes

const HTTP_METHOD = Type.enum.apply(overload2, http.METHODS);

/**
 * RFC 7231
 * For GET, HEAD, OPTIONS and CONNECT, there are no defined body semantics.
 * For TRACE, body is not supported.
 */
const HTTP_METHOD_NO_PAYLOAD = Type.enum.apply(null, NON_PAYLOAD_METHODS);

const HTTP_METHOD_PAYLOAD = Type.and(HTTP_METHOD, Type.not(HTTP_METHOD_NO_PAYLOAD));

const URL = 'string';

const HEADERS = 'object';

const BODY = Type.or('string', 'object', Buffer, stream.Readable);

const CALLBACK = Function;

// ---------------------------
// Response processor.

const processResponse = function(timeout, response, callback) {
	let entity =
		{ statusCode: null
		, statusMessage: null
		, httpVersion: null
		, headers: null
		, body: null
		, bodyDecompressed: false
		, bodyBuffer: null
		};

	let content =
		{ length: null
		, type: null
		, charset: 'utf8'
		, boundary: null
		, encoding: null
		};

	// Firstly, we should analyse headers to retrive necessary control info.
	let headers = response.headers;

	if (headers['content-length']) {
		content.length = 0 + headers['content-length'];
	}

	if (headers['content-type']) {
		let parts = headers['content-type'].toLowerCase().split(/;\s*/);
		content.type = parts[0];

		if (parts[1] && /^(charset|boundary)=(.+)$/.test(parts[1])) {
			content[RegExp.$1] = RegExp.$2;
		}
	}

	let source = response, decompressed = false;
	if (headers['content-encoding']) {
		switch (headers['content-encoding'].toLowerCase()) {
			case 'gzip':
				source = response.pipe(zlib.createGunzip());
				decompressed = true;
				break;

			case 'deflate':
				source = response.pipe(zlib.createInflate());
				decompressed = true;
				break;

			case undefined:
			default:
				// Un-supported content encoding.
		}
	}

	// Read response body.
	let chunks = [];
	let onResponseArrived = once(() => {
		timeout.end('RESPONSE');
	});
	let onChunk = () => {
		try {
			timeout.end('CHUNK');
		} catch(ex) {}
		timeout.start('CHUNK', callback);
	}

	source.on('data', (chunk) => {
		onResponseArrived();
		onChunk();
		chunks.push(chunk);
	});

	source.on('end', () => {
		onResponseArrived();
		onChunk();
		timeout.end('DATA');

		let buf = Buffer.concat(chunks);
		let body = parseBody(buf, content);

		entity.statusCode       = response.statusCode;
		entity.statusMessage    = response.statusMessage;
		entity.httpVersion      = response.httpVersion;
		entity.headers          = response.headers;
		entity.body             = body;
		entity.bodyDecompressed = decompressed;
		entity.bodyBuffer       = buf;

		timeout.end('REQUEST');
		callback(null, entity);
	});

	response.on('error', callback);
};

const parseBody = function(buf, content) {
	if (content.type === 'application/json') {
		return JSON.parse(buf.toString(content.charset));
	}
	else {
		return buf.toString(content.charset);
	}
};

// ---------------------------
// Base request executor.

const baseRequest = function(method, urlname, headers, body, callback) {
	let settings = (this instanceof easyRequest) ? this.settings : defaultSettings;

	return new Promise((resolve, reject) => {
		let timeout = new Timeout(settings);

		let fnDone = (err, entity) => {
			timeout.clear();
			if (err) {
				err.performance = timeout.performance;
				reject(err);
				callback && callback(err, null);
			}
			else {
				entity.performance = timeout.performance;
				resolve(entity);
				callback && callback(null, entity);
			}
		};
		fnDone = once(fnDone);

		// Get URL infos from urlname.
		const urlParts = url.parse(urlname);

		timeout.start('REQUEST', fnDone);
		timeout.start('DNS', fnDone);
		dns.lookup(urlParts.hostname, (err, /*string*/ address, /*int*/ family) => {
			timeout.end('DNS');

			if (err) {
				return fnDone(err);
			}

			if (!headers) {
				headers = {
					'Accept-Encoding': 'gzip, deflate'
				};
			}

			const options = {
				protocol : urlParts.protocol,
				auth     : urlParts.auth,
				hostname : urlParts.hostname,
				port     : urlParts.port,
				path     : urlParts.path,

				method   : method,
				headers  : headers
			};
			const connection = {
				localAddress: null,
				localFamily: null,
				localPort: null,

				remoteAddress: null,
				remoteFamily: null,
				remotePort: null
			};

			let clientRequest = http.request(options, (response) => processResponse(timeout, response, fnDone));

			timeout.start('PLUGIN', fnDone);
			clientRequest.on('socket', function(socket) {
				timeout.end('PLUGIN');
				timeout.start('CONNECT', fnDone);
				socket.on('connect', function() {
					timeout.end('CONNECT');
					timeout.start('RESPONSE', fnDone);
					timeout.start('DATA', fnDone);
					object2.copyProperties(socket, connection, [ /^remote/, /^local/ ]);
				});
			});

			// 仅面向 HTTP CONNECT 方法，是一种特殊的 HTTP 响应，与 socket 建联无关。
			clientRequest.on('connect', function() {
				// TODO
			});

			// 以下内容摘自 Node.js 官方文档：
			// Once a socket is assigned to this request and is connected socket.settimeout.start() will be called.

			// clientRequest.setTimeout(settings.SOCKET_TIMEOUT);
			// clientRequest.on('timeout', function() {
			// 	fnDone(new ERRORS.TIMEOUT('SOCKET', settings.SOCKET_TIMEOUT));
			// });

			clientRequest.on('error', function(err) {
				fnDone(err);
			});

			if (body === null) {
				clientRequest.end();
			}
			else if (typeof body === 'string' || body instanceof Buffer) {
				clientRequest.end(body);
			}
			else { // body instanceof stream.Readable
				body.pipe(clientRequest);
			}
		});

	});
};

// ---------------------------
// Overloading.

const easyRequest = overload2()
	.overload('object',
		function(settings) {
			this.settings = object2.extend(defaultSettings, settings);
			this.request = easyRequest;
		}
	)

	// Methods requiring payloads.

	.overload(HTTP_METHOD_PAYLOAD, URL, HEADERS, BODY, CALLBACK,
		function(method, urlname, headers, body, callback) { return baseRequest.call(this, method, urlname, headers, body, callback); }
	)

	.overload(HTTP_METHOD_PAYLOAD, URL, HEADERS, BODY,
		function(method, urlname, headers, body) { return baseRequest.call(this, method, urlname, headers, body, null); }
	)

	.overload(HTTP_METHOD_PAYLOAD, URL, BODY, CALLBACK,
		function(method, urlname, body, callback) { return baseRequest.call(this, method, urlname, null, body, callback); }
	)

	.overload(HTTP_METHOD_PAYLOAD, URL, BODY,
		function(method, urlname, body) { return baseRequest.call(this, method, urlname, null, body, null); }
	)

	// Methods without payloads.

	.overload(HTTP_METHOD_NO_PAYLOAD, URL, HEADERS, CALLBACK,
		function(method, urlname, headers, callback) { return baseRequest.call(this, method, urlname, headers, null, callback); }
	)

	.overload(HTTP_METHOD_NO_PAYLOAD, URL, CALLBACK,
		function(method, urlname, callback) { return baseRequest.call(this, method, urlname, null, null, callback); }
	)

	.overload(HTTP_METHOD_NO_PAYLOAD, URL, HEADERS,
		function(method, urlname, headers) { return baseRequest.call(this, method, urlname, headers, null, null); }
	)

	.overload(HTTP_METHOD_NO_PAYLOAD, URL,
		function(method, urlname) { return baseRequest.call(this, method, urlname, null, null, null); }
	)
	;

http.METHODS.forEach((name) => {
	easyRequest[name.toLowerCase()] = lambda(easyRequest, name);
});

// easyRequest.get('http://job.ares.fx.ctripcorp.com/urlParts/package?group=demo&name=mix', function(err, res) {
// 	console.log(res.statusCode);
// 	console.log(res.body);
// });

easyRequest.request = easyRequest;

easyRequest.NON_PAYLOAD_METHODS = NON_PAYLOAD_METHODS;
// easyRequest.ERRORS = ERRORS;

module.exports = easyRequest;
