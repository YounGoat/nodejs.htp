/**
 * To find an available socket port.
 * @cite https://gist.github.com/mikeal/1840641
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, net = require('net')
	/* NPM */

	/* in-package */
	;

let portrange = 10000;

function getPort(callback) {
	var port = portrange;
	portrange += 1;

	var server = net.createServer()
	server.listen(port, function (err) {
		server.once('close', function () {
			callback(port);
		})
		server.close();
	});
	server.on('error', function (err) {
		getPort(callback);
	});
}

module.exports = getPort;
