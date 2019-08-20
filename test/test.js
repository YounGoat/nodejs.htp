'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , http = require('http')
    
    /* NPM */
    
    /* in-package */
    , HttpServer = require('./lib/HttpServer')
    ;


// let httpServer = new HttpServer('basic');
// httpServer.start(() => {
//     console.log(httpServer.port);
// });