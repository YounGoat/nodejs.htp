function declareException(name, parent, constructorFunction) {
	if (!parent) parent = Error;

	var Ex = function(/*String*/ message) {
		this.name = name;

		if (constructorFunction) {
			constructorFunction.apply(this, arguments);
		}
		else {
			this.message = message;
		}

		/* eslint-disable new-cap */
		var err = new parent;
		/* eslint-enable new-cap */
		this.stack = [ this.name + ': ' + this.message ].concat(err.stack.split('\n').slice(2)).join('\n');
	};

	Ex.prototype = Object.create(parent.prototype);
	Ex.prototype.consturctor = Ex;
	// Ex.prototype.toString = Ex.prototype.valueOf = function() {
	// 	return '[' + this.name + ': ' + this.message + ']';
	// };

	Object.defineProperty(Ex, 'name', { value: name });

	return Ex;
};

module.exports = declareException;
