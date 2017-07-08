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
