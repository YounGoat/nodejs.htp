'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, dns = require('dns')
	, events = require('events')
	, http = require('http')
	, https = require('https')
	, stream = require('stream')
	, url = require('url')
	, util = require('util')
	, zlib = require('zlib')

	/* NPM */
	, overload2 = require('overload2')
	, DnsAgent = require('dns-agent')
	, Type = overload2.Type

	/* in-package */
	, object2 = require('./lib/object2')
	, lambda = require('./lib/lambda')
	, once = require('./lib/once')
	, Timeout = require('./lib/timeout')
	, Receiver = require('./lib/Receiver')

	, ERRORS = require('./ERRORS')
	, defaultSettings = require('./settings')
	, METHODS_WITHOUT_PAYLOAD = require('./methods-without-payload')

	/* in-file */
	, setHeaderIfUndefined = (headers, name, value) => {
		let name_lc = name.toLowerCase();
		let found = false;
		for (let key in headers) {
			found = (key.toLowerCase() == name_lc);
			if (found) break;
		}
		if (!found) headers[name] = value;
		return found;
	}
	;

// ---------------------------
// Datatypes

const HTTP_METHOD = Type.enum.apply(overload2, http.METHODS);

/**
 * RFC 7231
 * For GET, HEAD, OPTIONS and CONNECT, there are no defined body semantics.
 * For TRACE, body is not supported.
 */
const HTTP_METHOD_NO_PAYLOAD = Type.enum.apply(null, METHODS_WITHOUT_PAYLOAD);

const HTTP_METHOD_PAYLOAD = Type.and(HTTP_METHOD, Type.not(HTTP_METHOD_NO_PAYLOAD));

const URL = 'string';

const HEADERS = ['object', 'NULL', 'UNDEFINED'];

const BODY = [Type.or('string', 'object', Buffer, stream.Readable), 'NULL', 'UNDEFINED'];

const CALLBACK = Function;

const DNS_AGENT = new DnsAgent({ ttl: defaultSettings.dns_ttl, source: 'system' });

// ---------------------------
// Response processor.

const processResponse = function(settings, bodyStream, timeout, response, callback) {	
	let entity =
		{ statusCode: response.statusCode
		, statusMessage: response.statusMessage
		, httpVersion: response.httpVersion
		, headers: response.headers
		// , body: null
		// , bodyDecompressed: false
		// , bodyBuffer: null
		};

	let content =
		{ length: null
		, type: null
		, charset: 'utf8'
		, boundary: null
		, encoding: null
		};

	let staging = !settings.piping || !settings.pipingOnly;

	// Firstly, we should analyse headers to retrive necessary control info.
	let headers = {};
	for (let name in response.headers) {
		headers[ name.toLowerCase() ] = response.headers[name];
	}
	
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
		bodyStream && bodyStream.emit('response', entity);		
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

		staging && chunks.push(chunk);
		bodyStream && bodyStream.push(chunk);
	});

	let aborted = false;
	
	// The "end" event will still be emitted after incommingMessage.destroy().
	// Maybe we should forbid the listener to be invoked.
	source.on('end', () => {
		onResponseArrived();
		onChunk();
		timeout.end('CHUNK');
		timeout.end('DATA');
		bodyStream && bodyStream.end();

		if (staging) {
			let buf = Buffer.concat(chunks);
			let body = parseBody(buf, content);

			entity.body             = body;
			entity.bodyDecompressed = decompressed;
			entity.bodyBuffer       = buf;
		}

		timeout.end('REQUEST');

		// In streaming mode, we wanna the 'end' event emitted and catched before callback() invoked.
		bodyStream ? process.nextTick(callback, null, entity) : callback(null, entity);
	});

	// incommingMessage.destroy() leads to this event.
	response.on('aborted', () => {
		aborted = true;
	});

	response.on('error', (error) => {
		bodyStream && bodyStream.emit('error', error);
		callback(error);
	});
};

const parseBody = function(buf, content) {
	let body = buf.toString(content.charset);
	if (content.type === 'application/json') {
		try {
			body = JSON.parse(body);
		} catch(ex) {
			// DO NOTHING.
		}
	}
	return body;
};

// ---------------------------
// Base request executor.

const baseRequest = function(method, urlname, headers, body, callback) {
	let settings = defaultSettings, dnsAgent = DNS_AGENT;
	if (this instanceof easyRequest_constructor) {
		settings = this.settings;
		dnsAgent = this.dnsAgent;
	}

	let bodyStream = null;
	if (settings.piping) {
		bodyStream = new Receiver();
	}
	
	let emitOnBodyStream = (eventName, data) => {
		bodyStream && bodyStream.emit(eventName, data);
	};

	if (!headers) {
		headers = {};
	}

	// Each header field consists of a name followed by a colon (":") and the field value. Field names are case-insensitive.
	// @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
	if (1) {
		let normalizedHeaders = {};
		for (let name in headers) {
			normalizedHeaders[name.toLowerCase()] = headers[name];
		}
		headers = normalizedHeaders;
	}

	if (util.isUndefined(headers['accept-encoding'])) {
		headers['accept-encoding'] = 'gzip, deflate';
	}

	if (body != null && typeof body == 'object' && body.constructor === Object) {
		body = JSON.stringify(body);
		if (util.isUndefined(headers['content-type'])) {
			headers['content-type'] = 'application/json';
		}
	}

	if (!headers['user-agent']) {
		headers['user-agent'] = 'nodejs.http,https/htp';
	}

	let RR = (resolve, reject) => {
		let timeout = new Timeout(settings);
		let clientRequest = null;
		let incomingMessage = null;

		let fnDone = (err, entity) => {
			timeout.clear();
			
			if (err) {
				// Force the clientRequest to abort and the incomingMessage (response) to destroy.
				clientRequest && clientRequest.abort();
				incomingMessage && incomingMessage.destroy();

				if (!(err instanceof Error)) {
					err = new Error(err);
				}
				err.performance = timeout.performance;
				err.action = method + ' ' + urlname;

				emitOnBodyStream('error', err);
				reject && reject(err);
				callback && callback(err, null);
			}
			else {
				entity.performance = timeout.performance;
				resolve && resolve(entity);
				callback && callback(null, entity);
			}
		};
		fnDone = once(fnDone);

		// Validate the urlname.
		// Complete the urlname with defualt settings if necessary.
		if (1) {
			/^((http:|https:)?(\/\/))?/.test(urlname);

			// If both protocol and host are not specified,
			// use protocol, hostname and port predefined in settings to complete the url.
			if (RegExp.$1 == '') {
				// Because hostname has NO default value, so,
				// if hostname not predefined in settings, the uncompleted url without hostname is bad.
				if (!settings.hostname) {
					return fnDone(new ERRORS.BADURL(urlname));
				}

				let host = settings.hostname;
				if (settings.port) {
					host += `:${settings.port}`;
				}

				if (urlname.charAt(0) != '/') {
					urlname = `/${urlname}`;
				}
				urlname = `${settings.protocol}//${host}${urlname}`;
			}

			// If protocol omitted.
			else if (RegExp.$2 == '') {
				urlname = `${settings.protocol}${urlname}`;
			}
		}

		// Get URL infos from urlname.
		let urlParts = url.parse(urlname);

		timeout.start('REQUEST', fnDone);
		timeout.start('DNS', fnDone);
		let onDnsLookup = (err, /*string*/ address, /*int*/ family) => {
			timeout.end('DNS');
			emitOnBodyStream('dns', { address, family });

			if (err) {
				return fnDone(err);
			}			

			if (address != urlParts.hostname) {
				setHeaderIfUndefined(headers, 'Host', urlParts.hostname);
			}
			
			const options = {
				protocol : urlParts.protocol,
				auth     : urlParts.auth,
				
				// hostname : urlParts.hostname,
				hostname : address,

				port     : urlParts.port,
				path     : urlParts.path,

				method   : method,
				headers  : headers
			};
			
			if (urlParts.protocol == 'https:') {
				// @see https://nodejs.org/dist/latest/docs/api/tls.html#tls_tls_connect_options_callback
				Object.assign(options, object2.clone(settings, [ 'rejectUnauthorized' ]));
			}

			const connection = {
				localAddress  : null,
				localFamily   : null,
				localPort     : null,

				remoteAddress : null,
				remoteFamily  : null,
				remotePort    : null,
			};

			clientRequest = (urlParts.protocol == 'https:' ? https : http)
				.request(options, response => {
					incomingMessage = response;
					processResponse(settings, bodyStream, timeout, response, fnDone);
				});

			timeout.start('PLUGIN', fnDone);
			clientRequest.on('socket', function(socket) {
				timeout.end('PLUGIN');
				timeout.start('CONNECT', fnDone);
				socket.on('connect', function(event) {
					timeout.end('CONNECT');
					emitOnBodyStream('connect');
					
					timeout.start('RESPONSE', fnDone);
					timeout.start('DATA', fnDone);
					Object.assign(connection, object2.clone(socket, [ /^remote/, /^local/ ]));
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
				emitOnBodyStream('error', err);
				fnDone(err);
			});

			if (body === null || body === undefined) {
				clientRequest.end();
			}
			else if (typeof body === 'string' || body instanceof Buffer) {
				clientRequest.end(body);
			}
			else if (body instanceof stream.Readable) {
				body.on('error', function(err) {
					// 如果输入流出现错误，将该错误传递至请求流。
					clientRequest.emit('error', err);
				});
				body.pipe(clientRequest);
			}
		};

		// dns.lookup(urlParts.hostname, onDnsLookup);
		dnsAgent.lookup4(urlParts.hostname, (err, ipv4) => onDnsLookup(err, ipv4, 4));
	};

	if (bodyStream) {
		process.nextTick(RR);
		return bodyStream;
	}
	else {
		return callback ? RR() : new Promise(RR);
	}
};

// ---------------------------
// Overloading.

function easyRequest_constructor(settings) {
	if (!(this instanceof easyRequest_constructor)) {
		return new easyRequest_constructor(settings);
	}

	this.settings = Object.assign({}, defaultSettings, settings);
	if (this.settings.dns_ttl == defaultSettings.dns_ttl) {
		this.dnsAgent = DNS_AGENT;
	}
	else {
		this.dnsAgent = new DnsAgent({ ttl: this.settings.dns_ttl });
	}

	this.request = easyRequest;

	http.METHODS.forEach((name) => {
		this[name.toLowerCase()] = lambda(easyRequest, name);
	});
}

const easyRequest = overload2()
	// Create a customized user agent instance.
	.overload('object', easyRequest_constructor)

	// HEADERS should be a primary object, however sometimes BODY looks alike with HEADERS.
	// If there is only one object following URL, how can I know it is HEADERS or BODY?
	//
	// For methods requiring payloads, the argument BODY is necessary.
	// So, if there is only one object offered, it will be regarded as BODY.
	//
	// For methods not requiring payloads, the argument BODY is not necessary.
	// And, if there is only one object offered, it will be regarded as HEADERS.

	.overload(HTTP_METHOD, URL, HEADERS, BODY, CALLBACK,
		function(method, urlname, headers, body, callback) { return baseRequest.call(this, method, urlname, headers, body, callback); }
	)

	// Methods requiring payloads.

	.overload(HTTP_METHOD_PAYLOAD, URL, HEADERS, BODY,
		function(method, urlname, headers, body) { return baseRequest.call(this, method, urlname, headers, body, null); }
	)

	.overload(HTTP_METHOD_PAYLOAD, URL, BODY, CALLBACK,
		function(method, urlname, body, callback) { return baseRequest.call(this, method, urlname, null, body, callback); }
	)

	.overload(HTTP_METHOD_PAYLOAD, URL, BODY,
		function(method, urlname, body) { return baseRequest.call(this, method, urlname, null, body, null); }
	)

	// Methods not requiring payloads.

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

const pipingRequest = new easyRequest_constructor({ piping: true, pipingOnly: false });
easyRequest.piping = easyRequest.bind(pipingRequest);

const pipingOnlyRequest = new easyRequest_constructor({ piping: true, pipingOnly: true });
easyRequest.pipingOnly = easyRequest.bind(pipingOnlyRequest);

http.METHODS.forEach((NAME) => {
	let Name = NAME.charAt(0).toUpperCase() + NAME.substr(1).toLowerCase();
	let name = NAME.toLowerCase();

	easyRequest[name] = lambda(easyRequest, NAME);
	
	easyRequest[`piping${Name}`] = lambda(easyRequest, NAME).bind(pipingRequest);
	easyRequest.piping[name] = lambda(easyRequest, NAME).bind(pipingRequest);
	
	easyRequest[`pipingOnly${Name}`] = lambda(easyRequest, NAME).bind(pipingOnlyRequest);
	easyRequest.pipingOnly[name] = lambda(easyRequest, NAME).bind(pipingOnlyRequest);
});

easyRequest.request = easyRequest;
module.exports = easyRequest;
