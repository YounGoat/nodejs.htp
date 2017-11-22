#	htp
__Maybe the easiest but still strong http client you have ever meet.__

[![total downloads of htp](https://img.shields.io/npm/dt/htp.svg)](https://www.npmjs.com/package/htp)
[![htp's License](https://img.shields.io/npm/l/htp.svg)](https://www.npmjs.com/package/htp)
[![latest version of htp](https://img.shields.io/npm/v/htp.svg)](https://www.npmjs.com/package/htp)
[![coverage status of github.com/YounGoat/nodejs.htp](https://img.shields.io/coveralls/YounGoat/nodejs.htp/master.svg)](https://coveralls.io/github/YounGoat/nodejs.htp2?branch=master)
[![dependencies of github.com/YounGoat/nodejs.htp](https://david-dm.org/YounGoat/nodejs.htp/status.svg)](https://david-dm.org/YounGoat/nodejs.htp)
[![devDependencies of github.com/YounGoat/nodejs.htp](https://david-dm.org/YounGoat/nodejs.htp/dev-status.svg)](https://david-dm.org/YounGoat/nodejs.htp?type=dev)
[![build status of github.com/YounGoat/nodejs.htp](https://travis-ci.org/YounGoat/nodejs.htp.svg?branch=master)](https://travis-ci.org/YounGoat/nodejs.htp)
[![star github.com/YounGoat/nodejs.htp](https://img.shields.io/github/stars/YounGoat/nodejs.htp.svg?style=social&label=Star)](https://github.com/YounGoat/nodejs.htp/stargazers)

##	Links

*	[CHANGE LOG](./CHANGELOG.md)
*	[Homepage](https://github.com/YounGoat/nodejs.htp)

##	Get Started

```javascript
var htp = requrie('htp');

// GET & callback
htp.get('http://www.example.com/', function(err, response) {
	if (err) {
		// Exception throwed on requesting.
	}
	else {
		// Response received.
		response.statusCode;
		response.statusMessage;
		response.httpVersion;
		response.headers;
		response.body;
		response.bodyBuffer;
		response.bodyDecompressed;
		response.performance;
	}
});

// POST & promise
var data = { username: 'youngoat', password: 'helloworld' };
htp.post('http://www.example.com/login', data).then(function(response) {
	// ...
}).catch(function(err) {
	// ...
});

// Customized settings.
var client = new htp({
	response_timeout: 1000
});
client.request('GET', 'http://www.example.com/', function(err, response) {
	// ...
});
```

##	API

*	[Basic API](#basic-api)
*	[Piping API](#piping-api)
*	[Advanced API](#advanced-api)
*	[Class SimpleAgent](#class-simpleagent)

###	Basic API

```javascript
// To execute request with default settings.
htp(
	/*string*/ REQUSET_METHOD_NAME,
	/*string*/ URL,
	/*OPTIONAL object*/ HEADERS,
	/*OPTIONAL string | object | stream.Readable*/ BODY,
	/*OPTIONAL function*/ CALLBACK
);
```

*	__HEADERS__, __BODY__ and __CALLBACK__ are all optional.
*	*htp* returns `undefined` while __CALLBACK__ offered, otherwise a promise will be returned.
*	*htp* distinguishes arguments by their types and order. However, it may be ambiguous if there is one, but only one object argument offered. What is it regarded as, __HEADERS__ or __BODY__? If the method is defined with explicit payload, the object will be regarded as __BODY__, otherwise it will be regarded as __HEADERS__. See [methods-without-payloads.js](./methods-without-payloads.js) for details.

Another style maybe many coders prefer to is `htp.<lowercase_method_name>( /* ... */ )`, e.g.
```javascript
htp.get('http://www.example.com/', function(error, response) {
	// ...
});
```

Without CALLBACK offered, __htp__ will return a promise.
```javascript
htp.get('http://www.example.com/')
	.then(function(response) { /* ... */ })
	.catch(function(error) { /* ... */ })
	;
```

###	Piping API

Since v0.1.0, a streamable subset __htp.piping__ is available. Whether or not CALLBACK offered, it will always return a readable stream.
```javascript
htp.piping
	.get('http://download.example.com/data.json')
	.pipe(fs.createWriteStream('data.json'))
	;

// A property function named with "piping" prefixed (in camelCase) is equivalent.
htp
	.pipingGet('http://download.example.com/data.json')
	.pipe(fs.createWriteStream('data.json'))
	；
```

###	Advanced API

```javascript
// Create a customized user-agent.
var request = new htp({
	hostname: 'www.example.com',
});

request.get('/index.html', function(err, response) {
	// ...
});
```

Here are options available when creating a customized user agent:

*	__options.protocol__ *ENUM*('http', 'https')  
	Default protocol.

*	__options.hostname__ *string*  
	Default hostname (port excluded).

*	__options.port__ *number*	 
	Default port.

*	__options.piping__ *boolean*  
	If set true, a readable stream will be returned whether or not CALLBACK is present. Otherwise, a promise will be returned when CALLBACK is absent.

*	__options.request_timeout__ *number* (unit: ms)  
	Max time to finish the whole request.  

*	__options.dns_timeout__ *number* (unit: ms)  
	Max time to resolve hostname.  

*	__options.plugin_timeout__ *number* (unit: ms)  
	Max time to plug into socket.

*	__options.connect_timeout__ *number* (unit: ms)  
	Max time to shake-hands with target server.

*	__options.response_timeout__ *number* (unit: ms)  
	Max time to recieve the first response from target server.

*	__options.chunk_timeout__ *number* (unit: ms)  
	Max time two data chunks.

*	__options.data_timeout__ *number* (unit: ms)  
	Max time to receive all data.

See [settings.js](./settings.js) for default values of options.

###	Class SimpleAgent

By creating an instance of __SimpleAgent__, developers are able to create a customized and resuable __htp__.

```javascript
var Agent = require('htp/SimpleAgent');

// Create an instance.
var agent = new Agent({
	endPoint: 'http://www.example.com/'
});

var p = agent.get('/index.html');
p.then(function(bodyBuffer) {
	console.log(bodyBuffer.toString('utf8'));
}).catch(function(err) {
	// ...
});
```

Acceptable options accepted by __htp/SimpleAgent__ are:

*	*string* __endPoint__  
*	*object* __headers__
*	*object* __query__
*	*Function* __beforeRequest__({ method, url, headers, body, callback })  
	If offered, this function will be invoked with an object passed in before real HTTP request starts. The passed in object is made up five properties. The function SHOULD return void or an object made up all or some of the properties. If an object returned, the properties will be used on requesting.