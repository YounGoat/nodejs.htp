'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , http = require('http')
    
    /* NPM */
    
    /* in-package */
    , getAvailablePort = require('./getAvailablePort')
	;

function Server(name) { 
    this.name = name;

    // Available listening port.
    // 可用的监听端口。
    this.port = null;

    this.server = null;
    this.sockets = new Set();
}

// Start an HTTP server to be connected to.
// 启动测试服务。
Server.prototype.start = function(done) {
    let httpHandler = require('./handlers/' + this.name);

    // Http server to be accessed.
    // 供测试访问的 HTTP 服务。
    this.server = http.createServer(httpHandler);
    this.server.on('connection', socket => this.sockets.add(socket));

    // Get available server port and then start http server.
	getAvailablePort((port) => {
		this.port = port;
		this.server.listen(port);
		done();
	});
};

Server.prototype.stop = function(done) {    
    for (const socket of this.sockets) {
        socket.destroy();
    }
    this.server.close();
    done();
};

// As protocol, hostname and port have been predetermined, this method will generate a URL with pathname supplied.
// 根据预先确定的协议名、主机名和端口号，按照路径生成完整 URL。
Server.prototype.genUrl = function(pathname) {
    return `http://127.0.0.1:${this.port}${pathname}`;
};

module.exports = Server;