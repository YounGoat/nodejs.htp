'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, zlib = require('zlib')

	/* NPM */

	/* in-package */
	, htp = require('../../index')
	;

module.exports = function(req, res) {
	switch (req.url) {
		case '/timeout/response':
			// No response at all.
			return;

		case '/timeout/chunk':
			// Response delays between two chunks.
			res.write('CHUNK');
			return;

		case '/timeout/data':
			// Response continues without being ended.
			res.write('CHUNK');
			setInterval(function() { res.write('CHUNK'); }, 100);
			return;
	}

	let doResponse = (content) => {
	 	const headers = req.headers;

		for (var name in headers) {
			if (name.startsWith('x-')) {
				res.setHeader(name.substr(2), headers[name]);
			}
		}

		let buf = new Buffer(content, 'utf8');

		if (req.url == '/gzip') {
			res.setHeader('Content-Encoding', 'gzip');
			buf = zlib.gzipSync(buf);
		}
		else if (req.url == '/deflate') {
			res.setHeader('Content-Encoding', 'deflate');
			buf = zlib.deflateSync(buf);
		}

		res.setHeader('X-Url', req.url);
		res.setHeader('Content-Length', buf.length);
		res.end(buf);
	};

	if (htp.NON_PAYLOAD_METHODS.indexOf(req.method) >= 0) {
		doResponse(req.method);
	}
	else {
		// console.log('SERVER REQ', req.headers);

		let source = req;
		if (req.headers['content-encoding']) {
			switch (req.headers['content-encoding'].toLowerCase()) {
				case 'gzip':
					source = req.pipe(zlib.createGunzip());
					break;

				case 'deflate':
					dzstream = req.pipe(zlib.createInflate());
					break;

				case undefined:
				default:
					// Un-supported content encoding.
			}
		}

		let chunks = [];
		source.on('data', (chunk) => {
			chunks.push(chunk);
		});
		source.on('end', () => {
			let buf = Buffer.concat(chunks);
			doResponse(buf);
		});
	}
};