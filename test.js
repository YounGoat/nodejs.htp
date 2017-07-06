'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, fs = require('fs')
	, stream = require('stream')

	/* NPM */


	/* in-package */
	, htp = require('htp')
	;


// var rs = new stream.Readable({
// 	read: function() {
// 	}
// });

// rs.on('data', function(data) {
// 	console.log(data);
// });


// var rs = fs.createReadStream('/Users/jiangjing/JPO/WorkingSpace/Java/JavaExercise/target/classes/car.jpg');

// htp.put('http://localhost:8080/', rs, function(err, entity) {
// 	console.log('out', err);
// 	console.log('out', entity);
// });
//
// rs.push('hello');
// rs.push('hello');
// rs.push('hello');
// rs.push('hello');
//
// rs.push(null);

htp.get('http://www.baidu.com/', function(err, entity) {
	console.log('ERROR', err);
	console.log('ENTITY', Object.keys(entity));
	console.log('performance', entity.performance);
});
