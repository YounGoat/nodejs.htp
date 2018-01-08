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

describe('piping mode', function() {
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

	it('events', (done) => {
		let events = [];
		let output = htp.pipingGet(httpServer.genUrl('/streaming'), (err, res) => {
				assert.equal(3, events.length);
				done();
			})
			;

		output
			.on('error', (e) => console.log('error', e))
			.on('dns', (info) => {
				assert(info.address);
				assert(info.family);
				events.push('dns');
			})
			.on('connect', () => events.push('connect'))
			.on('response', (response) => { 
				// console.log(response.statusCode); 
				events.push('response');
			})
			;
	});

	it('pipingOnly', (done) => {
		let output = htp.pipingOnlyGet(httpServer.genUrl('/streaming'), (err, res) => {
			assert.equal(undefined, res.body);
			done();
		})
		;
	});
});
