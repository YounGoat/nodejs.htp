'use strict';

const { match } = require('assert');

const MODULE_REQUIRE = 1
	/* built-in */
	, zlib = require('zlib')

	/* NPM */
	, readable2buffer = require('jinang/readable2buffer')

	/* in-package */
	, METHODS_WITHOUT_PAYLOAD = require('../../../methods-without-payload')
	;

module.exports = async function(req, res) {
	let bad = message => {
		console.log(message);
		res.statusMessage = message;
		res.statusCode = 400;
		res.end();
	};

	let data = {};			
	let ok = () => {
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify(data));
	}

	let [ contentType, ext ] = req.headers['content-type'].split(';').map(item => item.trim());

	let buf = await readable2buffer(req);
	let body = buf.toString();
	
	if (contentType == 'application/x-www-urlencoded') {
		let parts = body.split('&');
		parts.forEach(part => {
			let [ name, value ] = part.split('=');
			data[name] = value;
		});
		return ok();
	}

	// @TODO 处理更复杂的请求。
	if (contentType == 'multipart/form-data') {
		let [ , boundary ] = ext && ext.match(/boundary=(.+)$/) || '';
		if (!boundary) return bad('boundary not defined in Content-Type');

		let lines = body.split('\r\n');
		let i = 0;
		while (i < lines.length) {
			let line;

			// First line.
			line = lines[i++];
			if (line == `--${boundary}--`) {
				break;
			}
			if (line != `--${boundary}`) {
				return bad('boundary expected');
			}

			// Second line.
			line = lines[i++];
			let [ , name ] = line.match(/^Content-Disposition: form-data; name="(.+)"$/) || '';
			if (!name) return bad();
			
			// Third line.
			line = lines[i++];
			if (line != '') return bad();

			// Fourth line.
			line = lines[i++];
			let value = line;

			if (typeof data[name] != 'undefined') {
				if (!Array.isArray(data[name])) {
					data[name] = [ data[name] ];
				}
				data[name].push(value);
			}
			else {
				data[name] = value;
			}
		}
		return ok();	
	}

};
