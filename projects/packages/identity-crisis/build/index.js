/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../../node_modules/.pnpm/classnames@2.3.2/node_modules/classnames/index.js":
/*!*************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/classnames@2.3.2/node_modules/classnames/index.js ***!
  \*************************************************************************************/
/***/ ((module, exports) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
	Copyright (c) 2018 Jed Watson.
	Licensed under the MIT License (MIT), see
	http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;
	var nativeCodeString = '[native code]';

	function classNames() {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				if (arg.length) {
					var inner = classNames.apply(null, arg);
					if (inner) {
						classes.push(inner);
					}
				}
			} else if (argType === 'object') {
				if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
					classes.push(arg.toString());
					continue;
				}

				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if ( true && module.exports) {
		classNames.default = classNames;
		module.exports = classNames;
	} else if (true) {
		// register as 'classnames', consistent with npm package name
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
			return classNames;
		}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}());


/***/ }),

/***/ "../../../node_modules/.pnpm/debug@4.3.4/node_modules/debug/src/browser.js":
/*!*********************************************************************************!*\
  !*** ../../../node_modules/.pnpm/debug@4.3.4/node_modules/debug/src/browser.js ***!
  \*********************************************************************************/
/***/ ((module, exports, __webpack_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(/*! ./common */ "../../../node_modules/.pnpm/debug@4.3.4/node_modules/debug/src/common.js")(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ "../../../node_modules/.pnpm/debug@4.3.4/node_modules/debug/src/common.js":
/*!********************************************************************************!*\
  !*** ../../../node_modules/.pnpm/debug@4.3.4/node_modules/debug/src/common.js ***!
  \********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(/*! ms */ "../../../node_modules/.pnpm/ms@2.1.2/node_modules/ms/index.js");
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ "../../js-packages/components/components/spinner/style.scss":
/*!******************************************************************!*\
  !*** ../../js-packages/components/components/spinner/style.scss ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "../../js-packages/idc/components/error-message/style.scss":
/*!*****************************************************************!*\
  !*** ../../js-packages/idc/components/error-message/style.scss ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "../../js-packages/idc/components/idc-screen/style.scss":
/*!**************************************************************!*\
  !*** ../../js-packages/idc/components/idc-screen/style.scss ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "../../js-packages/idc/components/safe-mode/style.scss":
/*!*************************************************************!*\
  !*** ../../js-packages/idc/components/safe-mode/style.scss ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/_inc/admin-bar.scss":
/*!*********************************!*\
  !*** ./src/_inc/admin-bar.scss ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/_inc/style.scss":
/*!*****************************!*\
  !*** ./src/_inc/style.scss ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "../../../node_modules/.pnpm/ms@2.1.2/node_modules/ms/index.js":
/*!*********************************************************************!*\
  !*** ../../../node_modules/.pnpm/ms@2.1.2/node_modules/ms/index.js ***!
  \*********************************************************************/
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ "../../../node_modules/.pnpm/object-assign@4.1.1/node_modules/object-assign/index.js":
/*!*******************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/object-assign@4.1.1/node_modules/object-assign/index.js ***!
  \*******************************************************************************************/
/***/ ((module) => {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),

/***/ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/checkPropTypes.js":
/*!***********************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/checkPropTypes.js ***!
  \***********************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var printWarning = function() {};

if (true) {
  var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js");
  var loggedTypeFailures = {};
  var has = __webpack_require__(/*! ./lib/has */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/has.js");

  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) { /**/ }
  };
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (true) {
    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            var err = Error(
              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' +
              'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
            );
            err.name = 'Invariant Violation';
            throw err;
          }
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        if (error && !(error instanceof Error)) {
          printWarning(
            (componentName || 'React class') + ': type specification of ' +
            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
            'You may have forgotten to pass an argument to the type checker ' +
            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
            'shape all require an argument).'
          );
        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          printWarning(
            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
          );
        }
      }
    }
  }
}

/**
 * Resets warning cache when testing.
 *
 * @private
 */
checkPropTypes.resetWarningCache = function() {
  if (true) {
    loggedTypeFailures = {};
  }
}

module.exports = checkPropTypes;


/***/ }),

/***/ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/factoryWithTypeCheckers.js":
/*!********************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/factoryWithTypeCheckers.js ***!
  \********************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactIs = __webpack_require__(/*! react-is */ "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js");
var assign = __webpack_require__(/*! object-assign */ "../../../node_modules/.pnpm/object-assign@4.1.1/node_modules/object-assign/index.js");

var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js");
var has = __webpack_require__(/*! ./lib/has */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/has.js");
var checkPropTypes = __webpack_require__(/*! ./checkPropTypes */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/checkPropTypes.js");

var printWarning = function() {};

if (true) {
  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

function emptyFunctionThatReturnsNull() {
  return null;
}

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bigint: createPrimitiveTypeChecker('bigint'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    elementType: createElementTypeTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message, data) {
    this.message = message;
    this.data = data && typeof data === 'object' ? data: {};
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (true) {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          var err = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
          err.name = 'Invariant Violation';
          throw err;
        } else if ( true && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            printWarning(
              'You are manually calling a React.PropTypes validation ' +
              'function for the `' + propFullName + '` prop on `' + componentName + '`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError(
          'Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'),
          {expectedType: expectedType}
        );
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!ReactIs.isValidElementType(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      if (true) {
        if (arguments.length > 1) {
          printWarning(
            'Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' +
            'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
          );
        } else {
          printWarning('Invalid argument supplied to oneOf, expected an array.');
        }
      }
      return emptyFunctionThatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
        var type = getPreciseType(value);
        if (type === 'symbol') {
          return String(value);
        }
        return value;
      });
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (has(propValue, key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
       true ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : 0;
      return emptyFunctionThatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        printWarning(
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
        );
        return emptyFunctionThatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      var expectedTypes = [];
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        var checkerResult = checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
        if (checkerResult == null) {
          return null;
        }
        if (checkerResult.data && has(checkerResult.data, 'expectedType')) {
          expectedTypes.push(checkerResult.data.expectedType);
        }
      }
      var expectedTypesMessage = (expectedTypes.length > 0) ? ', expected one of type [' + expectedTypes.join(', ') + ']': '';
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`' + expectedTypesMessage + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function invalidValidatorError(componentName, location, propFullName, key, type) {
    return new PropTypeError(
      (componentName || 'React class') + ': ' + location + ' type `' + propFullName + '.' + key + '` is invalid; ' +
      'it must be a function, usually from the `prop-types` package, but received `' + type + '`.'
    );
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (typeof checker !== 'function') {
          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (has(shapeTypes, key) && typeof checker !== 'function') {
          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
        }
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // falsy value can't be a Symbol
    if (!propValue) {
      return false;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),

/***/ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js":
/*!**************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js ***!
  \**************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (true) {
  var ReactIs = __webpack_require__(/*! react-is */ "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js");

  // By explicitly using `prop-types` you are opting into new development behavior.
  // http://fb.me/prop-types-in-prod
  var throwOnDirectAccess = true;
  module.exports = __webpack_require__(/*! ./factoryWithTypeCheckers */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/factoryWithTypeCheckers.js")(ReactIs.isElement, throwOnDirectAccess);
} else {}


/***/ }),

/***/ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js":
/*!*********************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js ***!
  \*********************************************************************************************************/
/***/ ((module) => {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


/***/ }),

/***/ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/has.js":
/*!****************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/has.js ***!
  \****************************************************************************************/
/***/ ((module) => {

module.exports = Function.call.bind(Object.prototype.hasOwnProperty);


/***/ }),

/***/ "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/cjs/react-is.development.js":
/*!******************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/cjs/react-is.development.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */





if (true) {
  (function() {
'use strict';

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?

var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

function isValidElementType(type) {
  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
}

function typeOf(object) {
  if (typeof object === 'object' && object !== null) {
    var $$typeof = object.$$typeof;

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        var type = object.type;

        switch (type) {
          case REACT_ASYNC_MODE_TYPE:
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
            return type;

          default:
            var $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;

              default:
                return $$typeof;
            }

        }

      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
} // AsyncMode is deprecated along with isAsyncMode

var AsyncMode = REACT_ASYNC_MODE_TYPE;
var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
var ContextConsumer = REACT_CONTEXT_TYPE;
var ContextProvider = REACT_PROVIDER_TYPE;
var Element = REACT_ELEMENT_TYPE;
var ForwardRef = REACT_FORWARD_REF_TYPE;
var Fragment = REACT_FRAGMENT_TYPE;
var Lazy = REACT_LAZY_TYPE;
var Memo = REACT_MEMO_TYPE;
var Portal = REACT_PORTAL_TYPE;
var Profiler = REACT_PROFILER_TYPE;
var StrictMode = REACT_STRICT_MODE_TYPE;
var Suspense = REACT_SUSPENSE_TYPE;
var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

function isAsyncMode(object) {
  {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
    }
  }

  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}
function isConcurrentMode(object) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
function isContextConsumer(object) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
function isContextProvider(object) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
function isElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function isForwardRef(object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
function isFragment(object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
function isLazy(object) {
  return typeOf(object) === REACT_LAZY_TYPE;
}
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}
function isPortal(object) {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
function isProfiler(object) {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
function isStrictMode(object) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
function isSuspense(object) {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}

exports.AsyncMode = AsyncMode;
exports.ConcurrentMode = ConcurrentMode;
exports.ContextConsumer = ContextConsumer;
exports.ContextProvider = ContextProvider;
exports.Element = Element;
exports.ForwardRef = ForwardRef;
exports.Fragment = Fragment;
exports.Lazy = Lazy;
exports.Memo = Memo;
exports.Portal = Portal;
exports.Profiler = Profiler;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.isAsyncMode = isAsyncMode;
exports.isConcurrentMode = isConcurrentMode;
exports.isContextConsumer = isContextConsumer;
exports.isContextProvider = isContextProvider;
exports.isElement = isElement;
exports.isForwardRef = isForwardRef;
exports.isFragment = isFragment;
exports.isLazy = isLazy;
exports.isMemo = isMemo;
exports.isPortal = isPortal;
exports.isProfiler = isProfiler;
exports.isStrictMode = isStrictMode;
exports.isSuspense = isSuspense;
exports.isValidElementType = isValidElementType;
exports.typeOf = typeOf;
  })();
}


/***/ }),

/***/ "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js":
/*!***********************************************************************************!*\
  !*** ../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js ***!
  \***********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


if (false) {} else {
  module.exports = __webpack_require__(/*! ./cjs/react-is.development.js */ "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/cjs/react-is.development.js");
}


/***/ }),

/***/ "../../js-packages/analytics/index.jsx":
/*!*********************************************!*\
  !*** ../../js-packages/analytics/index.jsx ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! debug */ "../../../node_modules/.pnpm/debug@4.3.4/node_modules/debug/src/browser.js");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(debug__WEBPACK_IMPORTED_MODULE_0__);

const debug = debug__WEBPACK_IMPORTED_MODULE_0___default()('dops:analytics');
let _superProps, _user;

// Load tracking scripts
window._tkq = window._tkq || [];
window.ga = window.ga || function () {
  (window.ga.q = window.ga.q || []).push(arguments);
};
window.ga.l = +new Date();

// loadScript( '//stats.wp.com/w.js?48' );
// loadScript( '//www.google-analytics.com/analytics.js' );

/**
 * Build a query string
 *
 * @param {string} group - the group
 * @param {string} name - the name
 * @returns {string} - the uricomponent
 */
function buildQuerystring(group, name) {
  let uriComponent = '';
  if ('object' === typeof group) {
    for (const key in group) {
      uriComponent += '&x_' + encodeURIComponent(key) + '=' + encodeURIComponent(group[key]);
    }
    debug('Bumping stats %o', group);
  } else {
    uriComponent = '&x_' + encodeURIComponent(group) + '=' + encodeURIComponent(name);
    debug('Bumping stat "%s" in group "%s"', name, group);
  }
  return uriComponent;
}

/**
 * Build a query string with no prefix
 *
 * @param {string} group - the group
 * @param {string} name - the name
 * @returns {string} - the uricomponent
 */
function buildQuerystringNoPrefix(group, name) {
  let uriComponent = '';
  if ('object' === typeof group) {
    for (const key in group) {
      uriComponent += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(group[key]);
    }
    debug('Built stats %o', group);
  } else {
    uriComponent = '&' + encodeURIComponent(group) + '=' + encodeURIComponent(name);
    debug('Built stat "%s" in group "%s"', name, group);
  }
  return uriComponent;
}
const analytics = {
  initialize: function (userId, username, superProps) {
    analytics.setUser(userId, username);
    analytics.setSuperProps(superProps);
    analytics.identifyUser();
  },
  setGoogleAnalyticsEnabled: function (googleAnalyticsEnabled) {
    let googleAnalyticsKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    this.googleAnalyticsEnabled = googleAnalyticsEnabled;
    this.googleAnalyticsKey = googleAnalyticsKey;
  },
  setMcAnalyticsEnabled: function (mcAnalyticsEnabled) {
    this.mcAnalyticsEnabled = mcAnalyticsEnabled;
  },
  setUser: function (userId, username) {
    _user = {
      ID: userId,
      username: username
    };
  },
  setSuperProps: function (superProps) {
    _superProps = superProps;
  },
  /**
   * Add global properties to be applied to all "tracks" events.
   * This function will add the new properties, overwrite the existing one.
   * Unlike `setSuperProps()`, it will not replace the whole object.
   *
   * @param {object} props - Super props to add.
   */
  assignSuperProps: function (props) {
    _superProps = Object.assign(_superProps || {}, props);
  },
  mc: {
    bumpStat: function (group, name) {
      const uriComponent = buildQuerystring(group, name); // prints debug info
      if (analytics.mcAnalyticsEnabled) {
        new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?v=wpcom-no-pv' + uriComponent + '&t=' + Math.random();
      }
    },
    bumpStatWithPageView: function (group, name) {
      // this function is fairly dangerous, as it bumps page views for wpcom and should only be called in very specific cases.
      const uriComponent = buildQuerystringNoPrefix(group, name); // prints debug info
      if (analytics.mcAnalyticsEnabled) {
        new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?v=wpcom' + uriComponent + '&t=' + Math.random();
      }
    }
  },
  // pageView is a wrapper for pageview events across Tracks and GA
  pageView: {
    record: function (urlPath, pageTitle) {
      analytics.tracks.recordPageView(urlPath);
      analytics.ga.recordPageView(urlPath, pageTitle);
    }
  },
  purchase: {
    record: function (transactionId, itemName, itemId, revenue, price, qty, currency) {
      analytics.ga.recordPurchase(transactionId, itemName, itemId, revenue, price, qty, currency);
    }
  },
  tracks: {
    recordEvent: function (eventName, eventProperties) {
      eventProperties = eventProperties || {};
      if (eventName.indexOf('akismet_') !== 0 && eventName.indexOf('jetpack_') !== 0) {
        debug('- Event name must be prefixed by "akismet_" or "jetpack_"');
        return;
      }
      if (_superProps) {
        debug('- Super Props: %o', _superProps);
        eventProperties = Object.assign(eventProperties, _superProps);
      }
      debug('Record event "%s" called with props %s', eventName, JSON.stringify(eventProperties));
      window._tkq.push(['recordEvent', eventName, eventProperties]);
    },
    recordJetpackClick: function (target) {
      const props = 'object' === typeof target ? target : {
        target: target
      };
      analytics.tracks.recordEvent('jetpack_wpa_click', props);
    },
    recordPageView: function (urlPath) {
      analytics.tracks.recordEvent('akismet_page_view', {
        path: urlPath
      });
    },
    setOptOut: function (isOptingOut) {
      debug('Pushing setOptOut: %o', isOptingOut);
      window._tkq.push(['setOptOut', isOptingOut]);
    }
  },
  // Google Analytics usage and event stat tracking
  ga: {
    initialized: false,
    initialize: function () {
      let parameters = {};
      if (!analytics.ga.initialized) {
        if (_user) {
          parameters = {
            userId: 'u-' + _user.ID
          };
        }
        window.ga('create', this.googleAnalyticsKey, 'auto', parameters);
        analytics.ga.initialized = true;
      }
    },
    recordPageView: function (urlPath, pageTitle) {
      analytics.ga.initialize();
      debug('Recording Page View ~ [URL: ' + urlPath + '] [Title: ' + pageTitle + ']');
      if (this.googleAnalyticsEnabled) {
        // Set the current page so all GA events are attached to it.
        window.ga('set', 'page', urlPath);
        window.ga('send', {
          hitType: 'pageview',
          page: urlPath,
          title: pageTitle
        });
      }
    },
    recordEvent: function (category, action, label, value) {
      analytics.ga.initialize();
      let debugText = 'Recording Event ~ [Category: ' + category + '] [Action: ' + action + ']';
      if ('undefined' !== typeof label) {
        debugText += ' [Option Label: ' + label + ']';
      }
      if ('undefined' !== typeof value) {
        debugText += ' [Option Value: ' + value + ']';
      }
      debug(debugText);
      if (this.googleAnalyticsEnabled) {
        window.ga('send', 'event', category, action, label, value);
      }
    },
    recordPurchase: function (transactionId, itemName, itemId, revenue, price, qty, currency) {
      window.ga('require', 'ecommerce');
      window.ga('ecommerce:addTransaction', {
        id: transactionId,
        // Transaction ID. Required.
        // 'affiliation': 'Acme Clothing',   // Affiliation or store name.
        revenue: revenue,
        // Grand Total.
        // 'tax': '1.29',                     // Tax.
        currency: currency // local currency code.
      });

      window.ga('ecommerce:addItem', {
        id: transactionId,
        // Transaction ID. Required.
        name: itemName,
        // Product name. Required.
        sku: itemId,
        // SKU/code.
        // 'category': 'Party Toys',         // Category or variation.
        price: price,
        // Unit price.
        quantity: qty // Quantity.
      });

      window.ga('ecommerce:send');
    }
  },
  identifyUser: function () {
    // Don't identify the user if we don't have one
    if (_user) {
      window._tkq.push(['identifyUser', _user.ID, _user.username]);
    }
  },
  setProperties: function (properties) {
    window._tkq.push(['setProperties', properties]);
  },
  clearedIdentity: function () {
    window._tkq.push(['clearIdentity']);
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (analytics);

/***/ }),

/***/ "../../js-packages/api/index.jsx":
/*!***************************************!*\
  !*** ../../js-packages/api/index.jsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Api404AfterRedirectError": () => (/* binding */ Api404AfterRedirectError),
/* harmony export */   "Api404Error": () => (/* binding */ Api404Error),
/* harmony export */   "FetchNetworkError": () => (/* binding */ FetchNetworkError),
/* harmony export */   "JsonParseAfterRedirectError": () => (/* binding */ JsonParseAfterRedirectError),
/* harmony export */   "JsonParseError": () => (/* binding */ JsonParseError),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @automattic/jetpack-config */ "../../js-packages/config/src/index.js");
/* harmony import */ var _automattic_jetpack_config__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_automattic_jetpack_config__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/url */ "@wordpress/url");
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_url__WEBPACK_IMPORTED_MODULE_1__);



/**
 * Helps create new custom error classes to better notify upper layers.
 *
 * @param {string} name - the Error name that will be availble in Error.name
 * @returns {Error}      a new custom error class.
 */
function createCustomError(name) {
  class CustomError extends Error {
    constructor() {
      super(...arguments);
      this.name = name;
    }
  }
  return CustomError;
}
const JsonParseError = createCustomError('JsonParseError');
const JsonParseAfterRedirectError = createCustomError('JsonParseAfterRedirectError');
const Api404Error = createCustomError('Api404Error');
const Api404AfterRedirectError = createCustomError('Api404AfterRedirectError');
const FetchNetworkError = createCustomError('FetchNetworkError');

/**
 * Create a Jetpack Rest Api Client
 *
 * @param {string} root - The API root
 * @param {string} nonce - The API Nonce
 */
function JetpackRestApiClient(root, nonce) {
  let apiRoot = root,
    wpcomOriginApiUrl = root,
    headers = {
      'X-WP-Nonce': nonce
    },
    getParams = {
      credentials: 'same-origin',
      headers
    },
    postParams = {
      method: 'post',
      credentials: 'same-origin',
      headers: Object.assign({}, headers, {
        'Content-type': 'application/json'
      })
    },
    cacheBusterCallback = addCacheBuster;
  const methods = {
    setApiRoot(newRoot) {
      apiRoot = newRoot;
    },
    /**
     * Sets API root for search endpoints.
     * They are routed through wpcom API for wpcom simple sites,
     * so we add `/wp-json/wpcom-origin/` to this path on wpcom.
     * For non-wpcom sites, this is the same as apiRoot.
     *
     * @param {string} newRoot - API root for search endpoints.
     */
    setWpcomOriginApiUrl(newRoot) {
      wpcomOriginApiUrl = newRoot;
    },
    setApiNonce(newNonce) {
      headers = {
        'X-WP-Nonce': newNonce
      };
      getParams = {
        credentials: 'same-origin',
        headers: headers
      };
      postParams = {
        method: 'post',
        credentials: 'same-origin',
        headers: Object.assign({}, headers, {
          'Content-type': 'application/json'
        })
      };
    },
    setCacheBusterCallback: callback => {
      cacheBusterCallback = callback;
    },
    registerSite: (registrationNonce, redirectUri) => {
      const params = {
        registration_nonce: registrationNonce,
        no_iframe: true
      };
      if ((0,_automattic_jetpack_config__WEBPACK_IMPORTED_MODULE_0__.jetpackConfigHas)('consumer_slug')) {
        params.plugin_slug = (0,_automattic_jetpack_config__WEBPACK_IMPORTED_MODULE_0__.jetpackConfigGet)('consumer_slug');
      }
      if (null !== redirectUri) {
        params.redirect_uri = redirectUri;
      }
      return postRequest(`${apiRoot}jetpack/v4/connection/register`, postParams, {
        body: JSON.stringify(params)
      }).then(checkStatus).then(parseJsonResponse);
    },
    fetchAuthorizationUrl: redirectUri => getRequest((0,_wordpress_url__WEBPACK_IMPORTED_MODULE_1__.addQueryArgs)(`${apiRoot}jetpack/v4/connection/authorize_url`, {
      no_iframe: '1',
      redirect_uri: redirectUri
    }), getParams).then(checkStatus).then(parseJsonResponse),
    fetchSiteConnectionData: () => getRequest(`${apiRoot}jetpack/v4/connection/data`, getParams).then(parseJsonResponse),
    fetchSiteConnectionStatus: () => getRequest(`${apiRoot}jetpack/v4/connection`, getParams).then(parseJsonResponse),
    fetchSiteConnectionTest: () => getRequest(`${apiRoot}jetpack/v4/connection/test`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchUserConnectionData: () => getRequest(`${apiRoot}jetpack/v4/connection/data`, getParams).then(parseJsonResponse),
    fetchUserTrackingSettings: () => getRequest(`${apiRoot}jetpack/v4/tracking/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateUserTrackingSettings: newSettings => postRequest(`${apiRoot}jetpack/v4/tracking/settings`, postParams, {
      body: JSON.stringify(newSettings)
    }).then(checkStatus).then(parseJsonResponse),
    disconnectSite: () => postRequest(`${apiRoot}jetpack/v4/connection`, postParams, {
      body: JSON.stringify({
        isActive: false
      })
    }).then(checkStatus).then(parseJsonResponse),
    fetchConnectUrl: () => getRequest(`${apiRoot}jetpack/v4/connection/url`, getParams).then(checkStatus).then(parseJsonResponse),
    unlinkUser: () => postRequest(`${apiRoot}jetpack/v4/connection/user`, postParams, {
      body: JSON.stringify({
        linked: false
      })
    }).then(checkStatus).then(parseJsonResponse),
    reconnect: () => postRequest(`${apiRoot}jetpack/v4/connection/reconnect`, postParams).then(checkStatus).then(parseJsonResponse),
    fetchConnectedPlugins: () => getRequest(`${apiRoot}jetpack/v4/connection/plugins`, getParams).then(checkStatus).then(parseJsonResponse),
    setHasSeenWCConnectionModal: () => postRequest(`${apiRoot}jetpack/v4/seen-wc-connection-modal`, postParams).then(checkStatus).then(parseJsonResponse),
    fetchModules: () => getRequest(`${apiRoot}jetpack/v4/module/all`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchModule: slug => getRequest(`${apiRoot}jetpack/v4/module/${slug}`, getParams).then(checkStatus).then(parseJsonResponse),
    activateModule: slug => postRequest(`${apiRoot}jetpack/v4/module/${slug}/active`, postParams, {
      body: JSON.stringify({
        active: true
      })
    }).then(checkStatus).then(parseJsonResponse),
    deactivateModule: slug => postRequest(`${apiRoot}jetpack/v4/module/${slug}/active`, postParams, {
      body: JSON.stringify({
        active: false
      })
    }),
    updateModuleOptions: (slug, newOptionValues) => postRequest(`${apiRoot}jetpack/v4/module/${slug}`, postParams, {
      body: JSON.stringify(newOptionValues)
    }).then(checkStatus).then(parseJsonResponse),
    updateSettings: newOptionValues => postRequest(`${apiRoot}jetpack/v4/settings`, postParams, {
      body: JSON.stringify(newOptionValues)
    }).then(checkStatus).then(parseJsonResponse),
    getProtectCount: () => getRequest(`${apiRoot}jetpack/v4/module/protect/data`, getParams).then(checkStatus).then(parseJsonResponse),
    resetOptions: options => postRequest(`${apiRoot}jetpack/v4/options/${options}`, postParams, {
      body: JSON.stringify({
        reset: true
      })
    }).then(checkStatus).then(parseJsonResponse),
    activateVaultPress: () => postRequest(`${apiRoot}jetpack/v4/plugins`, postParams, {
      body: JSON.stringify({
        slug: 'vaultpress',
        status: 'active'
      })
    }).then(checkStatus).then(parseJsonResponse),
    getVaultPressData: () => getRequest(`${apiRoot}jetpack/v4/module/vaultpress/data`, getParams).then(checkStatus).then(parseJsonResponse),
    installPlugin: (slug, source) => {
      const props = {
        slug,
        status: 'active'
      };
      if (source) {
        props.source = source;
      }
      return postRequest(`${apiRoot}jetpack/v4/plugins`, postParams, {
        body: JSON.stringify(props)
      }).then(checkStatus).then(parseJsonResponse);
    },
    activateAkismet: () => postRequest(`${apiRoot}jetpack/v4/plugins`, postParams, {
      body: JSON.stringify({
        slug: 'akismet',
        status: 'active'
      })
    }).then(checkStatus).then(parseJsonResponse),
    getAkismetData: () => getRequest(`${apiRoot}jetpack/v4/module/akismet/data`, getParams).then(checkStatus).then(parseJsonResponse),
    checkAkismetKey: () => getRequest(`${apiRoot}jetpack/v4/module/akismet/key/check`, getParams).then(checkStatus).then(parseJsonResponse),
    checkAkismetKeyTyped: apiKey => postRequest(`${apiRoot}jetpack/v4/module/akismet/key/check`, postParams, {
      body: JSON.stringify({
        api_key: apiKey
      })
    }).then(checkStatus).then(parseJsonResponse),
    fetchStatsData: range => getRequest(statsDataUrl(range), getParams).then(checkStatus).then(parseJsonResponse).then(handleStatsResponseError),
    getPluginUpdates: () => getRequest(`${apiRoot}jetpack/v4/updates/plugins`, getParams).then(checkStatus).then(parseJsonResponse),
    getPlans: () => getRequest(`${apiRoot}jetpack/v4/plans`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchSettings: () => getRequest(`${apiRoot}jetpack/v4/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateSetting: updatedSetting => postRequest(`${apiRoot}jetpack/v4/settings`, postParams, {
      body: JSON.stringify(updatedSetting)
    }).then(checkStatus).then(parseJsonResponse),
    fetchSiteData: () => getRequest(`${apiRoot}jetpack/v4/site`, getParams).then(checkStatus).then(parseJsonResponse).then(body => JSON.parse(body.data)),
    fetchSiteFeatures: () => getRequest(`${apiRoot}jetpack/v4/site/features`, getParams).then(checkStatus).then(parseJsonResponse).then(body => JSON.parse(body.data)),
    fetchSiteProducts: () => getRequest(`${apiRoot}jetpack/v4/site/products`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchSitePurchases: () => getRequest(`${apiRoot}jetpack/v4/site/purchases`, getParams).then(checkStatus).then(parseJsonResponse).then(body => JSON.parse(body.data)),
    fetchSiteBenefits: () => getRequest(`${apiRoot}jetpack/v4/site/benefits`, getParams).then(checkStatus).then(parseJsonResponse).then(body => JSON.parse(body.data)),
    fetchSiteDiscount: () => getRequest(`${apiRoot}jetpack/v4/site/discount`, getParams).then(checkStatus).then(parseJsonResponse).then(body => body.data),
    fetchSetupQuestionnaire: () => getRequest(`${apiRoot}jetpack/v4/setup/questionnaire`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsData: () => getRequest(`${apiRoot}jetpack/v4/recommendations/data`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsProductSuggestions: () => getRequest(`${apiRoot}jetpack/v4/recommendations/product-suggestions`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsUpsell: () => getRequest(`${apiRoot}jetpack/v4/recommendations/upsell`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsConditional: () => getRequest(`${apiRoot}jetpack/v4/recommendations/conditional`, getParams).then(checkStatus).then(parseJsonResponse),
    saveRecommendationsData: data => postRequest(`${apiRoot}jetpack/v4/recommendations/data`, postParams, {
      body: JSON.stringify({
        data
      })
    }).then(checkStatus),
    fetchProducts: () => getRequest(`${apiRoot}jetpack/v4/products`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRewindStatus: () => getRequest(`${apiRoot}jetpack/v4/rewind`, getParams).then(checkStatus).then(parseJsonResponse).then(body => JSON.parse(body.data)),
    fetchScanStatus: () => getRequest(`${apiRoot}jetpack/v4/scan`, getParams).then(checkStatus).then(parseJsonResponse).then(body => JSON.parse(body.data)),
    dismissJetpackNotice: notice => postRequest(`${apiRoot}jetpack/v4/notice/${notice}`, postParams, {
      body: JSON.stringify({
        dismissed: true
      })
    }).then(checkStatus).then(parseJsonResponse),
    fetchPluginsData: () => getRequest(`${apiRoot}jetpack/v4/plugins`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchIntroOffers: () => getRequest(`${apiRoot}jetpack/v4/intro-offers`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchVerifySiteGoogleStatus: keyringId => {
      const request = keyringId !== null ? getRequest(`${apiRoot}jetpack/v4/verify-site/google/${keyringId}`, getParams) : getRequest(`${apiRoot}jetpack/v4/verify-site/google`, getParams);
      return request.then(checkStatus).then(parseJsonResponse);
    },
    verifySiteGoogle: keyringId => postRequest(`${apiRoot}jetpack/v4/verify-site/google`, postParams, {
      body: JSON.stringify({
        keyring_id: keyringId
      })
    }).then(checkStatus).then(parseJsonResponse),
    submitSurvey: surveyResponse => postRequest(`${apiRoot}jetpack/v4/marketing/survey`, postParams, {
      body: JSON.stringify(surveyResponse)
    }).then(checkStatus).then(parseJsonResponse),
    saveSetupQuestionnaire: props => postRequest(`${apiRoot}jetpack/v4/setup/questionnaire`, postParams, {
      body: JSON.stringify(props)
    }).then(checkStatus).then(parseJsonResponse),
    updateLicensingError: props => postRequest(`${apiRoot}jetpack/v4/licensing/error`, postParams, {
      body: JSON.stringify(props)
    }).then(checkStatus).then(parseJsonResponse),
    updateLicenseKey: license => postRequest(`${apiRoot}jetpack/v4/licensing/set-license`, postParams, {
      body: JSON.stringify({
        license
      })
    }).then(checkStatus).then(parseJsonResponse),
    getUserLicensesCounts: () => getRequest(`${apiRoot}jetpack/v4/licensing/user/counts`, getParams).then(checkStatus).then(parseJsonResponse),
    getUserLicenses: () => getRequest(`${apiRoot}jetpack/v4/licensing/user/licenses`, getParams).then(checkStatus).then(parseJsonResponse),
    updateLicensingActivationNoticeDismiss: lastDetachedCount => postRequest(`${apiRoot}jetpack/v4/licensing/user/activation-notice-dismiss`, postParams, {
      body: JSON.stringify({
        last_detached_count: lastDetachedCount
      })
    }).then(checkStatus).then(parseJsonResponse),
    updateRecommendationsStep: step => postRequest(`${apiRoot}jetpack/v4/recommendations/step`, postParams, {
      body: JSON.stringify({
        step
      })
    }).then(checkStatus),
    confirmIDCSafeMode: () => postRequest(`${apiRoot}jetpack/v4/identity-crisis/confirm-safe-mode`, postParams).then(checkStatus),
    startIDCFresh: redirectUri => postRequest(`${apiRoot}jetpack/v4/identity-crisis/start-fresh`, postParams, {
      body: JSON.stringify({
        redirect_uri: redirectUri
      })
    }).then(checkStatus).then(parseJsonResponse),
    migrateIDC: () => postRequest(`${apiRoot}jetpack/v4/identity-crisis/migrate`, postParams).then(checkStatus),
    attachLicenses: licenses => postRequest(`${apiRoot}jetpack/v4/licensing/attach-licenses`, postParams, {
      body: JSON.stringify({
        licenses
      })
    }).then(checkStatus).then(parseJsonResponse),
    fetchSearchPlanInfo: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/plan`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchSearchSettings: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateSearchSettings: newSettings => postRequest(`${wpcomOriginApiUrl}jetpack/v4/search/settings`, postParams, {
      body: JSON.stringify(newSettings)
    }).then(checkStatus).then(parseJsonResponse),
    fetchSearchStats: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/stats`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchWafSettings: () => getRequest(`${apiRoot}jetpack/v4/waf`, getParams).then(checkStatus).then(parseJsonResponse),
    updateWafSettings: newSettings => postRequest(`${apiRoot}jetpack/v4/waf`, postParams, {
      body: JSON.stringify(newSettings)
    }).then(checkStatus).then(parseJsonResponse),
    fetchWordAdsSettings: () => getRequest(`${apiRoot}jetpack/v4/wordads/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateWordAdsSettings: newSettings => postRequest(`${apiRoot}jetpack/v4/wordads/settings`, postParams, {
      body: JSON.stringify(newSettings)
    }),
    fetchSearchPricing: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/pricing`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchMigrationStatus: () => getRequest(`${apiRoot}jetpack/v4/migration/status`, getParams).then(checkStatus).then(parseJsonResponse)
  };

  /**
   * The default callback to add a cachebuster parameter to route
   *
   * @param {string} route - the route
   * @returns {string} - the route with the cachebuster appended
   */
  function addCacheBuster(route) {
    const parts = route.split('?'),
      query = parts.length > 1 ? parts[1] : '',
      args = query.length ? query.split('&') : [];
    args.push('_cacheBuster=' + new Date().getTime());
    return parts[0] + '?' + args.join('&');
  }

  /**
   * Generate a request promise for the route and params. Automatically adds a cachebuster.
   *
   * @param {string} route - the route
   * @param {object} params - the params
   * @returns {Promise<Response>} - the http request promise
   */
  function getRequest(route, params) {
    return fetch(cacheBusterCallback(route), params);
  }

  /**
   * Generate a POST request promise for the route and params. Automatically adds a cachebuster.
   *
   * @param {string} route - the route
   * @param {object} params - the params
   * @param {string} body - the body
   * @returns {Promise<Response>} - the http response promise
   */
  function postRequest(route, params, body) {
    return fetch(route, Object.assign({}, params, body)).catch(catchNetworkErrors);
  }

  /**
   * Returns the stats data URL for the given date range
   *
   * @param {string} range - the range
   * @returns {string} - the stats URL
   */
  function statsDataUrl(range) {
    let url = `${apiRoot}jetpack/v4/module/stats/data`;
    if (url.indexOf('?') !== -1) {
      url = url + `&range=${encodeURIComponent(range)}`;
    } else {
      url = url + `?range=${encodeURIComponent(range)}`;
    }
    return url;
  }

  /**
   * Returns stats data if possible, otherwise an empty object
   *
   * @param {object} statsData - the stats data or error
   * @returns {object} - the handled stats data
   */
  function handleStatsResponseError(statsData) {
    // If we get a .response property, it means that .com's response is errory.
    // Probably because the site does not have stats yet.
    const responseOk = statsData.general && statsData.general.response === undefined || statsData.week && statsData.week.response === undefined || statsData.month && statsData.month.response === undefined;
    return responseOk ? statsData : {};
  }
  Object.assign(this, methods);
}
const restApi = new JetpackRestApiClient();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (restApi);

/**
 * Check the status of the response. Throw an error if it was not OK
 *
 * @param {Response} response - the API response
 * @returns {Promise<object>} - a promise to return the parsed JSON body as an object
 */
function checkStatus(response) {
  // Regular success responses
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  if (response.status === 404) {
    return new Promise(() => {
      const err = response.redirected ? new Api404AfterRedirectError(response.redirected) : new Api404Error();
      throw err;
    });
  }
  return response.json().catch(e => catchJsonParseError(e)).then(json => {
    const error = new Error(`${json.message} (Status ${response.status})`);
    error.response = json;
    error.name = 'ApiError';
    throw error;
  });
}

/**
 * Parse the JSON response
 *
 * @param {Response} response - the response object
 * @returns {Promise<object>} - promise to return the parsed json object
 */
function parseJsonResponse(response) {
  return response.json().catch(e => catchJsonParseError(e, response.redirected, response.url));
}

/**
 * Throw appropriate exception given an API error
 *
 * @param {Error} e - the error
 * @param {boolean} redirected - are we being redirected?
 * @param {string} url - the URL that returned the error
 */
function catchJsonParseError(e, redirected, url) {
  const err = redirected ? new JsonParseAfterRedirectError(url) : new JsonParseError();
  throw err;
}

/**
 * Catches TypeError coming from the Fetch API implementation
 */
function catchNetworkErrors() {
  //Either one of:
  // * A preflight error like a redirection to an external site (which results in a CORS)
  // * A preflight error like ERR_TOO_MANY_REDIRECTS
  throw new FetchNetworkError();
}

/***/ }),

/***/ "../../js-packages/components/components/jetpack-logo/index.tsx":
/*!**********************************************************************!*\
  !*** ../../js-packages/components/components/jetpack-logo/index.tsx ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_extends_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/extends.js */ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/extends.js");
/* harmony import */ var _Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_extends_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_extends_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! classnames */ "../../../node_modules/.pnpm/classnames@2.3.2/node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);


const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__;


const JetpackLogo = _ref => {
  let {
    logoColor = '#069e08',
    showText = true,
    className,
    height = 32,
    ...otherProps
  } = _ref;
  const viewBox = showText ? '0 0 118 32' : '0 0 32 32';
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("svg", _Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_extends_js__WEBPACK_IMPORTED_MODULE_0___default()({
    xmlns: "http://www.w3.org/2000/svg",
    x: "0px",
    y: "0px",
    viewBox: viewBox,
    className: classnames__WEBPACK_IMPORTED_MODULE_2___default()('jetpack-logo', className),
    "aria-labelledby": "jetpack-logo-title",
    height: height
  }, otherProps), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("desc", {
    id: "jetpack-logo-title"
  }, __('Jetpack Logo', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    fill: logoColor,
    d: "M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"
  }), showText && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement((react__WEBPACK_IMPORTED_MODULE_3___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M41.3,26.6c-0.5-0.7-0.9-1.4-1.3-2.1c2.3-1.4,3-2.5,3-4.6V8h-3V6h6v13.4C46,22.8,45,24.8,41.3,26.6z"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M65,18.4c0,1.1,0.8,1.3,1.4,1.3c0.5,0,2-0.2,2.6-0.4v2.1c-0.9,0.3-2.5,0.5-3.7,0.5c-1.5,0-3.2-0.5-3.2-3.1V12H60v-2h2.1V7.1 H65V10h4v2h-4V18.4z"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M71,10h3v1.3c1.1-0.8,1.9-1.3,3.3-1.3c2.5,0,4.5,1.8,4.5,5.6s-2.2,6.3-5.8,6.3c-0.9,0-1.3-0.1-2-0.3V28h-3V10z M76.5,12.3 c-0.8,0-1.6,0.4-2.5,1.2v5.9c0.6,0.1,0.9,0.2,1.8,0.2c2,0,3.2-1.3,3.2-3.9C79,13.4,78.1,12.3,76.5,12.3z"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M93,22h-3v-1.5c-0.9,0.7-1.9,1.5-3.5,1.5c-1.5,0-3.1-1.1-3.1-3.2c0-2.9,2.5-3.4,4.2-3.7l2.4-0.3v-0.3c0-1.5-0.5-2.3-2-2.3 c-0.7,0-2.3,0.5-3.7,1.1L84,11c1.2-0.4,3-1,4.4-1c2.7,0,4.6,1.4,4.6,4.7L93,22z M90,16.4l-2.2,0.4c-0.7,0.1-1.4,0.5-1.4,1.6 c0,0.9,0.5,1.4,1.3,1.4s1.5-0.5,2.3-1V16.4z"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M104.5,21.3c-1.1,0.4-2.2,0.6-3.5,0.6c-4.2,0-5.9-2.4-5.9-5.9c0-3.7,2.3-6,6.1-6c1.4,0,2.3,0.2,3.2,0.5V13 c-0.8-0.3-2-0.6-3.2-0.6c-1.7,0-3.2,0.9-3.2,3.6c0,2.9,1.5,3.8,3.3,3.8c0.9,0,1.9-0.2,3.2-0.7V21.3z"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M110,15.2c0.2-0.3,0.2-0.8,3.8-5.2h3.7l-4.6,5.7l5,6.3h-3.7l-4.2-5.8V22h-3V6h3V15.2z"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("path", {
    d: "M58.5,21.3c-1.5,0.5-2.7,0.6-4.2,0.6c-3.6,0-5.8-1.8-5.8-6c0-3.1,1.9-5.9,5.5-5.9s4.9,2.5,4.9,4.9c0,0.8,0,1.5-0.1,2h-7.3 c0.1,2.5,1.5,2.8,3.6,2.8c1.1,0,2.2-0.3,3.4-0.7C58.5,19,58.5,21.3,58.5,21.3z M56,15c0-1.4-0.5-2.9-2-2.9c-1.4,0-2.3,1.3-2.4,2.9 C51.6,15,56,15,56,15z"
  })));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (JetpackLogo);

/***/ }),

/***/ "../../js-packages/components/components/spinner/index.jsx":
/*!*****************************************************************!*\
  !*** ../../js-packages/components/components/spinner/index.jsx ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./style.scss */ "../../js-packages/components/components/spinner/style.scss");



const Spinner = props => {
  const className = props.className + ' jp-components-spinner';
  const styleOuter = {
    width: props.size,
    height: props.size,
    fontSize: props.size,
    // allows border-width to be specified in em units
    borderTopColor: props.color
  };
  const styleInner = {
    borderTopColor: props.color,
    borderRightColor: props.color
  };
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: className
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "jp-components-spinner__outer",
    style: styleOuter
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "jp-components-spinner__inner",
    style: styleInner
  })));
};
Spinner.propTypes = {
  /** The spinner color. */
  color: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().string),
  /** CSS class names. */
  className: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().string),
  /** The spinner size. */
  size: (prop_types__WEBPACK_IMPORTED_MODULE_2___default().number)
};
Spinner.defaultProps = {
  color: '#FFFFFF',
  className: '',
  size: 20
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Spinner);

/***/ }),

/***/ "../../js-packages/components/tools/jp-redirect/index.ts":
/*!***************************************************************!*\
  !*** ../../js-packages/components/tools/jp-redirect/index.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ getRedirectUrl)
/* harmony export */ });
/* global jetpack_redirects */

/**
 * Builds an URL using the jetpack.com/redirect/ service
 *
 * If source is a simple slug, it will be sent using the source query parameter. e.g. jetpack.com/redirect/?source=slug
 *
 * If source is a full URL, starting with https://, it will be sent using the url query parameter. e.g. jetpack.com/redirect/?url=https://wordpress.com
 *
 * Note: if using full URL, query parameters and anchor must be passed in args. Any querystring of url fragment in the URL will be discarded.
 *
 * @since 0.2.0
 * @param {string} source - The URL handler registered in the server or the full destination URL (starting with https://).
 * @param {GetRedirectUrlArgs} args - Additional arguments to build the url.
 * This is not a complete list as any argument passed here
 * will be sent to as a query parameter to the Redirect server.
 * These parameters will not necessarily be passed over to the final destination URL.
 * If you want to add a parameter to the final destination URL, use the `query` argument.
 * @returns {string} The redirect URL
 */
function getRedirectUrl(source) {
  let args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const queryVars = {};
  let calypsoEnv;
  if (typeof window !== 'undefined') {
    calypsoEnv = window.Initial_State?.calypsoEnv;
  }
  if (source.search('https://') === 0) {
    const parsedUrl = new URL(source);

    // discard any query and fragments.
    source = `https://${parsedUrl.host}${parsedUrl.pathname}`;
    queryVars.url = encodeURIComponent(source);
  } else {
    queryVars.source = encodeURIComponent(source);
  }
  Object.keys(args).map(argName => {
    queryVars[argName] = encodeURIComponent(args[argName]);
  });
  if (!Object.keys(queryVars).includes('site') && typeof jetpack_redirects !== 'undefined' && jetpack_redirects.hasOwnProperty('currentSiteRawUrl')) {
    queryVars.site = jetpack_redirects.currentSiteRawUrl;
  }
  if (calypsoEnv) {
    queryVars.calypso_env = calypsoEnv;
  }
  const queryString = Object.keys(queryVars).map(key => key + '=' + queryVars[key]).join('&');
  return `https://jetpack.com/redirect/?` + queryString;
}

/***/ }),

/***/ "../../js-packages/config/src/index.js":
/*!*********************************************!*\
  !*** ../../js-packages/config/src/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-console */

let jetpackConfig = {};
try {
  // Using require allows us to catch the error and provide guidance to developers, as well as test the package.
  jetpackConfig = __webpack_require__(/*! jetpackConfig */ "jetpackConfig");
} catch {
  console.error('jetpackConfig is missing in your webpack config file. See @automattic/jetpack-config');
  jetpackConfig = {
    missingConfig: true
  };
}
const jetpackConfigHas = key => {
  return jetpackConfig.hasOwnProperty(key);
};
const jetpackConfigGet = key => {
  if (!jetpackConfigHas(key)) {
    throw 'This app requires the "' + key + '" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.';
  }
  return jetpackConfig[key];
};

// Note: For this cjs module to be used with named exports in an mjs context, modules.exports
// needs to contain only simple variables like `a` or `a: b`. Define anything more complex
// as a variable above, then use the variable here.
// @see https://github.com/nodejs/node/blob/master/deps/cjs-module-lexer/README.md#exports-object-assignment
module.exports = {
  jetpackConfigHas,
  jetpackConfigGet
};

/***/ }),

/***/ "../../js-packages/idc/components/card-fresh/index.jsx":
/*!*************************************************************!*\
  !*** ../../js-packages/idc/components/card-fresh/index.jsx ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/tools/jp-redirect/index.ts");
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/components/spinner/index.jsx");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _state_store__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../state/store */ "../../js-packages/idc/state/store.jsx");
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _tools_extract_hostname__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../tools/extract-hostname */ "../../js-packages/idc/tools/extract-hostname.jsx");
/* harmony import */ var _error_message__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../error-message */ "../../js-packages/idc/components/error-message/index.jsx");





const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__;







/**
 * Render the error message.
 *
 * @param {string} supportURL - The support page URL.
 * @returns {React.Component} The error message.
 */
const renderError = supportURL => {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_error_message__WEBPACK_IMPORTED_MODULE_5__["default"], null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.createInterpolateElement)(__('Could not create the connection. Retry or find out more <a>here</a>.', "jetpack-idc"), {
    a: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("a", {
      href: supportURL || (0,_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_6__["default"])('jetpack-support-safe-mode'),
      rel: "noopener noreferrer",
      target: "_blank"
    })
  }));
};

/**
 * The "start fresh" card.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardFresh = props => {
  const {
    isStartingFresh,
    startFreshCallback,
    customContent,
    hasError
  } = props;
  const wpcomHostName = (0,_tools_extract_hostname__WEBPACK_IMPORTED_MODULE_7__["default"])(props.wpcomHomeUrl);
  const currentHostName = (0,_tools_extract_hostname__WEBPACK_IMPORTED_MODULE_7__["default"])(props.currentUrl);
  const isActionInProgress = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select(_state_store__WEBPACK_IMPORTED_MODULE_8__.STORE_ID).getIsActionInProgress(), []);
  const buttonLabel = customContent.startFreshButtonLabel || __('Create a fresh connection', "jetpack-idc");
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: 'jp-idc__idc-screen__card-action-base' + (hasError ? ' jp-idc__idc-screen__card-action-error' : '')
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-top"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("h4", null, customContent.startFreshCardTitle ? (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.createInterpolateElement)(customContent.startFreshCardTitle, {
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("em", null)
  }) : __('Treat each site as independent sites', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("p", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.createInterpolateElement)(customContent.startFreshCardBodyText || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.sprintf)( /* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
  __('<hostname>%1$s</hostname> settings, stats, and subscribers will start fresh. <hostname>%2$s</hostname> will keep its data as is.', "jetpack-idc"), currentHostName, wpcomHostName), {
    hostname: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("strong", null),
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("strong", null)
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-bottom"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-sitename"
  }, wpcomHostName), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Dashicon, {
    icon: "minus",
    className: "jp-idc__idc-screen__card-action-separator"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-sitename"
  }, currentHostName), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
    className: "jp-idc__idc-screen__card-action-button",
    label: buttonLabel,
    onClick: startFreshCallback,
    disabled: isActionInProgress
  }, isStartingFresh ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__["default"], null) : buttonLabel), hasError && renderError(customContent.supportURL)));
};
CardFresh.propTypes = {
  /** The original site URL. */
  wpcomHomeUrl: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().string.isRequired),
  /** The current site URL. */
  currentUrl: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().string.isRequired),
  /** Whether starting fresh is in progress. */
  isStartingFresh: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().bool.isRequired),
  /** "Start Fresh" callback. */
  startFreshCallback: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().func.isRequired),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_10___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_11__["default"]),
  /** Whether the component has an error. */
  hasError: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().bool.isRequired)
};
CardFresh.defaultProps = {
  isStartingFresh: false,
  startFreshCallback: () => {},
  customContent: {},
  hasError: false
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CardFresh);

/***/ }),

/***/ "../../js-packages/idc/components/card-migrate/index.jsx":
/*!***************************************************************!*\
  !*** ../../js-packages/idc/components/card-migrate/index.jsx ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/tools/jp-redirect/index.ts");
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/components/spinner/index.jsx");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _state_store__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../state/store */ "../../js-packages/idc/state/store.jsx");
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _tools_extract_hostname__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../tools/extract-hostname */ "../../js-packages/idc/tools/extract-hostname.jsx");
/* harmony import */ var _error_message__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../error-message */ "../../js-packages/idc/components/error-message/index.jsx");





const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__;







/**
 * Render the error message.
 *
 * @param {string} supportURL - The support page URL.
 * @returns {React.Component} The error message.
 */
const renderError = supportURL => {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_error_message__WEBPACK_IMPORTED_MODULE_5__["default"], null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.createInterpolateElement)(__('Could not move your settings. Retry or find out more <a>here</a>.', "jetpack-idc"), {
    a: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("a", {
      href: supportURL || (0,_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_6__["default"])('jetpack-support-safe-mode'),
      rel: "noopener noreferrer",
      target: "_blank"
    })
  }));
};

/**
 * The "migrate" card.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardMigrate = props => {
  const wpcomHostName = (0,_tools_extract_hostname__WEBPACK_IMPORTED_MODULE_7__["default"])(props.wpcomHomeUrl);
  const currentHostName = (0,_tools_extract_hostname__WEBPACK_IMPORTED_MODULE_7__["default"])(props.currentUrl);
  const isActionInProgress = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select(_state_store__WEBPACK_IMPORTED_MODULE_8__.STORE_ID).getIsActionInProgress(), []);
  const {
    isMigrating,
    migrateCallback,
    customContent,
    hasError
  } = props;
  const buttonLabel = customContent.migrateButtonLabel || __('Move your settings', "jetpack-idc");
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: 'jp-idc__idc-screen__card-action-base' + (hasError ? ' jp-idc__idc-screen__card-action-error' : '')
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-top"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("h4", null, customContent.migrateCardTitle ? (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.createInterpolateElement)(customContent.migrateCardTitle, {
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("em", null)
  }) : __('Move Jetpack data', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("p", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.createInterpolateElement)(customContent.migrateCardBodyText || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.sprintf)( /* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
  __('Move all your settings, stats and subscribers to your other URL, <hostname>%1$s</hostname>. <hostname>%2$s</hostname> will be disconnected from Jetpack.', "jetpack-idc"), currentHostName, wpcomHostName), {
    hostname: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("strong", null),
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("strong", null)
  }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-bottom"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-sitename"
  }, wpcomHostName), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Dashicon, {
    icon: "arrow-down-alt",
    className: "jp-idc__idc-screen__card-action-separator"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement("div", {
    className: "jp-idc__idc-screen__card-action-sitename"
  }, currentHostName), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
    className: "jp-idc__idc-screen__card-action-button",
    label: buttonLabel,
    onClick: migrateCallback,
    disabled: isActionInProgress
  }, isMigrating ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_4___default().createElement(_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__["default"], null) : buttonLabel), hasError && renderError(customContent.supportURL)));
};
CardMigrate.propTypes = {
  /** The original site URL. */
  wpcomHomeUrl: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().string.isRequired),
  /** The current site URL. */
  currentUrl: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().string.isRequired),
  /** Whether the migration is in progress. */
  isMigrating: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().bool.isRequired),
  /** Migration callback. */
  migrateCallback: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().func.isRequired),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_10___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_11__["default"]),
  /** Whether the component has an error. */
  hasError: (prop_types__WEBPACK_IMPORTED_MODULE_10___default().bool.isRequired)
};
CardMigrate.defaultProps = {
  isMigrating: false,
  migrateCallback: () => {},
  customContent: {},
  hasError: false
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CardMigrate);

/***/ }),

/***/ "../../js-packages/idc/components/error-message/error-gridicon.jsx":
/*!*************************************************************************!*\
  !*** ../../js-packages/idc/components/error-message/error-gridicon.jsx ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

const ErrorGridicon = () => {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("svg", {
    className: "error-gridicon",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    height: 24
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("rect", {
    x: "0",
    fill: "none",
    width: "24",
    height: "24"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("g", null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("path", {
    d: "M12 4c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8m0-2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 13h-2v2h2v-2zm-2-2h2l.5-6h-3l.5 6z"
  })));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ErrorGridicon);

/***/ }),

/***/ "../../js-packages/idc/components/error-message/index.jsx":
/*!****************************************************************!*\
  !*** ../../js-packages/idc/components/error-message/index.jsx ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _error_gridicon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./error-gridicon */ "../../js-packages/idc/components/error-message/error-gridicon.jsx");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./style.scss */ "../../js-packages/idc/components/error-message/style.scss");



const ErrorMessage = props => {
  const {
    children
  } = props;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", {
    className: "jp-idc__error-message"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_error_gridicon__WEBPACK_IMPORTED_MODULE_2__["default"], null), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", null, children));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ErrorMessage);

/***/ }),

/***/ "../../js-packages/idc/components/idc-screen/index.jsx":
/*!*************************************************************!*\
  !*** ../../js-packages/idc/components/idc-screen/index.jsx ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @automattic/jetpack-api */ "../../js-packages/api/index.jsx");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _hooks_use_migration__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../hooks/use-migration */ "../../js-packages/idc/hooks/use-migration.jsx");
/* harmony import */ var _hooks_use_migration_finished__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../hooks/use-migration-finished */ "../../js-packages/idc/hooks/use-migration-finished.jsx");
/* harmony import */ var _hooks_use_start_fresh__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../hooks/use-start-fresh */ "../../js-packages/idc/hooks/use-start-fresh.jsx");
/* harmony import */ var _state_store__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../state/store */ "../../js-packages/idc/state/store.jsx");
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _tools_tracking__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../tools/tracking */ "../../js-packages/idc/tools/tracking.jsx");
/* harmony import */ var _visual__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./visual */ "../../js-packages/idc/components/idc-screen/visual.jsx");












/**
 * The IDC screen component.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const IDCScreen = props => {
  const {
    logo,
    customContent,
    wpcomHomeUrl,
    currentUrl,
    apiNonce,
    apiRoot,
    redirectUri,
    tracksUserData,
    tracksEventData,
    isAdmin,
    possibleDynamicSiteUrlDetected
  } = props;
  const [isMigrated, setIsMigrated] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
  const errorType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select(_state_store__WEBPACK_IMPORTED_MODULE_3__.STORE_ID).getErrorType(), []);
  const {
    isMigrating,
    migrateCallback
  } = (0,_hooks_use_migration__WEBPACK_IMPORTED_MODULE_4__["default"])((0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(() => {
    setIsMigrated(true);
  }, [setIsMigrated]));
  const {
    isStartingFresh,
    startFreshCallback
  } = (0,_hooks_use_start_fresh__WEBPACK_IMPORTED_MODULE_5__["default"])(redirectUri);
  const {
    isFinishingMigration,
    finishMigrationCallback
  } = (0,_hooks_use_migration_finished__WEBPACK_IMPORTED_MODULE_6__["default"])();

  /**
   * Initialize the REST API and analytics.
   */
  (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__["default"].setApiRoot(apiRoot);
    _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__["default"].setApiNonce(apiNonce);
    (0,_tools_tracking__WEBPACK_IMPORTED_MODULE_7__.initializeAnalytics)(tracksEventData, tracksUserData);
    if (tracksEventData) {
      if (tracksEventData.hasOwnProperty('isAdmin') && tracksEventData.isAdmin) {
        (0,_tools_tracking__WEBPACK_IMPORTED_MODULE_7__["default"])('notice_view');
      } else {
        (0,_tools_tracking__WEBPACK_IMPORTED_MODULE_7__["default"])('non_admin_notice_view', {
          page: tracksEventData.hasOwnProperty('currentScreen') ? tracksEventData.currentScreen : false
        });
      }
    }
  }, [apiRoot, apiNonce, tracksUserData, tracksEventData]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_visual__WEBPACK_IMPORTED_MODULE_8__["default"], {
    logo: logo,
    customContent: customContent,
    wpcomHomeUrl: wpcomHomeUrl,
    currentUrl: currentUrl,
    redirectUri: redirectUri,
    isMigrating: isMigrating,
    migrateCallback: migrateCallback,
    isMigrated: isMigrated,
    finishMigrationCallback: finishMigrationCallback,
    isFinishingMigration: isFinishingMigration,
    isStartingFresh: isStartingFresh,
    startFreshCallback: startFreshCallback,
    isAdmin: isAdmin,
    hasStaySafeError: errorType === 'safe-mode',
    hasFreshError: errorType === 'start-fresh',
    hasMigrateError: errorType === 'migrate',
    possibleDynamicSiteUrlDetected: possibleDynamicSiteUrlDetected
  });
};
IDCScreen.propTypes = {
  /** The screen logo. */
  logo: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().object),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_9___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_10__["default"]),
  /** The original site URL. */
  wpcomHomeUrl: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().string.isRequired),
  /** The current site URL. */
  currentUrl: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().string.isRequired),
  /** The redirect URI to redirect users back to after connecting. */
  redirectUri: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().string.isRequired),
  /** API root URL. */
  apiRoot: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().string.isRequired),
  /** API Nonce. */
  apiNonce: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().string.isRequired),
  /** WordPress.com user's Tracks identity. */
  tracksUserData: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().object),
  /** WordPress.com event tracking information. */
  tracksEventData: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().object),
  /** Whether to display the "admin" or "non-admin" screen. */
  isAdmin: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().bool.isRequired),
  /** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
  possibleDynamicSiteUrlDetected: (prop_types__WEBPACK_IMPORTED_MODULE_9___default().bool)
};
IDCScreen.defaultProps = {
  customContent: {}
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (IDCScreen);

/***/ }),

/***/ "../../js-packages/idc/components/idc-screen/screen-main.jsx":
/*!*******************************************************************!*\
  !*** ../../js-packages/idc/components/idc-screen/screen-main.jsx ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/tools/jp-redirect/index.ts");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _card_fresh__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../card-fresh */ "../../js-packages/idc/components/card-fresh/index.jsx");
/* harmony import */ var _card_migrate__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../card-migrate */ "../../js-packages/idc/components/card-migrate/index.jsx");
/* harmony import */ var _safe_mode__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../safe-mode */ "../../js-packages/idc/components/safe-mode/index.jsx");



const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__;







/**
 * Retrieve the main screen body.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenMain = props => {
  const {
    wpcomHomeUrl,
    currentUrl,
    isMigrating,
    migrateCallback,
    isStartingFresh,
    startFreshCallback,
    customContent,
    hasMigrateError,
    hasFreshError,
    hasStaySafeError,
    possibleDynamicSiteUrlDetected
  } = props;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement((react__WEBPACK_IMPORTED_MODULE_2___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("h2", null, customContent.mainTitle ? (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)(customContent.mainTitle, {
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("em", null)
  }) : __('Safe Mode has been activated', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("p", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)(customContent.mainBodyText || __('Your site is in Safe Mode because you have 2 Jetpack-powered sites that appear to be duplicates. ' + '2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>', "jetpack-idc"), {
    safeModeLink: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("a", {
      href: customContent.supportURL || (0,_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_3__["default"])('jetpack-support-safe-mode'),
      rel: "noopener noreferrer",
      target: "_blank"
    }),
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("strong", null)
  })), possibleDynamicSiteUrlDetected && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("p", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)(customContent.dynamicSiteUrlText || __("<strong>Notice:</strong> It appears that your 'wp-config.php' file might be using dynamic site URL values. " + 'Dynamic site URLs could cause Jetpack to enter Safe Mode. ' + '<dynamicSiteUrlSupportLink>Learn how to set a static site URL.</dynamicSiteUrlSupportLink>', "jetpack-idc"), {
    dynamicSiteUrlSupportLink: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("a", {
      href: customContent.dynamicSiteUrlSupportLink || (0,_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_3__["default"])('jetpack-idcscreen-dynamic-site-urls'),
      rel: "noopener noreferrer",
      target: "_blank"
    }),
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("strong", null)
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("h3", null, __('Please select an option', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    className: 'jp-idc__idc-screen__cards' + (hasMigrateError || hasFreshError ? ' jp-idc__idc-screen__cards-error' : '')
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_card_migrate__WEBPACK_IMPORTED_MODULE_4__["default"], {
    wpcomHomeUrl: wpcomHomeUrl,
    currentUrl: currentUrl,
    isMigrating: isMigrating,
    migrateCallback: migrateCallback,
    customContent: customContent,
    hasError: hasMigrateError
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    className: "jp-idc__idc-screen__cards-separator"
  }, "or"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_card_fresh__WEBPACK_IMPORTED_MODULE_5__["default"], {
    wpcomHomeUrl: wpcomHomeUrl,
    currentUrl: currentUrl,
    isStartingFresh: isStartingFresh,
    startFreshCallback: startFreshCallback,
    customContent: customContent,
    hasError: hasFreshError
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_safe_mode__WEBPACK_IMPORTED_MODULE_6__["default"], {
    hasError: hasStaySafeError,
    customContent: customContent
  }));
};
ScreenMain.propTypes = {
  /** The original site URL. */
  wpcomHomeUrl: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().string.isRequired),
  /** The current site URL */
  currentUrl: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().string.isRequired),
  /** Whether the migration is in progress. */
  isMigrating: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Migration callback. */
  migrateCallback: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().func),
  /** Whether starting fresh is in progress. */
  isStartingFresh: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** "Start Fresh" callback. */
  startFreshCallback: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().func),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_7___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_8__["default"]),
  /** Whether the component encountered the migration error. */
  hasMigrateError: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Whether the component encountered the "Fresh Connection" error. */
  hasFreshError: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Whether the component encountered the "Stay in Safe Mode" error. */
  hasStaySafeError: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
  possibleDynamicSiteUrlDetected: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool)
};
ScreenMain.defaultProps = {
  isMigrating: false,
  isStartingFresh: false,
  customContent: {},
  hasMigrateError: false,
  hasFreshError: false,
  hasStaySafeError: false,
  possibleDynamicSiteUrlDetected: false
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ScreenMain);

/***/ }),

/***/ "../../js-packages/idc/components/idc-screen/screen-migrated.jsx":
/*!***********************************************************************!*\
  !*** ../../js-packages/idc/components/idc-screen/screen-migrated.jsx ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/components/spinner/index.jsx");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _tools_extract_hostname__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../tools/extract-hostname */ "../../js-packages/idc/tools/extract-hostname.jsx");




const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__;





/**
 * Retrieve the migrated screen body.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The ScreenMigrated component.
 */
const ScreenMigrated = props => {
  const {
    finishCallback,
    isFinishing,
    customContent
  } = props;
  const wpcomHostName = (0,_tools_extract_hostname__WEBPACK_IMPORTED_MODULE_4__["default"])(props.wpcomHomeUrl);
  const currentHostName = (0,_tools_extract_hostname__WEBPACK_IMPORTED_MODULE_4__["default"])(props.currentUrl);
  const buttonLabel = __('Got it, thanks', "jetpack-idc");
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement((react__WEBPACK_IMPORTED_MODULE_3___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("h2", null, customContent.migratedTitle ? (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.createInterpolateElement)(customContent.migratedTitle, {
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("em", null)
  }) : __('Your Jetpack settings have migrated successfully', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("p", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.createInterpolateElement)(customContent.migratedBodyText || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.sprintf)( /* translators: %1$s: The current site domain name. */
  __('Safe Mode has been switched off for <hostname>%1$s</hostname> website and Jetpack is fully functional.', "jetpack-idc"), currentHostName), {
    hostname: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("strong", null),
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("strong", null)
  })), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("div", {
    className: "jp-idc__idc-screen__card-migrated"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("div", {
    className: "jp-idc__idc-screen__card-migrated-hostname"
  }, wpcomHostName), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Dashicon, {
    icon: "arrow-down-alt",
    className: "jp-idc__idc-screen__card-migrated-separator"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Dashicon, {
    icon: "arrow-right-alt",
    className: "jp-idc__idc-screen__card-migrated-separator-wide"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement("div", {
    className: "jp-idc__idc-screen__card-migrated-hostname"
  }, currentHostName)), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
    className: "jp-idc__idc-screen__card-action-button jp-idc__idc-screen__card-action-button-migrated",
    onClick: finishCallback,
    label: buttonLabel
  }, isFinishing ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_3___default().createElement(_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_5__["default"], null) : buttonLabel));
};
ScreenMigrated.propTypes = {
  /** The original site URL. */
  wpcomHomeUrl: (prop_types__WEBPACK_IMPORTED_MODULE_6___default().string.isRequired),
  /** The current site URL. */
  currentUrl: (prop_types__WEBPACK_IMPORTED_MODULE_6___default().string.isRequired),
  /** Callback to be called when migration is complete, and user clicks the OK button. */
  finishCallback: (prop_types__WEBPACK_IMPORTED_MODULE_6___default().func),
  /** Whether the migration finishing process is in progress. */
  isFinishing: (prop_types__WEBPACK_IMPORTED_MODULE_6___default().bool.isRequired),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_6___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_7__["default"])
};
ScreenMigrated.defaultProps = {
  finishCallback: () => {},
  isFinishing: false,
  customContent: {}
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ScreenMigrated);

/***/ }),

/***/ "../../js-packages/idc/components/idc-screen/screen-non-admin.jsx":
/*!************************************************************************!*\
  !*** ../../js-packages/idc/components/idc-screen/screen-non-admin.jsx ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/tools/jp-redirect/index.ts");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");



const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__;




/**
 * Retrieve the main screen body.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenNonAdmin = props => {
  const {
    customContent
  } = props;
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement((react__WEBPACK_IMPORTED_MODULE_2___default().Fragment), null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("h2", null, customContent.nonAdminTitle ? (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)(customContent.nonAdminTitle, {
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("em", null)
  }) : __('Safe Mode has been activated', "jetpack-idc")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("p", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)(customContent.nonAdminBodyText || __('This site is in Safe Mode because there are 2 Jetpack-powered sites that appear to be duplicates. ' + '2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>', "jetpack-idc"), {
    safeModeLink: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("a", {
      href: customContent.supportURL || (0,_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_3__["default"])('jetpack-support-safe-mode'),
      rel: "noopener noreferrer",
      target: "_blank"
    }),
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("strong", null)
  })), customContent.nonAdminBodyText ? '' : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("p", null, __('An administrator of this site can take Jetpack out of Safe Mode.', "jetpack-idc")));
};
ScreenNonAdmin.propTypes = {
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_4___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_5__["default"])
};
ScreenNonAdmin.defaultProps = {
  customContent: {}
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ScreenNonAdmin);

/***/ }),

/***/ "../../js-packages/idc/components/idc-screen/visual.jsx":
/*!**************************************************************!*\
  !*** ../../js-packages/idc/components/idc-screen/visual.jsx ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/components/jetpack-logo/index.tsx");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _screen_main__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./screen-main */ "../../js-packages/idc/components/idc-screen/screen-main.jsx");
/* harmony import */ var _screen_migrated__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./screen-migrated */ "../../js-packages/idc/components/idc-screen/screen-migrated.jsx");
/* harmony import */ var _screen_non_admin__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./screen-non-admin */ "../../js-packages/idc/components/idc-screen/screen-non-admin.jsx");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style.scss */ "../../js-packages/idc/components/idc-screen/style.scss");



const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__;







const renderLogoImage = (logo, alt) => typeof logo === 'string' || logo instanceof String ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("img", {
  src: logo,
  alt: alt,
  className: "jp-idc__idc-screen__logo-image"
}) : logo;
const IDCScreenVisual = props => {
  const {
    logo,
    customContent,
    wpcomHomeUrl,
    currentUrl,
    redirectUri,
    isMigrating,
    migrateCallback,
    isMigrated,
    finishMigrationCallback,
    isFinishingMigration,
    isStartingFresh,
    startFreshCallback,
    isAdmin,
    hasMigrateError,
    hasFreshError,
    hasStaySafeError,
    possibleDynamicSiteUrlDetected
  } = props;
  const nonAdminBody = !isAdmin ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_screen_non_admin__WEBPACK_IMPORTED_MODULE_4__["default"], {
    customContent: customContent
  }) : '';
  let adminBody = '';
  if (isAdmin) {
    adminBody = isMigrated ? /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_screen_migrated__WEBPACK_IMPORTED_MODULE_5__["default"], {
      wpcomHomeUrl: wpcomHomeUrl,
      currentUrl: currentUrl,
      finishCallback: finishMigrationCallback,
      isFinishing: isFinishingMigration,
      customContent: customContent
    }) : /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_screen_main__WEBPACK_IMPORTED_MODULE_6__["default"], {
      wpcomHomeUrl: wpcomHomeUrl,
      currentUrl: currentUrl,
      redirectUri: redirectUri,
      customContent: customContent,
      isMigrating: isMigrating,
      migrateCallback: migrateCallback,
      isStartingFresh: isStartingFresh,
      startFreshCallback: startFreshCallback,
      hasMigrateError: hasMigrateError,
      hasFreshError: hasFreshError,
      hasStaySafeError: hasStaySafeError,
      possibleDynamicSiteUrlDetected: possibleDynamicSiteUrlDetected
    });
  }
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    className: 'jp-idc__idc-screen' + (isMigrated ? ' jp-idc__idc-screen__success' : '')
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    className: "jp-idc__idc-screen__header"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    className: "jp-idc__idc-screen__logo"
  }, renderLogoImage(logo, customContent.logoAlt || '')), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("div", {
    className: "jp-idc__idc-screen__logo-label"
  }, customContent.headerText ? (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)(customContent.headerText, {
    em: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("em", null),
    strong: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement("strong", null)
  }) : __('Safe Mode', "jetpack-idc"))), nonAdminBody, adminBody);
};
IDCScreenVisual.propTypes = {
  /** The screen logo, Jetpack by default. */
  logo: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().object.isRequired),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_7___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_8__["default"]),
  /** The original site URL. */
  wpcomHomeUrl: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().string.isRequired),
  /** The current site URL. */
  currentUrl: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().string.isRequired),
  /** The redirect URI to redirect users back to after connecting. */
  redirectUri: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().string.isRequired),
  /** Whether the migration is in progress. */
  isMigrating: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Migration callback. */
  migrateCallback: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().func),
  /** Whether the migration has been completed. */
  isMigrated: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Callback to be called when migration is complete, and user clicks the OK button. */
  finishMigrationCallback: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().func),
  /** Whether the migration finishing process is in progress. */
  isFinishingMigration: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Whether starting fresh is in progress. */
  isStartingFresh: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** "Start Fresh" callback. */
  startFreshCallback: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().func),
  /** Whether to display the "admin" or "non-admin" screen. */
  isAdmin: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Whether the component encountered the migration error. */
  hasMigrateError: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Whether the component encountered the "Fresh Connection" error. */
  hasFreshError: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** Whether the component encountered the "Stay in Safe Mode" error. */
  hasStaySafeError: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool.isRequired),
  /** If potentially dynamic HTTP_HOST usage was detected for site URLs in wp-config which can lead to a JP IDC. */
  possibleDynamicSiteUrlDetected: (prop_types__WEBPACK_IMPORTED_MODULE_7___default().bool)
};
IDCScreenVisual.defaultProps = {
  logo: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_2___default().createElement(_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__["default"], {
    height: 24
  }),
  isMigrated: false,
  isFinishingMigration: false,
  isMigrating: false,
  isStartingFresh: false,
  customContent: {},
  hasMigrateError: false,
  hasFreshError: false,
  hasStaySafeError: false,
  possibleDynamicSiteUrlDetected: false
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (IDCScreenVisual);

/***/ }),

/***/ "../../js-packages/idc/components/safe-mode/index.jsx":
/*!************************************************************!*\
  !*** ../../js-packages/idc/components/safe-mode/index.jsx ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @automattic/jetpack-api */ "../../js-packages/api/index.jsx");
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/components/spinner/index.jsx");
/* harmony import */ var _automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @automattic/jetpack-components */ "../../js-packages/components/tools/jp-redirect/index.ts");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/url */ "@wordpress/url");
/* harmony import */ var _wordpress_url__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_url__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _state_store__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../state/store */ "../../js-packages/idc/state/store.jsx");
/* harmony import */ var _tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../tools/custom-content-shape */ "../../js-packages/idc/tools/custom-content-shape.jsx");
/* harmony import */ var _tools_tracking__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../tools/tracking */ "../../js-packages/idc/tools/tracking.jsx");
/* harmony import */ var _error_message__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../error-message */ "../../js-packages/idc/components/error-message/index.jsx");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./style.scss */ "../../js-packages/idc/components/safe-mode/style.scss");







const __ = _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__;









/**
 * Render the "Stay safe" button.
 *
 * @param {Function} callback - Button click callback.
 * @param {boolean} isDisabled - Whether the button should be disabled.
 * @returns {React.Component} - The rendered output.
 */
const renderStaySafeButton = (callback, isDisabled) => {
  return (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.createInterpolateElement)(__('Or decide later and stay in <button>Safe mode</button>', "jetpack-idc"), {
    button: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
      label: __('Safe mode', "jetpack-idc"),
      variant: "link",
      onClick: callback,
      disabled: isDisabled
    })
  });
};

/**
 * Render the "staying safe" line.
 *
 * @returns {React.Component} - The rendered output.
 */
const renderStayingSafe = () => {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement("div", {
    className: "jp-idc__safe-mode__staying-safe"
  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement(_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_9__["default"], {
    color: "black"
  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement("span", null, __('Finishing setting up Safe mode…', "jetpack-idc")));
};

/**
 * Render the error message.
 *
 * @param {string} supportURL - The support page URL.
 * @returns {React.Component} The error message.
 */
const renderError = supportURL => {
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement(_error_message__WEBPACK_IMPORTED_MODULE_10__["default"], null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.createInterpolateElement)(__('Could not stay in safe mode. Retry or find out more <a>here</a>.', "jetpack-idc"), {
    a: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement("a", {
      href: supportURL || (0,_automattic_jetpack_components__WEBPACK_IMPORTED_MODULE_11__["default"])('jetpack-support-safe-mode'),
      rel: "noopener noreferrer",
      target: "_blank"
    })
  }));
};
const SafeMode = props => {
  const {
    isActionInProgress,
    setIsActionInProgress,
    setErrorType,
    clearErrorType,
    hasError,
    customContent
  } = props;
  const [isStayingSafe, setIsStayingSafe] = (0,react__WEBPACK_IMPORTED_MODULE_7__.useState)(false);
  const staySafeCallback = (0,react__WEBPACK_IMPORTED_MODULE_7__.useCallback)(() => {
    if (!isActionInProgress) {
      setIsStayingSafe(true);
      setIsActionInProgress(true);
      clearErrorType();
      (0,_tools_tracking__WEBPACK_IMPORTED_MODULE_12__["default"])('confirm_safe_mode');
      _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__["default"].confirmIDCSafeMode().then(() => {
        window.location.href = (0,_wordpress_url__WEBPACK_IMPORTED_MODULE_6__.removeQueryArgs)(window.location.href, 'jetpack_idc_clear_confirmation', '_wpnonce');
      }).catch(error => {
        setIsActionInProgress(false);
        setIsStayingSafe(false);
        setErrorType('safe-mode');
        throw error;
      });
    }
  }, [isActionInProgress, setIsActionInProgress, setErrorType, clearErrorType]);
  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_7___default().createElement("div", {
    className: "jp-idc__safe-mode"
  }, isStayingSafe ? renderStayingSafe() : renderStaySafeButton(staySafeCallback, isActionInProgress), hasError && renderError(customContent.supportURL));
};
SafeMode.propTypes = {
  /** Whether there's already an action in progress. */
  isActionInProgress: (prop_types__WEBPACK_IMPORTED_MODULE_13___default().bool),
  /** Function to set the "action in progress" flag. */
  setIsActionInProgress: (prop_types__WEBPACK_IMPORTED_MODULE_13___default().func.isRequired),
  /** Function to set the error type. */
  setErrorType: (prop_types__WEBPACK_IMPORTED_MODULE_13___default().func.isRequired),
  /** Function to clear the error. */
  clearErrorType: (prop_types__WEBPACK_IMPORTED_MODULE_13___default().func.isRequired),
  /** Whether the component has an error. */
  hasError: (prop_types__WEBPACK_IMPORTED_MODULE_13___default().bool.isRequired),
  /** Custom text content. */
  customContent: prop_types__WEBPACK_IMPORTED_MODULE_13___default().shape(_tools_custom_content_shape__WEBPACK_IMPORTED_MODULE_14__["default"])
};
SafeMode.defaultProps = {
  hasError: false
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_2__.compose)([(0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.withSelect)(select => {
  return {
    isActionInProgress: select(_state_store__WEBPACK_IMPORTED_MODULE_15__.STORE_ID).getIsActionInProgress()
  };
}), (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.withDispatch)(dispatch => {
  return {
    setIsActionInProgress: dispatch(_state_store__WEBPACK_IMPORTED_MODULE_15__.STORE_ID).setIsActionInProgress,
    setErrorType: dispatch(_state_store__WEBPACK_IMPORTED_MODULE_15__.STORE_ID).setErrorType,
    clearErrorType: dispatch(_state_store__WEBPACK_IMPORTED_MODULE_15__.STORE_ID).clearErrorType
  };
})])(SafeMode));

/***/ }),

/***/ "../../js-packages/idc/hooks/use-migration-finished.jsx":
/*!**************************************************************!*\
  !*** ../../js-packages/idc/hooks/use-migration-finished.jsx ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Custom hook to handle finishing migration action.
 *
 * @returns {{isFinishingMigration: boolean, finishMigrationCallback: ((function(): void)|*)}} Hook values.
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const [isFinishingMigration, setIsFinishingMigration] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);

  /**
   * Handle the "Got It" click after the migration has completed.
   */
  const finishMigrationCallback = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    if (!isFinishingMigration) {
      setIsFinishingMigration(true);
      window.location.reload();
    }
  }, [isFinishingMigration, setIsFinishingMigration]);
  return {
    isFinishingMigration,
    finishMigrationCallback
  };
});

/***/ }),

/***/ "../../js-packages/idc/hooks/use-migration.jsx":
/*!*****************************************************!*\
  !*** ../../js-packages/idc/hooks/use-migration.jsx ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @automattic/jetpack-api */ "../../js-packages/api/index.jsx");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _state_store__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../state/store */ "../../js-packages/idc/state/store.jsx");
/* harmony import */ var _tools_tracking__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../tools/tracking */ "../../js-packages/idc/tools/tracking.jsx");






/**
 * Custom hook to handle the migration action.
 *
 * @param {Function} onMigrated - The callback to be called when migration has completed.
 * @returns {{isMigrating: boolean, migrateCallback: ((function(): void)|*)}} Hook values.
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (onMigrated => {
  const [isMigrating, setIsMigrating] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
  const isActionInProgress = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select(_state_store__WEBPACK_IMPORTED_MODULE_3__.STORE_ID).getIsActionInProgress(), []);
  const {
    setIsActionInProgress,
    setErrorType,
    clearErrorType
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useDispatch)(_state_store__WEBPACK_IMPORTED_MODULE_3__.STORE_ID);

  /**
   * Initiate the migration.
   */
  const migrateCallback = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(() => {
    if (!isActionInProgress) {
      (0,_tools_tracking__WEBPACK_IMPORTED_MODULE_4__["default"])('migrate');
      setIsActionInProgress(true);
      setIsMigrating(true);
      clearErrorType();
      _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__["default"].migrateIDC().then(() => {
        setIsMigrating(false);
        if (onMigrated && {}.toString.call(onMigrated) === '[object Function]') {
          onMigrated();
        }
      }).catch(error => {
        setIsActionInProgress(false);
        setIsMigrating(false);
        setErrorType('migrate');
        throw error;
      });
    }
  }, [setIsMigrating, onMigrated, isActionInProgress, setIsActionInProgress, setErrorType, clearErrorType]);
  return {
    isMigrating,
    migrateCallback
  };
});

/***/ }),

/***/ "../../js-packages/idc/hooks/use-start-fresh.jsx":
/*!*******************************************************!*\
  !*** ../../js-packages/idc/hooks/use-start-fresh.jsx ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @automattic/jetpack-api */ "../../js-packages/api/index.jsx");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _state_store__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../state/store */ "../../js-packages/idc/state/store.jsx");
/* harmony import */ var _tools_tracking__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../tools/tracking */ "../../js-packages/idc/tools/tracking.jsx");






/**
 * Custom hook to handle the migration action.
 *
 * @param {string} redirectUri - WP-admin URI to redirect user to after reconnecting.
 * @returns {{isStartingFresh: boolean, startFreshCallback: ((function(): void)|*)}} Hook values.
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (redirectUri => {
  const [isStartingFresh, setIsStartingFresh] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
  const isActionInProgress = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select(_state_store__WEBPACK_IMPORTED_MODULE_3__.STORE_ID).getIsActionInProgress(), []);
  const {
    setIsActionInProgress,
    setErrorType,
    clearErrorType
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useDispatch)(_state_store__WEBPACK_IMPORTED_MODULE_3__.STORE_ID);

  /**
   * Initiate the migration.
   */
  const startFreshCallback = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(() => {
    if (!isActionInProgress) {
      (0,_tools_tracking__WEBPACK_IMPORTED_MODULE_4__["default"])('start_fresh');
      setIsActionInProgress(true);
      setIsStartingFresh(true);
      clearErrorType();
      _automattic_jetpack_api__WEBPACK_IMPORTED_MODULE_0__["default"].startIDCFresh(redirectUri).then(connectUrl => {
        window.location.href = connectUrl + '&from=idc-notice';
      }).catch(error => {
        setIsActionInProgress(false);
        setIsStartingFresh(false);
        setErrorType('start-fresh');
        throw error;
      });
    }
  }, [setIsStartingFresh, isActionInProgress, setIsActionInProgress, redirectUri, setErrorType, clearErrorType]);
  return {
    isStartingFresh,
    startFreshCallback
  };
});

/***/ }),

/***/ "../../js-packages/idc/state/actions.jsx":
/*!***********************************************!*\
  !*** ../../js-packages/idc/state/actions.jsx ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CLEAR_ERROR_TYPE": () => (/* binding */ CLEAR_ERROR_TYPE),
/* harmony export */   "SET_ERROR_TYPE": () => (/* binding */ SET_ERROR_TYPE),
/* harmony export */   "SET_IS_ACTION_IN_PROGRESS": () => (/* binding */ SET_IS_ACTION_IN_PROGRESS),
/* harmony export */   "default": () => (/* binding */ actions)
/* harmony export */ });
const SET_IS_ACTION_IN_PROGRESS = 'SET_IS_ACTION_IN_PROGRESS';
const SET_ERROR_TYPE = 'SET_ERROR_TYPE';
const CLEAR_ERROR_TYPE = 'CLEAR_ERROR_TYPE';
const actions = {
  setIsActionInProgress: isInProgress => {
    return {
      type: SET_IS_ACTION_IN_PROGRESS,
      isInProgress
    };
  },
  setErrorType: errorType => {
    return {
      type: SET_ERROR_TYPE,
      errorType
    };
  },
  clearErrorType: () => {
    return {
      type: CLEAR_ERROR_TYPE
    };
  }
};


/***/ }),

/***/ "../../js-packages/idc/state/reducers.jsx":
/*!************************************************!*\
  !*** ../../js-packages/idc/state/reducers.jsx ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _actions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./actions */ "../../js-packages/idc/state/actions.jsx");


const isActionInProgress = function () {
  let state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  let action = arguments.length > 1 ? arguments[1] : undefined;
  switch (action.type) {
    case _actions__WEBPACK_IMPORTED_MODULE_1__.SET_IS_ACTION_IN_PROGRESS:
      return action.isInProgress;
  }
  return state;
};
const errorType = function () {
  let state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  let action = arguments.length > 1 ? arguments[1] : undefined;
  switch (action.type) {
    case _actions__WEBPACK_IMPORTED_MODULE_1__.SET_ERROR_TYPE:
      return action.errorType;
    case _actions__WEBPACK_IMPORTED_MODULE_1__.CLEAR_ERROR_TYPE:
      return null;
  }
  return state;
};
const reducers = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.combineReducers)({
  isActionInProgress,
  errorType
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (reducers);

/***/ }),

/***/ "../../js-packages/idc/state/selectors.jsx":
/*!*************************************************!*\
  !*** ../../js-packages/idc/state/selectors.jsx ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const selectors = {
  getIsActionInProgress: state => state.isActionInProgress || false,
  getErrorType: state => state.errorType || null
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (selectors);

/***/ }),

/***/ "../../js-packages/idc/state/store-holder.jsx":
/*!****************************************************!*\
  !*** ../../js-packages/idc/state/store-holder.jsx ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/defineProperty.js */ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/defineProperty.js");
/* harmony import */ var _Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_defineProperty_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);


class storeHolder {
  static mayBeInit(storeId, storeConfig) {
    if (null === storeHolder.store) {
      storeHolder.store = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.createReduxStore)(storeId, storeConfig);
      (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.register)(storeHolder.store);
    }
  }
}
_Users_tadahirookamoto_repositories_jetpack_node_modules_pnpm_babel_runtime_7_21_5_node_modules_babel_runtime_helpers_defineProperty_js__WEBPACK_IMPORTED_MODULE_0___default()(storeHolder, "store", null);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (storeHolder);

/***/ }),

/***/ "../../js-packages/idc/state/store.jsx":
/*!*********************************************!*\
  !*** ../../js-packages/idc/state/store.jsx ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "STORE_ID": () => (/* binding */ STORE_ID)
/* harmony export */ });
/* harmony import */ var _actions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./actions */ "../../js-packages/idc/state/actions.jsx");
/* harmony import */ var _reducers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reducers */ "../../js-packages/idc/state/reducers.jsx");
/* harmony import */ var _selectors__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./selectors */ "../../js-packages/idc/state/selectors.jsx");
/* harmony import */ var _store_holder__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./store-holder */ "../../js-packages/idc/state/store-holder.jsx");




const STORE_ID = 'jetpack-idc';
_store_holder__WEBPACK_IMPORTED_MODULE_0__["default"].mayBeInit(STORE_ID, {
  reducer: _reducers__WEBPACK_IMPORTED_MODULE_1__["default"],
  actions: _actions__WEBPACK_IMPORTED_MODULE_2__["default"],
  selectors: _selectors__WEBPACK_IMPORTED_MODULE_3__["default"]
});


/***/ }),

/***/ "../../js-packages/idc/tools/custom-content-shape.jsx":
/*!************************************************************!*\
  !*** ../../js-packages/idc/tools/custom-content-shape.jsx ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! prop-types */ "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  /** The header text, 'Safe Mode' by default. */
  headerText: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** Alt attribute for the custom logo image. */
  logoAlt: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The main screen title. */
  mainTitle: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The main screen body text. */
  mainBodyText: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "migration finished" screen title. */
  migratedTitle: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "migration finished" screen body text. */
  migratedBodyText: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The migration card title. */
  migrateCardTitle: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The migration card button label. */
  migrateButtonLabel: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The migration card body. */
  migrateCardBodyText: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "start fresh" card title. */
  startFreshCardTitle: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "start fresh" card body. */
  startFreshCardBodyText: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "start fresh" card button label. */
  startFreshButtonLabel: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "non admin" screen title. */
  nonAdminTitle: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The "non admin" screen body text. */
  nonAdminBodyText: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string),
  /** The support page URL. */
  supportURL: (prop_types__WEBPACK_IMPORTED_MODULE_0___default().string)
});

/***/ }),

/***/ "../../js-packages/idc/tools/extract-hostname.jsx":
/*!********************************************************!*\
  !*** ../../js-packages/idc/tools/extract-hostname.jsx ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Extract hostname from an URL if needed.
 *
 * @param {string} url - The URL to extract hostname from.
 * @returns {string} The hostname extracted from the URL.
 */
const extractHostname = url => /^https?:\/\//.test(url) ? new URL(url).hostname : url.replace(/\/$/, '');
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (extractHostname);

/***/ }),

/***/ "../../js-packages/idc/tools/tracking.jsx":
/*!************************************************!*\
  !*** ../../js-packages/idc/tools/tracking.jsx ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ trackAndBumpMCStats),
/* harmony export */   "initializeAnalytics": () => (/* binding */ initializeAnalytics)
/* harmony export */ });
/* harmony import */ var _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @automattic/jetpack-analytics */ "../../js-packages/analytics/index.jsx");


/**
 * Initialize the analytics object.
 *
 * @param {object} tracksEventData - Tracks data.
 * @param {object} tracksUserData - User data.
 */
function initializeAnalytics(tracksEventData, tracksUserData) {
  if (tracksUserData && tracksUserData.hasOwnProperty('userid') && tracksUserData.hasOwnProperty('username')) {
    _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].initialize(tracksUserData.userid, tracksUserData.username);
  }
  if (tracksEventData) {
    if (tracksEventData.hasOwnProperty('blogID')) {
      _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].assignSuperProps({
        blog_id: tracksEventData.blogID
      });
    }
    if (tracksEventData.hasOwnProperty('platform')) {
      _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].assignSuperProps({
        platform: tracksEventData.platform
      });
    }
  }
  _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].setMcAnalyticsEnabled(true);
}

/**
 * This function will fire both a Tracks and MC stat.
 * It will make sure to format the event name properly for the given stat home.
 *
 * Tracks Will be prefixed by 'jetpack_idc_' and use underscores.
 * MC Will not be prefixed, and will use dashes.
 *
 * @param {string} eventName - name.
 * @param {object} extraProps - extra props.
 */
function trackAndBumpMCStats(eventName) {
  let extraProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if ('undefined' === typeof extraProps || 'object' !== typeof extraProps) {
    extraProps = {};
  }
  if (eventName && eventName.length && 'undefined' !== typeof _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"] && _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].tracks && _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].mc) {
    // Format for Tracks
    eventName = eventName.replace(/-/g, '_');
    eventName = eventName.indexOf('jetpack_idc_') !== 0 ? 'jetpack_idc_' + eventName : eventName;
    _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].tracks.recordEvent(eventName, extraProps);

    // Now format for MC stats
    eventName = eventName.replace('jetpack_idc_', '');
    eventName = eventName.replace(/_/g, '-');
    _automattic_jetpack_analytics__WEBPACK_IMPORTED_MODULE_0__["default"].mc.bumpStat('jetpack-idc', eventName);
  }
}

/***/ }),

/***/ "jetpackConfig":
/*!**********************************************************!*\
  !*** external "{\"consumer_slug\":\"identity_crisis\"}" ***!
  \**********************************************************/
/***/ ((module) => {

"use strict";
if(typeof {"consumer_slug":"identity_crisis"} === 'undefined') { var e = new Error("Cannot find module '{\"consumer_slug\":\"identity_crisis\"}'"); e.code = 'MODULE_NOT_FOUND'; throw e; }

module.exports = {"consumer_slug":"identity_crisis"};

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = window["React"];

/***/ }),

/***/ "@wordpress/components":
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = window["wp"]["components"];

/***/ }),

/***/ "@wordpress/compose":
/*!*********************************!*\
  !*** external ["wp","compose"] ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = window["wp"]["compose"];

/***/ }),

/***/ "@wordpress/data":
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = window["wp"]["data"];

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = window["wp"]["element"];

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = window["wp"]["i18n"];

/***/ }),

/***/ "@wordpress/url":
/*!*****************************!*\
  !*** external ["wp","url"] ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = window["wp"]["url"];

/***/ }),

/***/ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/defineProperty.js":
/*!***************************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toPropertyKey = __webpack_require__(/*! ./toPropertyKey.js */ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/toPropertyKey.js");
function _defineProperty(obj, key, value) {
  key = toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/extends.js":
/*!********************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/extends.js ***!
  \********************************************************************************************************/
/***/ ((module) => {

function _extends() {
  module.exports = _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  return _extends.apply(this, arguments);
}
module.exports = _extends, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/toPrimitive.js":
/*!************************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/toPrimitive.js ***!
  \************************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(/*! ./typeof.js */ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/typeof.js")["default"]);
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
module.exports = _toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/toPropertyKey.js":
/*!**************************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/toPropertyKey.js ***!
  \**************************************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(/*! ./typeof.js */ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/typeof.js")["default"]);
var toPrimitive = __webpack_require__(/*! ./toPrimitive.js */ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/toPrimitive.js");
function _toPropertyKey(arg) {
  var key = toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
module.exports = _toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ "../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/typeof.js":
/*!*******************************************************************************************************!*\
  !*** ../../../node_modules/.pnpm/@babel+runtime@7.21.5/node_modules/@babel/runtime/helpers/typeof.js ***!
  \*******************************************************************************************************/
/***/ ((module) => {

function _typeof(obj) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(obj);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!****************************!*\
  !*** ./src/_inc/admin.jsx ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _automattic_jetpack_idc__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @automattic/jetpack-idc */ "../../js-packages/idc/components/idc-screen/index.jsx");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _admin_bar_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./admin-bar.scss */ "./src/_inc/admin-bar.scss");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./style.scss */ "./src/_inc/style.scss");






/**
 * The initial renderer function.
 */
function render() {
  const container = document.getElementById('jp-identity-crisis-container');
  if (null === container || !window.hasOwnProperty('JP_IDENTITY_CRISIS__INITIAL_STATE')) {
    return;
  }
  const {
    WP_API_root,
    WP_API_nonce,
    wpcomHomeUrl,
    currentUrl,
    redirectUri,
    tracksUserData,
    tracksEventData,
    isSafeModeConfirmed,
    consumerData,
    isAdmin,
    possibleDynamicSiteUrlDetected
  } = window.JP_IDENTITY_CRISIS__INITIAL_STATE;
  if (!isSafeModeConfirmed) {
    // @todo: Remove fallback when we drop support for WP 6.1
    const component = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_1___default().createElement(_automattic_jetpack_idc__WEBPACK_IMPORTED_MODULE_4__["default"], {
      wpcomHomeUrl: wpcomHomeUrl,
      currentUrl: currentUrl,
      apiRoot: WP_API_root,
      apiNonce: WP_API_nonce,
      redirectUri: redirectUri,
      tracksUserData: tracksUserData || {},
      tracksEventData: tracksEventData,
      customContent: consumerData.hasOwnProperty('customContent') ? consumerData.customContent : {},
      isAdmin: isAdmin,
      logo: consumerData.hasOwnProperty('logo') ? consumerData.logo : undefined,
      possibleDynamicSiteUrlDetected: possibleDynamicSiteUrlDetected
    });
    if (_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createRoot) {
      _wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createRoot(container).render(component);
    } else {
      _wordpress_element__WEBPACK_IMPORTED_MODULE_0__.render(component, container);
    }
  }
}
render();
})();

/******/ })()
;
//# sourceMappingURL=index.js.map