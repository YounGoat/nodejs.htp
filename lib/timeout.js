'use strict';

const MODULE_REQUIRE = 1
	/* built-in */

	/* NPM */

	/* in-package */
	, ERRORS = require('../ERRORS')
	;

function Timeout(settings) {
	this.settings = settings;
	this.timeoutId = {};
	this.performance = {};
	this.startTime = {};
}

Timeout.prototype.start = function(name, callback) {
	let fullname = name + '_TIMEOUT';
	let ms = this.settings[fullname.toLowerCase()];
	this.timeoutId[name] = setTimeout(() => {
		var err = new ERRORS.TIMEOUT(name.toLowerCase(), ms);
		callback(err);
	}, ms);
	this.startTime[name] = Date.now();
};

Timeout.prototype.end = function(name) {
	if (this.startTime.hasOwnProperty(name)) {
		var ms = Date.now() - this.startTime[name];
		if (this.performance[name] instanceof Array) {
			this.performance[name].push(ms);
		}
		else if (typeof this.performance[name] == 'number') {
			this.performance[name] = [ this.performance[name], ms ];
		}
		else {
			this.performance[name] = ms;
		}
	}
	clearTimeout(this.timeoutId[name]);
};

Timeout.prototype.clear = function() {
	for (var name in this.timeoutId) {
		clearTimeout(this.timeoutId[name]);
	}
};

module.exports = Timeout;
