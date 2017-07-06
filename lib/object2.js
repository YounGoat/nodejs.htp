var overload2 = require('overload2');

module.exports = {
	clone: function(source) {
		var output = {};
		for (var name in source) {
			if (source.hasOwnProperty(name)) {
				output[name] = source[name];
			}
		}
		return output;
	},

	copyProperties: function(source, target, propertyNames) {
		var iterator = overload2()
			.overload('string', function(name) {
				target[name] = source[name];
			})
			.overload(RegExp, function(re) {
				Object.keys(source).forEach(function(key) {
					if (re.test(key)) {
						target[key] = source[key];
					}
				});
			})
			;
	},

	extend: function(dest, source) {
		var output = {};
		for (var i = 0; i < arguments.length; i++) {
			var item = arguments[i];
			if (!item) continue;
			for (var key in item) {
				if (item.hasOwnProperty(key)) output[key] = item[key];
			}
		}
		return output;
	}
};
