#   htp

Notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning 2.0.0](http://semver.org/).

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
