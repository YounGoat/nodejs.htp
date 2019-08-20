'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    , http = require('http')
    
    /* NPM */
    , cloneObject = require('jinang/cloneObject')
    , jointString = require('jinang/jointString')
    , modifyUrl = require('jinang/modifyUrl')
    
    /* in-package */
    , htp = require('./htp')
    , METHODS_WITHOUT_PAYLOAD = require('./methods-without-payload')
    , once = require('./lib/once')
    ;

/**
 * 
 * @param {object}   options 
 * @param {Function} options.beforeRequest
 * @param {string}   options.endPoint
 * @param {object}   options.headers
 * @param {object}   options.query
 * @param {object}   options.settings
 */
function SimpleAgent(options) {
	// Clone and uniform the input options.
    this.options = cloneObject(options, (key, value) => [ key.toLowerCase(), value ]);

    if (this.options.settings) {
        this.htp = new htp(this.options.settings);
    }
    else {
        this.htp = htp;
    }
}

SimpleAgent.prototype.request = function(method, urlname, headers, body, callback) {
    // ---------------------------
    // Uniform arguments.   

    // Will be re-assigned if exist.
    headers = null;
    body = null;
    callback = null;

    if (arguments.length < 2) {
        throw new Error('too less arguments: (method, urlname) is necessary');
    }

    if (arguments.length > 5) {
        throw new Error('too may arguments: no more than (method, urlname [, headers] [, body] [, callback])');
    }

    // method & urlname are necessary.
    // So, args.length <= 5 - 2
    let args = Array.from(arguments).slice(2);
    for (var i = args.length - 1; i >= 0; i--) {
        if (args[i] === null || args[i] === undefined) {
            args.pop();
        }
        else if (typeof args[i] == 'function') {
            callback = args.pop();
        }
        else {
            break;
        }
    }

    // N == null, U == undefined, T == type
    let isNUT = (index, type) => {
        let value = args[index];
        return value === null || value === undefined || typeof value == type;
    }

    const METHOD = method.toUpperCase();
    if (!http.METHODS.includes(METHOD)) {
        throw new Error(`invalid method name: ${method}`);
    }

    if (typeof urlname != 'string') {
        throw new Error(`invalid url: ${urlname}`);
    }
    
    if (METHODS_WITHOUT_PAYLOAD.includes(METHOD)) {
        body = null;
        let argumentsError = new Error(`invalid arguments, ("${method}", urlname [, headers] [,callback]) needed`);
        switch(args.length) {
            case 3:
            case 2:
                throw argumentsError;

            case 1:
                if (typeof args[0] == 'object') {
                    [ headers ] = args;
                }
                else {
                    throw argumentsError;
                }
                break;

            case 0:
                break;
        }
    }
    else {
        let argumentsError = new Error(`invalid arguments, ("${method}", urlname [, headers], body [,callback]) needed`);
        switch (args.length) {
            case 3:
                throw argumentsError;

            case 2:
                if (isNUT(0, 'object')) {
                    [ headers, body ] = args;
                }
                else {
                    throw argumentsError;
                }
                break;
        
            case 1:
                [ body ] = args;
                break;
        }
    }

    // ---------------------------
    // Main process.

    if (this.options.endpoint) {
        urlname = jointString('/', this.options.endpoint, urlname);
    }

    if (this.options.query) {
        urlname = modifyUrl.query(urlname, this.options.query);
    }

    if (this.options.beforerequest) {
        let ret = this.options.beforerequest({
            method,
            urlname,
            url: urlname,
            headers,
            body,
            callback
        });

        if (ret) {
            if (ret.hasOwnProperty('method'))     method = ret.method;
            if (ret.hasOwnProperty('url'))       urlname = ret.url;
            if (ret.hasOwnProperty('urlname'))   urlname = ret.urlname;
            if (ret.hasOwnProperty('headers'))   headers = ret.headers;
            if (ret.hasOwnProperty('body'))         body = ret.body;
            if (ret.hasOwnProperty('callback')) callback = ret.callback;
        }
    }    

    // ---------------------------

    let agentCallback = callback, beforeCallback = this.options.beforecallback;
    if (callback && beforeCallback) {
        agentCallback = (err, response) => {
            try {
                let ret = beforeCallback(err, response);
                callback(null, ret);
            } catch(ex) {
                callback(ex);
            }
        };
    }

    let ret = null;
    if (1) {
        let args = [ method, urlname ];
        
        if (this.options.headers || headers) {
            headers = Object.assign({}, headers, this.options.headers);
            args.push(headers);
        }

        if (body !== null) {
            args.push(body);
        }

        if (agentCallback) {
            args.push(agentCallback);
        }

        ret = this.htp.request.apply(this.htp, args);
    }

    if (ret instanceof Promise && beforeCallback) {
        ret = ret
            .then(response => {
                return beforeCallback(null, response);
            })
            .catch(err => {
                beforeCallback(err);
            });
    }

    return ret;
};

// According HTTP methods' names, add homonymous method to the prototype.
http.METHODS.forEach((METHOD_NAME) => {
    let name = METHOD_NAME.toLowerCase();
    if (METHODS_WITHOUT_PAYLOAD.includes(METHOD_NAME)) {
        
        /**
         * @param  {string}    pathname
         * @param  {object}   [headers]
         * @param  {function} [callback]
         */
        SimpleAgent.prototype[name] = function(pathname, headers, callback) {
            return this.request(METHOD_NAME, pathname, headers, callback);
        };
    }
    else {
        /**
         * @param  {string}    pathname
         * @param  {object}   [headers]
         * @param  {*}         body
         * @param  {function} [callback]
         */
        SimpleAgent.prototype[name] = function(pathname, headers, body, callback) {
            return this.request(METHOD_NAME, pathname, headers, body, callback);
        }
    }
});


module.exports = SimpleAgent;