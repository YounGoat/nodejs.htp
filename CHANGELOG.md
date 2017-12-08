#   htp

Notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning 2.0.0](http://semver.org/).

##	[0.3.0] - Dec 8, 2017

*	Setting *rejectUnauthorized* added.

##	[0.2.0]

###	New

*	Byeond *basic* and *piping* mode, new *pipingOnly* mode is offered.
*	Returned stream in *piping* mode will emit events and may be catched via `on(<eventName>, ...)` method.
*	[README in Simplifed Chinese language](./README.zh_CN.md).

###	Fixed

*	In previous version, `htp/SimpleAgent` will invoke `callback()` (if passed) twice if there is some exception throwed in `callback()` itself.

###	What is difference between *piping* and *pipingOnly* ?

In *piping* mode, you may get data via piping to a writable stream, or reading `response.body` and `response.bodyBuffer` directly in function `callback(err, response)` which is passed as the last argument.

##	[0.1.1] - Nov 23, 2017

###	Fixed

*	In previous versions, __htp__ cannot recognized some key fields in response headers if their names are not lowercased. 

##	[0.1.0] - 2017-11-12

###	Milestone

Now， __htp__ is streamable. E.g.  
```javascript
htp.piping.get('http://www.example.com/').pipe(fs.createWriteStream('index.html'));
```

##	[0.0.5] - 2017-11

__htp/sSimpleAgent__ added.

##	[0.0.4] - 2017-10

Add new *action* property to Errors throwed. Value of the property is made up of the method name and the url joined with a whitespace, e.g.
```javascript
htp.get('http://www.example.com/', function(err, response) {
	if (err) {
		err.action == 'GET http://www.example.com/'; // true
	}
});
```

##  [0.0.3] - 2017-09

No promise created or returned when callback() functions offered.

##	[0.0.2] - 2017-07, https

HTTPS requests are supported.

##	[0.0.1] - 2017-07

Released.

---
This CHANGELOG.md follows [*Keep a CHANGELOG*](http://keepachangelog.com/).
