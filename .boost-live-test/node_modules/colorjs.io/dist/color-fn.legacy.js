var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var es_error_cause = {};

var globalThis_1;
var hasRequiredGlobalThis;

function requireGlobalThis () {
	if (hasRequiredGlobalThis) return globalThis_1;
	hasRequiredGlobalThis = 1;
	var check = function (it) {
	  return it && it.Math === Math && it;
	};

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	globalThis_1 =
	  // eslint-disable-next-line es/no-global-this -- safe
	  check(typeof globalThis == 'object' && globalThis) ||
	  check(typeof window == 'object' && window) ||
	  // eslint-disable-next-line no-restricted-globals -- safe
	  check(typeof self == 'object' && self) ||
	  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
	  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
	  // eslint-disable-next-line no-new-func -- fallback
	  (function () { return this; })() || Function('return this')();
	return globalThis_1;
}

var objectGetOwnPropertyDescriptor = {};

var fails;
var hasRequiredFails;

function requireFails () {
	if (hasRequiredFails) return fails;
	hasRequiredFails = 1;
	fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (error) {
	    return true;
	  }
	};
	return fails;
}

var descriptors;
var hasRequiredDescriptors;

function requireDescriptors () {
	if (hasRequiredDescriptors) return descriptors;
	hasRequiredDescriptors = 1;
	var fails = requireFails();

	// Detect IE8's incomplete defineProperty implementation
	descriptors = !fails(function () {
	  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
	  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] !== 7;
	});
	return descriptors;
}

var functionBindNative;
var hasRequiredFunctionBindNative;

function requireFunctionBindNative () {
	if (hasRequiredFunctionBindNative) return functionBindNative;
	hasRequiredFunctionBindNative = 1;
	var fails = requireFails();

	functionBindNative = !fails(function () {
	  // eslint-disable-next-line es/no-function-prototype-bind -- safe
	  var test = (function () { /* empty */ }).bind();
	  // eslint-disable-next-line no-prototype-builtins -- safe
	  return typeof test != 'function' || test.hasOwnProperty('prototype');
	});
	return functionBindNative;
}

var functionCall;
var hasRequiredFunctionCall;

function requireFunctionCall () {
	if (hasRequiredFunctionCall) return functionCall;
	hasRequiredFunctionCall = 1;
	var NATIVE_BIND = requireFunctionBindNative();

	var call = Function.prototype.call;

	functionCall = NATIVE_BIND ? call.bind(call) : function () {
	  return call.apply(call, arguments);
	};
	return functionCall;
}

var objectPropertyIsEnumerable = {};

var hasRequiredObjectPropertyIsEnumerable;

function requireObjectPropertyIsEnumerable () {
	if (hasRequiredObjectPropertyIsEnumerable) return objectPropertyIsEnumerable;
	hasRequiredObjectPropertyIsEnumerable = 1;
	var $propertyIsEnumerable = {}.propertyIsEnumerable;
	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// Nashorn ~ JDK8 bug
	var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({ 1: 2 }, 1);

	// `Object.prototype.propertyIsEnumerable` method implementation
	// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
	objectPropertyIsEnumerable.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
	  var descriptor = getOwnPropertyDescriptor(this, V);
	  return !!descriptor && descriptor.enumerable;
	} : $propertyIsEnumerable;
	return objectPropertyIsEnumerable;
}

var createPropertyDescriptor;
var hasRequiredCreatePropertyDescriptor;

function requireCreatePropertyDescriptor () {
	if (hasRequiredCreatePropertyDescriptor) return createPropertyDescriptor;
	hasRequiredCreatePropertyDescriptor = 1;
	createPropertyDescriptor = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};
	return createPropertyDescriptor;
}

var functionUncurryThis;
var hasRequiredFunctionUncurryThis;

function requireFunctionUncurryThis () {
	if (hasRequiredFunctionUncurryThis) return functionUncurryThis;
	hasRequiredFunctionUncurryThis = 1;
	var NATIVE_BIND = requireFunctionBindNative();

	var FunctionPrototype = Function.prototype;
	var call = FunctionPrototype.call;
	var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);

	functionUncurryThis = NATIVE_BIND ? uncurryThisWithBind : function (fn) {
	  return function () {
	    return call.apply(fn, arguments);
	  };
	};
	return functionUncurryThis;
}

var classofRaw;
var hasRequiredClassofRaw;

function requireClassofRaw () {
	if (hasRequiredClassofRaw) return classofRaw;
	hasRequiredClassofRaw = 1;
	var uncurryThis = requireFunctionUncurryThis();

	var toString = uncurryThis({}.toString);
	var stringSlice = uncurryThis(''.slice);

	classofRaw = function (it) {
	  return stringSlice(toString(it), 8, -1);
	};
	return classofRaw;
}

var indexedObject;
var hasRequiredIndexedObject;

function requireIndexedObject () {
	if (hasRequiredIndexedObject) return indexedObject;
	hasRequiredIndexedObject = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var fails = requireFails();
	var classof = requireClassofRaw();

	var $Object = Object;
	var split = uncurryThis(''.split);

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	indexedObject = fails(function () {
	  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
	  // eslint-disable-next-line no-prototype-builtins -- safe
	  return !$Object('z').propertyIsEnumerable(0);
	}) ? function (it) {
	  return classof(it) === 'String' ? split(it, '') : $Object(it);
	} : $Object;
	return indexedObject;
}

var isNullOrUndefined;
var hasRequiredIsNullOrUndefined;

function requireIsNullOrUndefined () {
	if (hasRequiredIsNullOrUndefined) return isNullOrUndefined;
	hasRequiredIsNullOrUndefined = 1;
	// we can't use just `it == null` since of `document.all` special case
	// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-aec
	isNullOrUndefined = function (it) {
	  return it === null || it === undefined;
	};
	return isNullOrUndefined;
}

var requireObjectCoercible;
var hasRequiredRequireObjectCoercible;

function requireRequireObjectCoercible () {
	if (hasRequiredRequireObjectCoercible) return requireObjectCoercible;
	hasRequiredRequireObjectCoercible = 1;
	var isNullOrUndefined = requireIsNullOrUndefined();

	var $TypeError = TypeError;

	// `RequireObjectCoercible` abstract operation
	// https://tc39.es/ecma262/#sec-requireobjectcoercible
	requireObjectCoercible = function (it) {
	  if (isNullOrUndefined(it)) throw new $TypeError("Can't call method on " + it);
	  return it;
	};
	return requireObjectCoercible;
}

var toIndexedObject;
var hasRequiredToIndexedObject;

function requireToIndexedObject () {
	if (hasRequiredToIndexedObject) return toIndexedObject;
	hasRequiredToIndexedObject = 1;
	// toObject with fallback for non-array-like ES3 strings
	var IndexedObject = requireIndexedObject();
	var requireObjectCoercible = requireRequireObjectCoercible();

	toIndexedObject = function (it) {
	  return IndexedObject(requireObjectCoercible(it));
	};
	return toIndexedObject;
}

var isCallable;
var hasRequiredIsCallable;

function requireIsCallable () {
	if (hasRequiredIsCallable) return isCallable;
	hasRequiredIsCallable = 1;
	// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
	var documentAll = typeof document == 'object' && document.all;

	// `IsCallable` abstract operation
	// https://tc39.es/ecma262/#sec-iscallable
	// eslint-disable-next-line unicorn/no-typeof-undefined -- required for testing
	isCallable = typeof documentAll == 'undefined' && documentAll !== undefined ? function (argument) {
	  return typeof argument == 'function' || argument === documentAll;
	} : function (argument) {
	  return typeof argument == 'function';
	};
	return isCallable;
}

var isObject;
var hasRequiredIsObject;

function requireIsObject () {
	if (hasRequiredIsObject) return isObject;
	hasRequiredIsObject = 1;
	var isCallable = requireIsCallable();

	isObject = function (it) {
	  return typeof it == 'object' ? it !== null : isCallable(it);
	};
	return isObject;
}

var getBuiltIn;
var hasRequiredGetBuiltIn;

function requireGetBuiltIn () {
	if (hasRequiredGetBuiltIn) return getBuiltIn;
	hasRequiredGetBuiltIn = 1;
	var globalThis = requireGlobalThis();
	var isCallable = requireIsCallable();

	var aFunction = function (argument) {
	  return isCallable(argument) ? argument : undefined;
	};

	getBuiltIn = function (namespace, method) {
	  return arguments.length < 2 ? aFunction(globalThis[namespace]) : globalThis[namespace] && globalThis[namespace][method];
	};
	return getBuiltIn;
}

var objectIsPrototypeOf;
var hasRequiredObjectIsPrototypeOf;

function requireObjectIsPrototypeOf () {
	if (hasRequiredObjectIsPrototypeOf) return objectIsPrototypeOf;
	hasRequiredObjectIsPrototypeOf = 1;
	var uncurryThis = requireFunctionUncurryThis();

	objectIsPrototypeOf = uncurryThis({}.isPrototypeOf);
	return objectIsPrototypeOf;
}

var environmentUserAgent;
var hasRequiredEnvironmentUserAgent;

function requireEnvironmentUserAgent () {
	if (hasRequiredEnvironmentUserAgent) return environmentUserAgent;
	hasRequiredEnvironmentUserAgent = 1;
	var globalThis = requireGlobalThis();

	var navigator = globalThis.navigator;
	var userAgent = navigator && navigator.userAgent;

	environmentUserAgent = userAgent ? String(userAgent) : '';
	return environmentUserAgent;
}

var environmentV8Version;
var hasRequiredEnvironmentV8Version;

function requireEnvironmentV8Version () {
	if (hasRequiredEnvironmentV8Version) return environmentV8Version;
	hasRequiredEnvironmentV8Version = 1;
	var globalThis = requireGlobalThis();
	var userAgent = requireEnvironmentUserAgent();

	var process = globalThis.process;
	var Deno = globalThis.Deno;
	var versions = process && process.versions || Deno && Deno.version;
	var v8 = versions && versions.v8;
	var match, version;

	if (v8) {
	  match = v8.split('.');
	  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
	  // but their correct versions are not interesting for us
	  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
	}

	// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
	// so check `userAgent` even if `.v8` exists, but 0
	if (!version && userAgent) {
	  match = userAgent.match(/Edge\/(\d+)/);
	  if (!match || match[1] >= 74) {
	    match = userAgent.match(/Chrome\/(\d+)/);
	    if (match) version = +match[1];
	  }
	}

	environmentV8Version = version;
	return environmentV8Version;
}

var symbolConstructorDetection;
var hasRequiredSymbolConstructorDetection;

function requireSymbolConstructorDetection () {
	if (hasRequiredSymbolConstructorDetection) return symbolConstructorDetection;
	hasRequiredSymbolConstructorDetection = 1;
	/* eslint-disable es/no-symbol -- required for testing */
	var V8_VERSION = requireEnvironmentV8Version();
	var fails = requireFails();
	var globalThis = requireGlobalThis();

	var $String = globalThis.String;

	// eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
	symbolConstructorDetection = !!Object.getOwnPropertySymbols && !fails(function () {
	  var symbol = Symbol('symbol detection');
	  // Chrome 38 Symbol has incorrect toString conversion
	  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
	  // nb: Do not call `String` directly to avoid this being optimized out to `symbol+''` which will,
	  // of course, fail.
	  return !$String(symbol) || !(Object(symbol) instanceof Symbol) ||
	    // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
	    !Symbol.sham && V8_VERSION && V8_VERSION < 41;
	});
	return symbolConstructorDetection;
}

var useSymbolAsUid;
var hasRequiredUseSymbolAsUid;

function requireUseSymbolAsUid () {
	if (hasRequiredUseSymbolAsUid) return useSymbolAsUid;
	hasRequiredUseSymbolAsUid = 1;
	/* eslint-disable es/no-symbol -- required for testing */
	var NATIVE_SYMBOL = requireSymbolConstructorDetection();

	useSymbolAsUid = NATIVE_SYMBOL &&
	  !Symbol.sham &&
	  typeof Symbol.iterator == 'symbol';
	return useSymbolAsUid;
}

var isSymbol;
var hasRequiredIsSymbol;

function requireIsSymbol () {
	if (hasRequiredIsSymbol) return isSymbol;
	hasRequiredIsSymbol = 1;
	var getBuiltIn = requireGetBuiltIn();
	var isCallable = requireIsCallable();
	var isPrototypeOf = requireObjectIsPrototypeOf();
	var USE_SYMBOL_AS_UID = requireUseSymbolAsUid();

	var $Object = Object;

	isSymbol = USE_SYMBOL_AS_UID ? function (it) {
	  return typeof it == 'symbol';
	} : function (it) {
	  var $Symbol = getBuiltIn('Symbol');
	  return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, $Object(it));
	};
	return isSymbol;
}

var tryToString;
var hasRequiredTryToString;

function requireTryToString () {
	if (hasRequiredTryToString) return tryToString;
	hasRequiredTryToString = 1;
	var $String = String;

	tryToString = function (argument) {
	  try {
	    return $String(argument);
	  } catch (error) {
	    return 'Object';
	  }
	};
	return tryToString;
}

var aCallable;
var hasRequiredACallable;

function requireACallable () {
	if (hasRequiredACallable) return aCallable;
	hasRequiredACallable = 1;
	var isCallable = requireIsCallable();
	var tryToString = requireTryToString();

	var $TypeError = TypeError;

	// `Assert: IsCallable(argument) is true`
	aCallable = function (argument) {
	  if (isCallable(argument)) return argument;
	  throw new $TypeError(tryToString(argument) + ' is not a function');
	};
	return aCallable;
}

var getMethod;
var hasRequiredGetMethod;

function requireGetMethod () {
	if (hasRequiredGetMethod) return getMethod;
	hasRequiredGetMethod = 1;
	var aCallable = requireACallable();
	var isNullOrUndefined = requireIsNullOrUndefined();

	// `GetMethod` abstract operation
	// https://tc39.es/ecma262/#sec-getmethod
	getMethod = function (V, P) {
	  var func = V[P];
	  return isNullOrUndefined(func) ? undefined : aCallable(func);
	};
	return getMethod;
}

var ordinaryToPrimitive;
var hasRequiredOrdinaryToPrimitive;

function requireOrdinaryToPrimitive () {
	if (hasRequiredOrdinaryToPrimitive) return ordinaryToPrimitive;
	hasRequiredOrdinaryToPrimitive = 1;
	var call = requireFunctionCall();
	var isCallable = requireIsCallable();
	var isObject = requireIsObject();

	var $TypeError = TypeError;

	// `OrdinaryToPrimitive` abstract operation
	// https://tc39.es/ecma262/#sec-ordinarytoprimitive
	ordinaryToPrimitive = function (input, pref) {
	  var fn, val;
	  if (pref === 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
	  if (isCallable(fn = input.valueOf) && !isObject(val = call(fn, input))) return val;
	  if (pref !== 'string' && isCallable(fn = input.toString) && !isObject(val = call(fn, input))) return val;
	  throw new $TypeError("Can't convert object to primitive value");
	};
	return ordinaryToPrimitive;
}

var sharedStore = {exports: {}};

var isPure;
var hasRequiredIsPure;

function requireIsPure () {
	if (hasRequiredIsPure) return isPure;
	hasRequiredIsPure = 1;
	isPure = false;
	return isPure;
}

var defineGlobalProperty;
var hasRequiredDefineGlobalProperty;

function requireDefineGlobalProperty () {
	if (hasRequiredDefineGlobalProperty) return defineGlobalProperty;
	hasRequiredDefineGlobalProperty = 1;
	var globalThis = requireGlobalThis();

	// eslint-disable-next-line es/no-object-defineproperty -- safe
	var defineProperty = Object.defineProperty;

	defineGlobalProperty = function (key, value) {
	  try {
	    defineProperty(globalThis, key, { value: value, configurable: true, writable: true });
	  } catch (error) {
	    globalThis[key] = value;
	  } return value;
	};
	return defineGlobalProperty;
}

var hasRequiredSharedStore;

function requireSharedStore () {
	if (hasRequiredSharedStore) return sharedStore.exports;
	hasRequiredSharedStore = 1;
	var IS_PURE = requireIsPure();
	var globalThis = requireGlobalThis();
	var defineGlobalProperty = requireDefineGlobalProperty();

	var SHARED = '__core-js_shared__';
	var store = sharedStore.exports = globalThis[SHARED] || defineGlobalProperty(SHARED, {});

	(store.versions || (store.versions = [])).push({
	  version: '3.39.0',
	  mode: IS_PURE ? 'pure' : 'global',
	  copyright: '© 2014-2024 Denis Pushkarev (zloirock.ru)',
	  license: 'https://github.com/zloirock/core-js/blob/v3.39.0/LICENSE',
	  source: 'https://github.com/zloirock/core-js'
	});
	return sharedStore.exports;
}

var shared;
var hasRequiredShared;

function requireShared () {
	if (hasRequiredShared) return shared;
	hasRequiredShared = 1;
	var store = requireSharedStore();

	shared = function (key, value) {
	  return store[key] || (store[key] = value || {});
	};
	return shared;
}

var toObject;
var hasRequiredToObject;

function requireToObject () {
	if (hasRequiredToObject) return toObject;
	hasRequiredToObject = 1;
	var requireObjectCoercible = requireRequireObjectCoercible();

	var $Object = Object;

	// `ToObject` abstract operation
	// https://tc39.es/ecma262/#sec-toobject
	toObject = function (argument) {
	  return $Object(requireObjectCoercible(argument));
	};
	return toObject;
}

var hasOwnProperty_1;
var hasRequiredHasOwnProperty;

function requireHasOwnProperty () {
	if (hasRequiredHasOwnProperty) return hasOwnProperty_1;
	hasRequiredHasOwnProperty = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var toObject = requireToObject();

	var hasOwnProperty = uncurryThis({}.hasOwnProperty);

	// `HasOwnProperty` abstract operation
	// https://tc39.es/ecma262/#sec-hasownproperty
	// eslint-disable-next-line es/no-object-hasown -- safe
	hasOwnProperty_1 = Object.hasOwn || function hasOwn(it, key) {
	  return hasOwnProperty(toObject(it), key);
	};
	return hasOwnProperty_1;
}

var uid;
var hasRequiredUid;

function requireUid () {
	if (hasRequiredUid) return uid;
	hasRequiredUid = 1;
	var uncurryThis = requireFunctionUncurryThis();

	var id = 0;
	var postfix = Math.random();
	var toString = uncurryThis(1.0.toString);

	uid = function (key) {
	  return 'Symbol(' + (key === undefined ? '' : key) + ')_' + toString(++id + postfix, 36);
	};
	return uid;
}

var wellKnownSymbol;
var hasRequiredWellKnownSymbol;

function requireWellKnownSymbol () {
	if (hasRequiredWellKnownSymbol) return wellKnownSymbol;
	hasRequiredWellKnownSymbol = 1;
	var globalThis = requireGlobalThis();
	var shared = requireShared();
	var hasOwn = requireHasOwnProperty();
	var uid = requireUid();
	var NATIVE_SYMBOL = requireSymbolConstructorDetection();
	var USE_SYMBOL_AS_UID = requireUseSymbolAsUid();

	var Symbol = globalThis.Symbol;
	var WellKnownSymbolsStore = shared('wks');
	var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol['for'] || Symbol : Symbol && Symbol.withoutSetter || uid;

	wellKnownSymbol = function (name) {
	  if (!hasOwn(WellKnownSymbolsStore, name)) {
	    WellKnownSymbolsStore[name] = NATIVE_SYMBOL && hasOwn(Symbol, name)
	      ? Symbol[name]
	      : createWellKnownSymbol('Symbol.' + name);
	  } return WellKnownSymbolsStore[name];
	};
	return wellKnownSymbol;
}

var toPrimitive;
var hasRequiredToPrimitive;

function requireToPrimitive () {
	if (hasRequiredToPrimitive) return toPrimitive;
	hasRequiredToPrimitive = 1;
	var call = requireFunctionCall();
	var isObject = requireIsObject();
	var isSymbol = requireIsSymbol();
	var getMethod = requireGetMethod();
	var ordinaryToPrimitive = requireOrdinaryToPrimitive();
	var wellKnownSymbol = requireWellKnownSymbol();

	var $TypeError = TypeError;
	var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');

	// `ToPrimitive` abstract operation
	// https://tc39.es/ecma262/#sec-toprimitive
	toPrimitive = function (input, pref) {
	  if (!isObject(input) || isSymbol(input)) return input;
	  var exoticToPrim = getMethod(input, TO_PRIMITIVE);
	  var result;
	  if (exoticToPrim) {
	    if (pref === undefined) pref = 'default';
	    result = call(exoticToPrim, input, pref);
	    if (!isObject(result) || isSymbol(result)) return result;
	    throw new $TypeError("Can't convert object to primitive value");
	  }
	  if (pref === undefined) pref = 'number';
	  return ordinaryToPrimitive(input, pref);
	};
	return toPrimitive;
}

var toPropertyKey;
var hasRequiredToPropertyKey;

function requireToPropertyKey () {
	if (hasRequiredToPropertyKey) return toPropertyKey;
	hasRequiredToPropertyKey = 1;
	var toPrimitive = requireToPrimitive();
	var isSymbol = requireIsSymbol();

	// `ToPropertyKey` abstract operation
	// https://tc39.es/ecma262/#sec-topropertykey
	toPropertyKey = function (argument) {
	  var key = toPrimitive(argument, 'string');
	  return isSymbol(key) ? key : key + '';
	};
	return toPropertyKey;
}

var documentCreateElement;
var hasRequiredDocumentCreateElement;

function requireDocumentCreateElement () {
	if (hasRequiredDocumentCreateElement) return documentCreateElement;
	hasRequiredDocumentCreateElement = 1;
	var globalThis = requireGlobalThis();
	var isObject = requireIsObject();

	var document = globalThis.document;
	// typeof document.createElement is 'object' in old IE
	var EXISTS = isObject(document) && isObject(document.createElement);

	documentCreateElement = function (it) {
	  return EXISTS ? document.createElement(it) : {};
	};
	return documentCreateElement;
}

var ie8DomDefine;
var hasRequiredIe8DomDefine;

function requireIe8DomDefine () {
	if (hasRequiredIe8DomDefine) return ie8DomDefine;
	hasRequiredIe8DomDefine = 1;
	var DESCRIPTORS = requireDescriptors();
	var fails = requireFails();
	var createElement = requireDocumentCreateElement();

	// Thanks to IE8 for its funny defineProperty
	ie8DomDefine = !DESCRIPTORS && !fails(function () {
	  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
	  return Object.defineProperty(createElement('div'), 'a', {
	    get: function () { return 7; }
	  }).a !== 7;
	});
	return ie8DomDefine;
}

var hasRequiredObjectGetOwnPropertyDescriptor;

function requireObjectGetOwnPropertyDescriptor () {
	if (hasRequiredObjectGetOwnPropertyDescriptor) return objectGetOwnPropertyDescriptor;
	hasRequiredObjectGetOwnPropertyDescriptor = 1;
	var DESCRIPTORS = requireDescriptors();
	var call = requireFunctionCall();
	var propertyIsEnumerableModule = requireObjectPropertyIsEnumerable();
	var createPropertyDescriptor = requireCreatePropertyDescriptor();
	var toIndexedObject = requireToIndexedObject();
	var toPropertyKey = requireToPropertyKey();
	var hasOwn = requireHasOwnProperty();
	var IE8_DOM_DEFINE = requireIe8DomDefine();

	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// `Object.getOwnPropertyDescriptor` method
	// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
	objectGetOwnPropertyDescriptor.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
	  O = toIndexedObject(O);
	  P = toPropertyKey(P);
	  if (IE8_DOM_DEFINE) try {
	    return $getOwnPropertyDescriptor(O, P);
	  } catch (error) { /* empty */ }
	  if (hasOwn(O, P)) return createPropertyDescriptor(!call(propertyIsEnumerableModule.f, O, P), O[P]);
	};
	return objectGetOwnPropertyDescriptor;
}

var objectDefineProperty = {};

var v8PrototypeDefineBug;
var hasRequiredV8PrototypeDefineBug;

function requireV8PrototypeDefineBug () {
	if (hasRequiredV8PrototypeDefineBug) return v8PrototypeDefineBug;
	hasRequiredV8PrototypeDefineBug = 1;
	var DESCRIPTORS = requireDescriptors();
	var fails = requireFails();

	// V8 ~ Chrome 36-
	// https://bugs.chromium.org/p/v8/issues/detail?id=3334
	v8PrototypeDefineBug = DESCRIPTORS && fails(function () {
	  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
	  return Object.defineProperty(function () { /* empty */ }, 'prototype', {
	    value: 42,
	    writable: false
	  }).prototype !== 42;
	});
	return v8PrototypeDefineBug;
}

var anObject;
var hasRequiredAnObject;

function requireAnObject () {
	if (hasRequiredAnObject) return anObject;
	hasRequiredAnObject = 1;
	var isObject = requireIsObject();

	var $String = String;
	var $TypeError = TypeError;

	// `Assert: Type(argument) is Object`
	anObject = function (argument) {
	  if (isObject(argument)) return argument;
	  throw new $TypeError($String(argument) + ' is not an object');
	};
	return anObject;
}

var hasRequiredObjectDefineProperty;

function requireObjectDefineProperty () {
	if (hasRequiredObjectDefineProperty) return objectDefineProperty;
	hasRequiredObjectDefineProperty = 1;
	var DESCRIPTORS = requireDescriptors();
	var IE8_DOM_DEFINE = requireIe8DomDefine();
	var V8_PROTOTYPE_DEFINE_BUG = requireV8PrototypeDefineBug();
	var anObject = requireAnObject();
	var toPropertyKey = requireToPropertyKey();

	var $TypeError = TypeError;
	// eslint-disable-next-line es/no-object-defineproperty -- safe
	var $defineProperty = Object.defineProperty;
	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	var ENUMERABLE = 'enumerable';
	var CONFIGURABLE = 'configurable';
	var WRITABLE = 'writable';

	// `Object.defineProperty` method
	// https://tc39.es/ecma262/#sec-object.defineproperty
	objectDefineProperty.f = DESCRIPTORS ? V8_PROTOTYPE_DEFINE_BUG ? function defineProperty(O, P, Attributes) {
	  anObject(O);
	  P = toPropertyKey(P);
	  anObject(Attributes);
	  if (typeof O === 'function' && P === 'prototype' && 'value' in Attributes && WRITABLE in Attributes && !Attributes[WRITABLE]) {
	    var current = $getOwnPropertyDescriptor(O, P);
	    if (current && current[WRITABLE]) {
	      O[P] = Attributes.value;
	      Attributes = {
	        configurable: CONFIGURABLE in Attributes ? Attributes[CONFIGURABLE] : current[CONFIGURABLE],
	        enumerable: ENUMERABLE in Attributes ? Attributes[ENUMERABLE] : current[ENUMERABLE],
	        writable: false
	      };
	    }
	  } return $defineProperty(O, P, Attributes);
	} : $defineProperty : function defineProperty(O, P, Attributes) {
	  anObject(O);
	  P = toPropertyKey(P);
	  anObject(Attributes);
	  if (IE8_DOM_DEFINE) try {
	    return $defineProperty(O, P, Attributes);
	  } catch (error) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw new $TypeError('Accessors not supported');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};
	return objectDefineProperty;
}

var createNonEnumerableProperty;
var hasRequiredCreateNonEnumerableProperty;

function requireCreateNonEnumerableProperty () {
	if (hasRequiredCreateNonEnumerableProperty) return createNonEnumerableProperty;
	hasRequiredCreateNonEnumerableProperty = 1;
	var DESCRIPTORS = requireDescriptors();
	var definePropertyModule = requireObjectDefineProperty();
	var createPropertyDescriptor = requireCreatePropertyDescriptor();

	createNonEnumerableProperty = DESCRIPTORS ? function (object, key, value) {
	  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};
	return createNonEnumerableProperty;
}

var makeBuiltIn = {exports: {}};

var functionName;
var hasRequiredFunctionName;

function requireFunctionName () {
	if (hasRequiredFunctionName) return functionName;
	hasRequiredFunctionName = 1;
	var DESCRIPTORS = requireDescriptors();
	var hasOwn = requireHasOwnProperty();

	var FunctionPrototype = Function.prototype;
	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;

	var EXISTS = hasOwn(FunctionPrototype, 'name');
	// additional protection from minified / mangled / dropped function names
	var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
	var CONFIGURABLE = EXISTS && (!DESCRIPTORS || (DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable));

	functionName = {
	  EXISTS: EXISTS,
	  PROPER: PROPER,
	  CONFIGURABLE: CONFIGURABLE
	};
	return functionName;
}

var inspectSource;
var hasRequiredInspectSource;

function requireInspectSource () {
	if (hasRequiredInspectSource) return inspectSource;
	hasRequiredInspectSource = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var isCallable = requireIsCallable();
	var store = requireSharedStore();

	var functionToString = uncurryThis(Function.toString);

	// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
	if (!isCallable(store.inspectSource)) {
	  store.inspectSource = function (it) {
	    return functionToString(it);
	  };
	}

	inspectSource = store.inspectSource;
	return inspectSource;
}

var weakMapBasicDetection;
var hasRequiredWeakMapBasicDetection;

function requireWeakMapBasicDetection () {
	if (hasRequiredWeakMapBasicDetection) return weakMapBasicDetection;
	hasRequiredWeakMapBasicDetection = 1;
	var globalThis = requireGlobalThis();
	var isCallable = requireIsCallable();

	var WeakMap = globalThis.WeakMap;

	weakMapBasicDetection = isCallable(WeakMap) && /native code/.test(String(WeakMap));
	return weakMapBasicDetection;
}

var sharedKey;
var hasRequiredSharedKey;

function requireSharedKey () {
	if (hasRequiredSharedKey) return sharedKey;
	hasRequiredSharedKey = 1;
	var shared = requireShared();
	var uid = requireUid();

	var keys = shared('keys');

	sharedKey = function (key) {
	  return keys[key] || (keys[key] = uid(key));
	};
	return sharedKey;
}

var hiddenKeys;
var hasRequiredHiddenKeys;

function requireHiddenKeys () {
	if (hasRequiredHiddenKeys) return hiddenKeys;
	hasRequiredHiddenKeys = 1;
	hiddenKeys = {};
	return hiddenKeys;
}

var internalState;
var hasRequiredInternalState;

function requireInternalState () {
	if (hasRequiredInternalState) return internalState;
	hasRequiredInternalState = 1;
	var NATIVE_WEAK_MAP = requireWeakMapBasicDetection();
	var globalThis = requireGlobalThis();
	var isObject = requireIsObject();
	var createNonEnumerableProperty = requireCreateNonEnumerableProperty();
	var hasOwn = requireHasOwnProperty();
	var shared = requireSharedStore();
	var sharedKey = requireSharedKey();
	var hiddenKeys = requireHiddenKeys();

	var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
	var TypeError = globalThis.TypeError;
	var WeakMap = globalThis.WeakMap;
	var set, get, has;

	var enforce = function (it) {
	  return has(it) ? get(it) : set(it, {});
	};

	var getterFor = function (TYPE) {
	  return function (it) {
	    var state;
	    if (!isObject(it) || (state = get(it)).type !== TYPE) {
	      throw new TypeError('Incompatible receiver, ' + TYPE + ' required');
	    } return state;
	  };
	};

	if (NATIVE_WEAK_MAP || shared.state) {
	  var store = shared.state || (shared.state = new WeakMap());
	  /* eslint-disable no-self-assign -- prototype methods protection */
	  store.get = store.get;
	  store.has = store.has;
	  store.set = store.set;
	  /* eslint-enable no-self-assign -- prototype methods protection */
	  set = function (it, metadata) {
	    if (store.has(it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
	    metadata.facade = it;
	    store.set(it, metadata);
	    return metadata;
	  };
	  get = function (it) {
	    return store.get(it) || {};
	  };
	  has = function (it) {
	    return store.has(it);
	  };
	} else {
	  var STATE = sharedKey('state');
	  hiddenKeys[STATE] = true;
	  set = function (it, metadata) {
	    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
	    metadata.facade = it;
	    createNonEnumerableProperty(it, STATE, metadata);
	    return metadata;
	  };
	  get = function (it) {
	    return hasOwn(it, STATE) ? it[STATE] : {};
	  };
	  has = function (it) {
	    return hasOwn(it, STATE);
	  };
	}

	internalState = {
	  set: set,
	  get: get,
	  has: has,
	  enforce: enforce,
	  getterFor: getterFor
	};
	return internalState;
}

var hasRequiredMakeBuiltIn;

function requireMakeBuiltIn () {
	if (hasRequiredMakeBuiltIn) return makeBuiltIn.exports;
	hasRequiredMakeBuiltIn = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var fails = requireFails();
	var isCallable = requireIsCallable();
	var hasOwn = requireHasOwnProperty();
	var DESCRIPTORS = requireDescriptors();
	var CONFIGURABLE_FUNCTION_NAME = requireFunctionName().CONFIGURABLE;
	var inspectSource = requireInspectSource();
	var InternalStateModule = requireInternalState();

	var enforceInternalState = InternalStateModule.enforce;
	var getInternalState = InternalStateModule.get;
	var $String = String;
	// eslint-disable-next-line es/no-object-defineproperty -- safe
	var defineProperty = Object.defineProperty;
	var stringSlice = uncurryThis(''.slice);
	var replace = uncurryThis(''.replace);
	var join = uncurryThis([].join);

	var CONFIGURABLE_LENGTH = DESCRIPTORS && !fails(function () {
	  return defineProperty(function () { /* empty */ }, 'length', { value: 8 }).length !== 8;
	});

	var TEMPLATE = String(String).split('String');

	var makeBuiltIn$1 = makeBuiltIn.exports = function (value, name, options) {
	  if (stringSlice($String(name), 0, 7) === 'Symbol(') {
	    name = '[' + replace($String(name), /^Symbol\(([^)]*)\).*$/, '$1') + ']';
	  }
	  if (options && options.getter) name = 'get ' + name;
	  if (options && options.setter) name = 'set ' + name;
	  if (!hasOwn(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
	    if (DESCRIPTORS) defineProperty(value, 'name', { value: name, configurable: true });
	    else value.name = name;
	  }
	  if (CONFIGURABLE_LENGTH && options && hasOwn(options, 'arity') && value.length !== options.arity) {
	    defineProperty(value, 'length', { value: options.arity });
	  }
	  try {
	    if (options && hasOwn(options, 'constructor') && options.constructor) {
	      if (DESCRIPTORS) defineProperty(value, 'prototype', { writable: false });
	    // in V8 ~ Chrome 53, prototypes of some methods, like `Array.prototype.values`, are non-writable
	    } else if (value.prototype) value.prototype = undefined;
	  } catch (error) { /* empty */ }
	  var state = enforceInternalState(value);
	  if (!hasOwn(state, 'source')) {
	    state.source = join(TEMPLATE, typeof name == 'string' ? name : '');
	  } return value;
	};

	// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	// eslint-disable-next-line no-extend-native -- required
	Function.prototype.toString = makeBuiltIn$1(function toString() {
	  return isCallable(this) && getInternalState(this).source || inspectSource(this);
	}, 'toString');
	return makeBuiltIn.exports;
}

var defineBuiltIn;
var hasRequiredDefineBuiltIn;

function requireDefineBuiltIn () {
	if (hasRequiredDefineBuiltIn) return defineBuiltIn;
	hasRequiredDefineBuiltIn = 1;
	var isCallable = requireIsCallable();
	var definePropertyModule = requireObjectDefineProperty();
	var makeBuiltIn = requireMakeBuiltIn();
	var defineGlobalProperty = requireDefineGlobalProperty();

	defineBuiltIn = function (O, key, value, options) {
	  if (!options) options = {};
	  var simple = options.enumerable;
	  var name = options.name !== undefined ? options.name : key;
	  if (isCallable(value)) makeBuiltIn(value, name, options);
	  if (options.global) {
	    if (simple) O[key] = value;
	    else defineGlobalProperty(key, value);
	  } else {
	    try {
	      if (!options.unsafe) delete O[key];
	      else if (O[key]) simple = true;
	    } catch (error) { /* empty */ }
	    if (simple) O[key] = value;
	    else definePropertyModule.f(O, key, {
	      value: value,
	      enumerable: false,
	      configurable: !options.nonConfigurable,
	      writable: !options.nonWritable
	    });
	  } return O;
	};
	return defineBuiltIn;
}

var objectGetOwnPropertyNames = {};

var mathTrunc;
var hasRequiredMathTrunc;

function requireMathTrunc () {
	if (hasRequiredMathTrunc) return mathTrunc;
	hasRequiredMathTrunc = 1;
	var ceil = Math.ceil;
	var floor = Math.floor;

	// `Math.trunc` method
	// https://tc39.es/ecma262/#sec-math.trunc
	// eslint-disable-next-line es/no-math-trunc -- safe
	mathTrunc = Math.trunc || function trunc(x) {
	  var n = +x;
	  return (n > 0 ? floor : ceil)(n);
	};
	return mathTrunc;
}

var toIntegerOrInfinity;
var hasRequiredToIntegerOrInfinity;

function requireToIntegerOrInfinity () {
	if (hasRequiredToIntegerOrInfinity) return toIntegerOrInfinity;
	hasRequiredToIntegerOrInfinity = 1;
	var trunc = requireMathTrunc();

	// `ToIntegerOrInfinity` abstract operation
	// https://tc39.es/ecma262/#sec-tointegerorinfinity
	toIntegerOrInfinity = function (argument) {
	  var number = +argument;
	  // eslint-disable-next-line no-self-compare -- NaN check
	  return number !== number || number === 0 ? 0 : trunc(number);
	};
	return toIntegerOrInfinity;
}

var toAbsoluteIndex;
var hasRequiredToAbsoluteIndex;

function requireToAbsoluteIndex () {
	if (hasRequiredToAbsoluteIndex) return toAbsoluteIndex;
	hasRequiredToAbsoluteIndex = 1;
	var toIntegerOrInfinity = requireToIntegerOrInfinity();

	var max = Math.max;
	var min = Math.min;

	// Helper for a popular repeating case of the spec:
	// Let integer be ? ToInteger(index).
	// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
	toAbsoluteIndex = function (index, length) {
	  var integer = toIntegerOrInfinity(index);
	  return integer < 0 ? max(integer + length, 0) : min(integer, length);
	};
	return toAbsoluteIndex;
}

var toLength;
var hasRequiredToLength;

function requireToLength () {
	if (hasRequiredToLength) return toLength;
	hasRequiredToLength = 1;
	var toIntegerOrInfinity = requireToIntegerOrInfinity();

	var min = Math.min;

	// `ToLength` abstract operation
	// https://tc39.es/ecma262/#sec-tolength
	toLength = function (argument) {
	  var len = toIntegerOrInfinity(argument);
	  return len > 0 ? min(len, 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
	};
	return toLength;
}

var lengthOfArrayLike;
var hasRequiredLengthOfArrayLike;

function requireLengthOfArrayLike () {
	if (hasRequiredLengthOfArrayLike) return lengthOfArrayLike;
	hasRequiredLengthOfArrayLike = 1;
	var toLength = requireToLength();

	// `LengthOfArrayLike` abstract operation
	// https://tc39.es/ecma262/#sec-lengthofarraylike
	lengthOfArrayLike = function (obj) {
	  return toLength(obj.length);
	};
	return lengthOfArrayLike;
}

var arrayIncludes;
var hasRequiredArrayIncludes;

function requireArrayIncludes () {
	if (hasRequiredArrayIncludes) return arrayIncludes;
	hasRequiredArrayIncludes = 1;
	var toIndexedObject = requireToIndexedObject();
	var toAbsoluteIndex = requireToAbsoluteIndex();
	var lengthOfArrayLike = requireLengthOfArrayLike();

	// `Array.prototype.{ indexOf, includes }` methods implementation
	var createMethod = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = toIndexedObject($this);
	    var length = lengthOfArrayLike(O);
	    if (length === 0) return !IS_INCLUDES && -1;
	    var index = toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare -- NaN check
	    if (IS_INCLUDES && el !== el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare -- NaN check
	      if (value !== value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) {
	      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

	arrayIncludes = {
	  // `Array.prototype.includes` method
	  // https://tc39.es/ecma262/#sec-array.prototype.includes
	  includes: createMethod(true),
	  // `Array.prototype.indexOf` method
	  // https://tc39.es/ecma262/#sec-array.prototype.indexof
	  indexOf: createMethod(false)
	};
	return arrayIncludes;
}

var objectKeysInternal;
var hasRequiredObjectKeysInternal;

function requireObjectKeysInternal () {
	if (hasRequiredObjectKeysInternal) return objectKeysInternal;
	hasRequiredObjectKeysInternal = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var hasOwn = requireHasOwnProperty();
	var toIndexedObject = requireToIndexedObject();
	var indexOf = requireArrayIncludes().indexOf;
	var hiddenKeys = requireHiddenKeys();

	var push = uncurryThis([].push);

	objectKeysInternal = function (object, names) {
	  var O = toIndexedObject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) !hasOwn(hiddenKeys, key) && hasOwn(O, key) && push(result, key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (hasOwn(O, key = names[i++])) {
	    ~indexOf(result, key) || push(result, key);
	  }
	  return result;
	};
	return objectKeysInternal;
}

var enumBugKeys;
var hasRequiredEnumBugKeys;

function requireEnumBugKeys () {
	if (hasRequiredEnumBugKeys) return enumBugKeys;
	hasRequiredEnumBugKeys = 1;
	// IE8- don't enum bug keys
	enumBugKeys = [
	  'constructor',
	  'hasOwnProperty',
	  'isPrototypeOf',
	  'propertyIsEnumerable',
	  'toLocaleString',
	  'toString',
	  'valueOf'
	];
	return enumBugKeys;
}

var hasRequiredObjectGetOwnPropertyNames;

function requireObjectGetOwnPropertyNames () {
	if (hasRequiredObjectGetOwnPropertyNames) return objectGetOwnPropertyNames;
	hasRequiredObjectGetOwnPropertyNames = 1;
	var internalObjectKeys = requireObjectKeysInternal();
	var enumBugKeys = requireEnumBugKeys();

	var hiddenKeys = enumBugKeys.concat('length', 'prototype');

	// `Object.getOwnPropertyNames` method
	// https://tc39.es/ecma262/#sec-object.getownpropertynames
	// eslint-disable-next-line es/no-object-getownpropertynames -- safe
	objectGetOwnPropertyNames.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return internalObjectKeys(O, hiddenKeys);
	};
	return objectGetOwnPropertyNames;
}

var objectGetOwnPropertySymbols = {};

var hasRequiredObjectGetOwnPropertySymbols;

function requireObjectGetOwnPropertySymbols () {
	if (hasRequiredObjectGetOwnPropertySymbols) return objectGetOwnPropertySymbols;
	hasRequiredObjectGetOwnPropertySymbols = 1;
	// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
	objectGetOwnPropertySymbols.f = Object.getOwnPropertySymbols;
	return objectGetOwnPropertySymbols;
}

var ownKeys;
var hasRequiredOwnKeys;

function requireOwnKeys () {
	if (hasRequiredOwnKeys) return ownKeys;
	hasRequiredOwnKeys = 1;
	var getBuiltIn = requireGetBuiltIn();
	var uncurryThis = requireFunctionUncurryThis();
	var getOwnPropertyNamesModule = requireObjectGetOwnPropertyNames();
	var getOwnPropertySymbolsModule = requireObjectGetOwnPropertySymbols();
	var anObject = requireAnObject();

	var concat = uncurryThis([].concat);

	// all object keys, includes non-enumerable and symbols
	ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
	  var keys = getOwnPropertyNamesModule.f(anObject(it));
	  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
	  return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
	};
	return ownKeys;
}

var copyConstructorProperties;
var hasRequiredCopyConstructorProperties;

function requireCopyConstructorProperties () {
	if (hasRequiredCopyConstructorProperties) return copyConstructorProperties;
	hasRequiredCopyConstructorProperties = 1;
	var hasOwn = requireHasOwnProperty();
	var ownKeys = requireOwnKeys();
	var getOwnPropertyDescriptorModule = requireObjectGetOwnPropertyDescriptor();
	var definePropertyModule = requireObjectDefineProperty();

	copyConstructorProperties = function (target, source, exceptions) {
	  var keys = ownKeys(source);
	  var defineProperty = definePropertyModule.f;
	  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
	      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
	    }
	  }
	};
	return copyConstructorProperties;
}

var isForced_1;
var hasRequiredIsForced;

function requireIsForced () {
	if (hasRequiredIsForced) return isForced_1;
	hasRequiredIsForced = 1;
	var fails = requireFails();
	var isCallable = requireIsCallable();

	var replacement = /#|\.prototype\./;

	var isForced = function (feature, detection) {
	  var value = data[normalize(feature)];
	  return value === POLYFILL ? true
	    : value === NATIVE ? false
	    : isCallable(detection) ? fails(detection)
	    : !!detection;
	};

	var normalize = isForced.normalize = function (string) {
	  return String(string).replace(replacement, '.').toLowerCase();
	};

	var data = isForced.data = {};
	var NATIVE = isForced.NATIVE = 'N';
	var POLYFILL = isForced.POLYFILL = 'P';

	isForced_1 = isForced;
	return isForced_1;
}

var _export;
var hasRequired_export;

function require_export () {
	if (hasRequired_export) return _export;
	hasRequired_export = 1;
	var globalThis = requireGlobalThis();
	var getOwnPropertyDescriptor = requireObjectGetOwnPropertyDescriptor().f;
	var createNonEnumerableProperty = requireCreateNonEnumerableProperty();
	var defineBuiltIn = requireDefineBuiltIn();
	var defineGlobalProperty = requireDefineGlobalProperty();
	var copyConstructorProperties = requireCopyConstructorProperties();
	var isForced = requireIsForced();

	/*
	  options.target         - name of the target object
	  options.global         - target is the global object
	  options.stat           - export as static methods of target
	  options.proto          - export as prototype methods of target
	  options.real           - real prototype method for the `pure` version
	  options.forced         - export even if the native feature is available
	  options.bind           - bind methods to the target, required for the `pure` version
	  options.wrap           - wrap constructors to preventing global pollution, required for the `pure` version
	  options.unsafe         - use the simple assignment of property instead of delete + defineProperty
	  options.sham           - add a flag to not completely full polyfills
	  options.enumerable     - export as enumerable property
	  options.dontCallGetSet - prevent calling a getter on target
	  options.name           - the .name of the function if it does not match the key
	*/
	_export = function (options, source) {
	  var TARGET = options.target;
	  var GLOBAL = options.global;
	  var STATIC = options.stat;
	  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
	  if (GLOBAL) {
	    target = globalThis;
	  } else if (STATIC) {
	    target = globalThis[TARGET] || defineGlobalProperty(TARGET, {});
	  } else {
	    target = globalThis[TARGET] && globalThis[TARGET].prototype;
	  }
	  if (target) for (key in source) {
	    sourceProperty = source[key];
	    if (options.dontCallGetSet) {
	      descriptor = getOwnPropertyDescriptor(target, key);
	      targetProperty = descriptor && descriptor.value;
	    } else targetProperty = target[key];
	    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
	    // contained in target
	    if (!FORCED && targetProperty !== undefined) {
	      if (typeof sourceProperty == typeof targetProperty) continue;
	      copyConstructorProperties(sourceProperty, targetProperty);
	    }
	    // add a flag to not completely full polyfills
	    if (options.sham || (targetProperty && targetProperty.sham)) {
	      createNonEnumerableProperty(sourceProperty, 'sham', true);
	    }
	    defineBuiltIn(target, key, sourceProperty, options);
	  }
	};
	return _export;
}

var functionApply;
var hasRequiredFunctionApply;

function requireFunctionApply () {
	if (hasRequiredFunctionApply) return functionApply;
	hasRequiredFunctionApply = 1;
	var NATIVE_BIND = requireFunctionBindNative();

	var FunctionPrototype = Function.prototype;
	var apply = FunctionPrototype.apply;
	var call = FunctionPrototype.call;

	// eslint-disable-next-line es/no-reflect -- safe
	functionApply = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
	  return call.apply(apply, arguments);
	});
	return functionApply;
}

var functionUncurryThisAccessor;
var hasRequiredFunctionUncurryThisAccessor;

function requireFunctionUncurryThisAccessor () {
	if (hasRequiredFunctionUncurryThisAccessor) return functionUncurryThisAccessor;
	hasRequiredFunctionUncurryThisAccessor = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var aCallable = requireACallable();

	functionUncurryThisAccessor = function (object, key, method) {
	  try {
	    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	    return uncurryThis(aCallable(Object.getOwnPropertyDescriptor(object, key)[method]));
	  } catch (error) { /* empty */ }
	};
	return functionUncurryThisAccessor;
}

var isPossiblePrototype;
var hasRequiredIsPossiblePrototype;

function requireIsPossiblePrototype () {
	if (hasRequiredIsPossiblePrototype) return isPossiblePrototype;
	hasRequiredIsPossiblePrototype = 1;
	var isObject = requireIsObject();

	isPossiblePrototype = function (argument) {
	  return isObject(argument) || argument === null;
	};
	return isPossiblePrototype;
}

var aPossiblePrototype;
var hasRequiredAPossiblePrototype;

function requireAPossiblePrototype () {
	if (hasRequiredAPossiblePrototype) return aPossiblePrototype;
	hasRequiredAPossiblePrototype = 1;
	var isPossiblePrototype = requireIsPossiblePrototype();

	var $String = String;
	var $TypeError = TypeError;

	aPossiblePrototype = function (argument) {
	  if (isPossiblePrototype(argument)) return argument;
	  throw new $TypeError("Can't set " + $String(argument) + ' as a prototype');
	};
	return aPossiblePrototype;
}

var objectSetPrototypeOf;
var hasRequiredObjectSetPrototypeOf;

function requireObjectSetPrototypeOf () {
	if (hasRequiredObjectSetPrototypeOf) return objectSetPrototypeOf;
	hasRequiredObjectSetPrototypeOf = 1;
	/* eslint-disable no-proto -- safe */
	var uncurryThisAccessor = requireFunctionUncurryThisAccessor();
	var isObject = requireIsObject();
	var requireObjectCoercible = requireRequireObjectCoercible();
	var aPossiblePrototype = requireAPossiblePrototype();

	// `Object.setPrototypeOf` method
	// https://tc39.es/ecma262/#sec-object.setprototypeof
	// Works with __proto__ only. Old v8 can't work with null proto objects.
	// eslint-disable-next-line es/no-object-setprototypeof -- safe
	objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
	  var CORRECT_SETTER = false;
	  var test = {};
	  var setter;
	  try {
	    setter = uncurryThisAccessor(Object.prototype, '__proto__', 'set');
	    setter(test, []);
	    CORRECT_SETTER = test instanceof Array;
	  } catch (error) { /* empty */ }
	  return function setPrototypeOf(O, proto) {
	    requireObjectCoercible(O);
	    aPossiblePrototype(proto);
	    if (!isObject(O)) return O;
	    if (CORRECT_SETTER) setter(O, proto);
	    else O.__proto__ = proto;
	    return O;
	  };
	}() : undefined);
	return objectSetPrototypeOf;
}

var proxyAccessor;
var hasRequiredProxyAccessor;

function requireProxyAccessor () {
	if (hasRequiredProxyAccessor) return proxyAccessor;
	hasRequiredProxyAccessor = 1;
	var defineProperty = requireObjectDefineProperty().f;

	proxyAccessor = function (Target, Source, key) {
	  key in Target || defineProperty(Target, key, {
	    configurable: true,
	    get: function () { return Source[key]; },
	    set: function (it) { Source[key] = it; }
	  });
	};
	return proxyAccessor;
}

var inheritIfRequired;
var hasRequiredInheritIfRequired;

function requireInheritIfRequired () {
	if (hasRequiredInheritIfRequired) return inheritIfRequired;
	hasRequiredInheritIfRequired = 1;
	var isCallable = requireIsCallable();
	var isObject = requireIsObject();
	var setPrototypeOf = requireObjectSetPrototypeOf();

	// makes subclassing work correct for wrapped built-ins
	inheritIfRequired = function ($this, dummy, Wrapper) {
	  var NewTarget, NewTargetPrototype;
	  if (
	    // it can work only with native `setPrototypeOf`
	    setPrototypeOf &&
	    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
	    isCallable(NewTarget = dummy.constructor) &&
	    NewTarget !== Wrapper &&
	    isObject(NewTargetPrototype = NewTarget.prototype) &&
	    NewTargetPrototype !== Wrapper.prototype
	  ) setPrototypeOf($this, NewTargetPrototype);
	  return $this;
	};
	return inheritIfRequired;
}

var toStringTagSupport;
var hasRequiredToStringTagSupport;

function requireToStringTagSupport () {
	if (hasRequiredToStringTagSupport) return toStringTagSupport;
	hasRequiredToStringTagSupport = 1;
	var wellKnownSymbol = requireWellKnownSymbol();

	var TO_STRING_TAG = wellKnownSymbol('toStringTag');
	var test = {};

	test[TO_STRING_TAG] = 'z';

	toStringTagSupport = String(test) === '[object z]';
	return toStringTagSupport;
}

var classof;
var hasRequiredClassof;

function requireClassof () {
	if (hasRequiredClassof) return classof;
	hasRequiredClassof = 1;
	var TO_STRING_TAG_SUPPORT = requireToStringTagSupport();
	var isCallable = requireIsCallable();
	var classofRaw = requireClassofRaw();
	var wellKnownSymbol = requireWellKnownSymbol();

	var TO_STRING_TAG = wellKnownSymbol('toStringTag');
	var $Object = Object;

	// ES3 wrong here
	var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) === 'Arguments';

	// fallback for IE11 Script Access Denied error
	var tryGet = function (it, key) {
	  try {
	    return it[key];
	  } catch (error) { /* empty */ }
	};

	// getting tag from ES6+ `Object.prototype.toString`
	classof = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
	  var O, tag, result;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (tag = tryGet(O = $Object(it), TO_STRING_TAG)) == 'string' ? tag
	    // builtinTag case
	    : CORRECT_ARGUMENTS ? classofRaw(O)
	    // ES3 arguments fallback
	    : (result = classofRaw(O)) === 'Object' && isCallable(O.callee) ? 'Arguments' : result;
	};
	return classof;
}

var toString;
var hasRequiredToString;

function requireToString () {
	if (hasRequiredToString) return toString;
	hasRequiredToString = 1;
	var classof = requireClassof();

	var $String = String;

	toString = function (argument) {
	  if (classof(argument) === 'Symbol') throw new TypeError('Cannot convert a Symbol value to a string');
	  return $String(argument);
	};
	return toString;
}

var normalizeStringArgument;
var hasRequiredNormalizeStringArgument;

function requireNormalizeStringArgument () {
	if (hasRequiredNormalizeStringArgument) return normalizeStringArgument;
	hasRequiredNormalizeStringArgument = 1;
	var toString = requireToString();

	normalizeStringArgument = function (argument, $default) {
	  return argument === undefined ? arguments.length < 2 ? '' : $default : toString(argument);
	};
	return normalizeStringArgument;
}

var installErrorCause;
var hasRequiredInstallErrorCause;

function requireInstallErrorCause () {
	if (hasRequiredInstallErrorCause) return installErrorCause;
	hasRequiredInstallErrorCause = 1;
	var isObject = requireIsObject();
	var createNonEnumerableProperty = requireCreateNonEnumerableProperty();

	// `InstallErrorCause` abstract operation
	// https://tc39.es/proposal-error-cause/#sec-errorobjects-install-error-cause
	installErrorCause = function (O, options) {
	  if (isObject(options) && 'cause' in options) {
	    createNonEnumerableProperty(O, 'cause', options.cause);
	  }
	};
	return installErrorCause;
}

var errorStackClear;
var hasRequiredErrorStackClear;

function requireErrorStackClear () {
	if (hasRequiredErrorStackClear) return errorStackClear;
	hasRequiredErrorStackClear = 1;
	var uncurryThis = requireFunctionUncurryThis();

	var $Error = Error;
	var replace = uncurryThis(''.replace);

	var TEST = (function (arg) { return String(new $Error(arg).stack); })('zxcasd');
	// eslint-disable-next-line redos/no-vulnerable, sonarjs/slow-regex -- safe
	var V8_OR_CHAKRA_STACK_ENTRY = /\n\s*at [^:]*:[^\n]*/;
	var IS_V8_OR_CHAKRA_STACK = V8_OR_CHAKRA_STACK_ENTRY.test(TEST);

	errorStackClear = function (stack, dropEntries) {
	  if (IS_V8_OR_CHAKRA_STACK && typeof stack == 'string' && !$Error.prepareStackTrace) {
	    while (dropEntries--) stack = replace(stack, V8_OR_CHAKRA_STACK_ENTRY, '');
	  } return stack;
	};
	return errorStackClear;
}

var errorStackInstallable;
var hasRequiredErrorStackInstallable;

function requireErrorStackInstallable () {
	if (hasRequiredErrorStackInstallable) return errorStackInstallable;
	hasRequiredErrorStackInstallable = 1;
	var fails = requireFails();
	var createPropertyDescriptor = requireCreatePropertyDescriptor();

	errorStackInstallable = !fails(function () {
	  var error = new Error('a');
	  if (!('stack' in error)) return true;
	  // eslint-disable-next-line es/no-object-defineproperty -- safe
	  Object.defineProperty(error, 'stack', createPropertyDescriptor(1, 7));
	  return error.stack !== 7;
	});
	return errorStackInstallable;
}

var errorStackInstall;
var hasRequiredErrorStackInstall;

function requireErrorStackInstall () {
	if (hasRequiredErrorStackInstall) return errorStackInstall;
	hasRequiredErrorStackInstall = 1;
	var createNonEnumerableProperty = requireCreateNonEnumerableProperty();
	var clearErrorStack = requireErrorStackClear();
	var ERROR_STACK_INSTALLABLE = requireErrorStackInstallable();

	// non-standard V8
	var captureStackTrace = Error.captureStackTrace;

	errorStackInstall = function (error, C, stack, dropEntries) {
	  if (ERROR_STACK_INSTALLABLE) {
	    if (captureStackTrace) captureStackTrace(error, C);
	    else createNonEnumerableProperty(error, 'stack', clearErrorStack(stack, dropEntries));
	  }
	};
	return errorStackInstall;
}

var wrapErrorConstructorWithCause;
var hasRequiredWrapErrorConstructorWithCause;

function requireWrapErrorConstructorWithCause () {
	if (hasRequiredWrapErrorConstructorWithCause) return wrapErrorConstructorWithCause;
	hasRequiredWrapErrorConstructorWithCause = 1;
	var getBuiltIn = requireGetBuiltIn();
	var hasOwn = requireHasOwnProperty();
	var createNonEnumerableProperty = requireCreateNonEnumerableProperty();
	var isPrototypeOf = requireObjectIsPrototypeOf();
	var setPrototypeOf = requireObjectSetPrototypeOf();
	var copyConstructorProperties = requireCopyConstructorProperties();
	var proxyAccessor = requireProxyAccessor();
	var inheritIfRequired = requireInheritIfRequired();
	var normalizeStringArgument = requireNormalizeStringArgument();
	var installErrorCause = requireInstallErrorCause();
	var installErrorStack = requireErrorStackInstall();
	var DESCRIPTORS = requireDescriptors();
	var IS_PURE = requireIsPure();

	wrapErrorConstructorWithCause = function (FULL_NAME, wrapper, FORCED, IS_AGGREGATE_ERROR) {
	  var STACK_TRACE_LIMIT = 'stackTraceLimit';
	  var OPTIONS_POSITION = IS_AGGREGATE_ERROR ? 2 : 1;
	  var path = FULL_NAME.split('.');
	  var ERROR_NAME = path[path.length - 1];
	  var OriginalError = getBuiltIn.apply(null, path);

	  if (!OriginalError) return;

	  var OriginalErrorPrototype = OriginalError.prototype;

	  // V8 9.3- bug https://bugs.chromium.org/p/v8/issues/detail?id=12006
	  if (!IS_PURE && hasOwn(OriginalErrorPrototype, 'cause')) delete OriginalErrorPrototype.cause;

	  if (!FORCED) return OriginalError;

	  var BaseError = getBuiltIn('Error');

	  var WrappedError = wrapper(function (a, b) {
	    var message = normalizeStringArgument(IS_AGGREGATE_ERROR ? b : a, undefined);
	    var result = IS_AGGREGATE_ERROR ? new OriginalError(a) : new OriginalError();
	    if (message !== undefined) createNonEnumerableProperty(result, 'message', message);
	    installErrorStack(result, WrappedError, result.stack, 2);
	    if (this && isPrototypeOf(OriginalErrorPrototype, this)) inheritIfRequired(result, this, WrappedError);
	    if (arguments.length > OPTIONS_POSITION) installErrorCause(result, arguments[OPTIONS_POSITION]);
	    return result;
	  });

	  WrappedError.prototype = OriginalErrorPrototype;

	  if (ERROR_NAME !== 'Error') {
	    if (setPrototypeOf) setPrototypeOf(WrappedError, BaseError);
	    else copyConstructorProperties(WrappedError, BaseError, { name: true });
	  } else if (DESCRIPTORS && STACK_TRACE_LIMIT in OriginalError) {
	    proxyAccessor(WrappedError, OriginalError, STACK_TRACE_LIMIT);
	    proxyAccessor(WrappedError, OriginalError, 'prepareStackTrace');
	  }

	  copyConstructorProperties(WrappedError, OriginalError);

	  if (!IS_PURE) try {
	    // Safari 13- bug: WebAssembly errors does not have a proper `.name`
	    if (OriginalErrorPrototype.name !== ERROR_NAME) {
	      createNonEnumerableProperty(OriginalErrorPrototype, 'name', ERROR_NAME);
	    }
	    OriginalErrorPrototype.constructor = WrappedError;
	  } catch (error) { /* empty */ }

	  return WrappedError;
	};
	return wrapErrorConstructorWithCause;
}

var hasRequiredEs_error_cause;

function requireEs_error_cause () {
	if (hasRequiredEs_error_cause) return es_error_cause;
	hasRequiredEs_error_cause = 1;
	/* eslint-disable no-unused-vars -- required for functions `.length` */
	var $ = require_export();
	var globalThis = requireGlobalThis();
	var apply = requireFunctionApply();
	var wrapErrorConstructorWithCause = requireWrapErrorConstructorWithCause();

	var WEB_ASSEMBLY = 'WebAssembly';
	var WebAssembly = globalThis[WEB_ASSEMBLY];

	// eslint-disable-next-line es/no-error-cause -- feature detection
	var FORCED = new Error('e', { cause: 7 }).cause !== 7;

	var exportGlobalErrorCauseWrapper = function (ERROR_NAME, wrapper) {
	  var O = {};
	  O[ERROR_NAME] = wrapErrorConstructorWithCause(ERROR_NAME, wrapper, FORCED);
	  $({ global: true, constructor: true, arity: 1, forced: FORCED }, O);
	};

	var exportWebAssemblyErrorCauseWrapper = function (ERROR_NAME, wrapper) {
	  if (WebAssembly && WebAssembly[ERROR_NAME]) {
	    var O = {};
	    O[ERROR_NAME] = wrapErrorConstructorWithCause(WEB_ASSEMBLY + '.' + ERROR_NAME, wrapper, FORCED);
	    $({ target: WEB_ASSEMBLY, stat: true, constructor: true, arity: 1, forced: FORCED }, O);
	  }
	};

	// https://tc39.es/ecma262/#sec-nativeerror
	exportGlobalErrorCauseWrapper('Error', function (init) {
	  return function Error(message) { return apply(init, this, arguments); };
	});
	exportGlobalErrorCauseWrapper('EvalError', function (init) {
	  return function EvalError(message) { return apply(init, this, arguments); };
	});
	exportGlobalErrorCauseWrapper('RangeError', function (init) {
	  return function RangeError(message) { return apply(init, this, arguments); };
	});
	exportGlobalErrorCauseWrapper('ReferenceError', function (init) {
	  return function ReferenceError(message) { return apply(init, this, arguments); };
	});
	exportGlobalErrorCauseWrapper('SyntaxError', function (init) {
	  return function SyntaxError(message) { return apply(init, this, arguments); };
	});
	exportGlobalErrorCauseWrapper('TypeError', function (init) {
	  return function TypeError(message) { return apply(init, this, arguments); };
	});
	exportGlobalErrorCauseWrapper('URIError', function (init) {
	  return function URIError(message) { return apply(init, this, arguments); };
	});
	exportWebAssemblyErrorCauseWrapper('CompileError', function (init) {
	  return function CompileError(message) { return apply(init, this, arguments); };
	});
	exportWebAssemblyErrorCauseWrapper('LinkError', function (init) {
	  return function LinkError(message) { return apply(init, this, arguments); };
	});
	exportWebAssemblyErrorCauseWrapper('RuntimeError', function (init) {
	  return function RuntimeError(message) { return apply(init, this, arguments); };
	});
	return es_error_cause;
}

requireEs_error_cause();

var es_array_push = {};

var isArray;
var hasRequiredIsArray;

function requireIsArray () {
	if (hasRequiredIsArray) return isArray;
	hasRequiredIsArray = 1;
	var classof = requireClassofRaw();

	// `IsArray` abstract operation
	// https://tc39.es/ecma262/#sec-isarray
	// eslint-disable-next-line es/no-array-isarray -- safe
	isArray = Array.isArray || function isArray(argument) {
	  return classof(argument) === 'Array';
	};
	return isArray;
}

var arraySetLength;
var hasRequiredArraySetLength;

function requireArraySetLength () {
	if (hasRequiredArraySetLength) return arraySetLength;
	hasRequiredArraySetLength = 1;
	var DESCRIPTORS = requireDescriptors();
	var isArray = requireIsArray();

	var $TypeError = TypeError;
	// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	// Safari < 13 does not throw an error in this case
	var SILENT_ON_NON_WRITABLE_LENGTH_SET = DESCRIPTORS && !function () {
	  // makes no sense without proper strict mode support
	  if (this !== undefined) return true;
	  try {
	    // eslint-disable-next-line es/no-object-defineproperty -- safe
	    Object.defineProperty([], 'length', { writable: false }).length = 1;
	  } catch (error) {
	    return error instanceof TypeError;
	  }
	}();

	arraySetLength = SILENT_ON_NON_WRITABLE_LENGTH_SET ? function (O, length) {
	  if (isArray(O) && !getOwnPropertyDescriptor(O, 'length').writable) {
	    throw new $TypeError('Cannot set read only .length');
	  } return O.length = length;
	} : function (O, length) {
	  return O.length = length;
	};
	return arraySetLength;
}

var doesNotExceedSafeInteger;
var hasRequiredDoesNotExceedSafeInteger;

function requireDoesNotExceedSafeInteger () {
	if (hasRequiredDoesNotExceedSafeInteger) return doesNotExceedSafeInteger;
	hasRequiredDoesNotExceedSafeInteger = 1;
	var $TypeError = TypeError;
	var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF; // 2 ** 53 - 1 == 9007199254740991

	doesNotExceedSafeInteger = function (it) {
	  if (it > MAX_SAFE_INTEGER) throw $TypeError('Maximum allowed index exceeded');
	  return it;
	};
	return doesNotExceedSafeInteger;
}

var hasRequiredEs_array_push;

function requireEs_array_push () {
	if (hasRequiredEs_array_push) return es_array_push;
	hasRequiredEs_array_push = 1;
	var $ = require_export();
	var toObject = requireToObject();
	var lengthOfArrayLike = requireLengthOfArrayLike();
	var setArrayLength = requireArraySetLength();
	var doesNotExceedSafeInteger = requireDoesNotExceedSafeInteger();
	var fails = requireFails();

	var INCORRECT_TO_LENGTH = fails(function () {
	  return [].push.call({ length: 0x100000000 }, 1) !== 4294967297;
	});

	// V8 <= 121 and Safari <= 15.4; FF < 23 throws InternalError
	// https://bugs.chromium.org/p/v8/issues/detail?id=12681
	var properErrorOnNonWritableLength = function () {
	  try {
	    // eslint-disable-next-line es/no-object-defineproperty -- safe
	    Object.defineProperty([], 'length', { writable: false }).push();
	  } catch (error) {
	    return error instanceof TypeError;
	  }
	};

	var FORCED = INCORRECT_TO_LENGTH || !properErrorOnNonWritableLength();

	// `Array.prototype.push` method
	// https://tc39.es/ecma262/#sec-array.prototype.push
	$({ target: 'Array', proto: true, arity: 1, forced: FORCED }, {
	  // eslint-disable-next-line no-unused-vars -- required for `.length`
	  push: function push(item) {
	    var O = toObject(this);
	    var len = lengthOfArrayLike(O);
	    var argCount = arguments.length;
	    doesNotExceedSafeInteger(len + argCount);
	    for (var i = 0; i < argCount; i++) {
	      O[len] = arguments[i];
	      len++;
	    }
	    setArrayLength(O, len);
	    return len;
	  }
	});
	return es_array_push;
}

requireEs_array_push();

var esnext_iterator_constructor = {};

var es_iterator_constructor = {};

var anInstance;
var hasRequiredAnInstance;

function requireAnInstance () {
	if (hasRequiredAnInstance) return anInstance;
	hasRequiredAnInstance = 1;
	var isPrototypeOf = requireObjectIsPrototypeOf();

	var $TypeError = TypeError;

	anInstance = function (it, Prototype) {
	  if (isPrototypeOf(Prototype, it)) return it;
	  throw new $TypeError('Incorrect invocation');
	};
	return anInstance;
}

var correctPrototypeGetter;
var hasRequiredCorrectPrototypeGetter;

function requireCorrectPrototypeGetter () {
	if (hasRequiredCorrectPrototypeGetter) return correctPrototypeGetter;
	hasRequiredCorrectPrototypeGetter = 1;
	var fails = requireFails();

	correctPrototypeGetter = !fails(function () {
	  function F() { /* empty */ }
	  F.prototype.constructor = null;
	  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
	  return Object.getPrototypeOf(new F()) !== F.prototype;
	});
	return correctPrototypeGetter;
}

var objectGetPrototypeOf;
var hasRequiredObjectGetPrototypeOf;

function requireObjectGetPrototypeOf () {
	if (hasRequiredObjectGetPrototypeOf) return objectGetPrototypeOf;
	hasRequiredObjectGetPrototypeOf = 1;
	var hasOwn = requireHasOwnProperty();
	var isCallable = requireIsCallable();
	var toObject = requireToObject();
	var sharedKey = requireSharedKey();
	var CORRECT_PROTOTYPE_GETTER = requireCorrectPrototypeGetter();

	var IE_PROTO = sharedKey('IE_PROTO');
	var $Object = Object;
	var ObjectPrototype = $Object.prototype;

	// `Object.getPrototypeOf` method
	// https://tc39.es/ecma262/#sec-object.getprototypeof
	// eslint-disable-next-line es/no-object-getprototypeof -- safe
	objectGetPrototypeOf = CORRECT_PROTOTYPE_GETTER ? $Object.getPrototypeOf : function (O) {
	  var object = toObject(O);
	  if (hasOwn(object, IE_PROTO)) return object[IE_PROTO];
	  var constructor = object.constructor;
	  if (isCallable(constructor) && object instanceof constructor) {
	    return constructor.prototype;
	  } return object instanceof $Object ? ObjectPrototype : null;
	};
	return objectGetPrototypeOf;
}

var defineBuiltInAccessor;
var hasRequiredDefineBuiltInAccessor;

function requireDefineBuiltInAccessor () {
	if (hasRequiredDefineBuiltInAccessor) return defineBuiltInAccessor;
	hasRequiredDefineBuiltInAccessor = 1;
	var makeBuiltIn = requireMakeBuiltIn();
	var defineProperty = requireObjectDefineProperty();

	defineBuiltInAccessor = function (target, name, descriptor) {
	  if (descriptor.get) makeBuiltIn(descriptor.get, name, { getter: true });
	  if (descriptor.set) makeBuiltIn(descriptor.set, name, { setter: true });
	  return defineProperty.f(target, name, descriptor);
	};
	return defineBuiltInAccessor;
}

var createProperty;
var hasRequiredCreateProperty;

function requireCreateProperty () {
	if (hasRequiredCreateProperty) return createProperty;
	hasRequiredCreateProperty = 1;
	var DESCRIPTORS = requireDescriptors();
	var definePropertyModule = requireObjectDefineProperty();
	var createPropertyDescriptor = requireCreatePropertyDescriptor();

	createProperty = function (object, key, value) {
	  if (DESCRIPTORS) definePropertyModule.f(object, key, createPropertyDescriptor(0, value));
	  else object[key] = value;
	};
	return createProperty;
}

var objectDefineProperties = {};

var objectKeys;
var hasRequiredObjectKeys;

function requireObjectKeys () {
	if (hasRequiredObjectKeys) return objectKeys;
	hasRequiredObjectKeys = 1;
	var internalObjectKeys = requireObjectKeysInternal();
	var enumBugKeys = requireEnumBugKeys();

	// `Object.keys` method
	// https://tc39.es/ecma262/#sec-object.keys
	// eslint-disable-next-line es/no-object-keys -- safe
	objectKeys = Object.keys || function keys(O) {
	  return internalObjectKeys(O, enumBugKeys);
	};
	return objectKeys;
}

var hasRequiredObjectDefineProperties;

function requireObjectDefineProperties () {
	if (hasRequiredObjectDefineProperties) return objectDefineProperties;
	hasRequiredObjectDefineProperties = 1;
	var DESCRIPTORS = requireDescriptors();
	var V8_PROTOTYPE_DEFINE_BUG = requireV8PrototypeDefineBug();
	var definePropertyModule = requireObjectDefineProperty();
	var anObject = requireAnObject();
	var toIndexedObject = requireToIndexedObject();
	var objectKeys = requireObjectKeys();

	// `Object.defineProperties` method
	// https://tc39.es/ecma262/#sec-object.defineproperties
	// eslint-disable-next-line es/no-object-defineproperties -- safe
	objectDefineProperties.f = DESCRIPTORS && !V8_PROTOTYPE_DEFINE_BUG ? Object.defineProperties : function defineProperties(O, Properties) {
	  anObject(O);
	  var props = toIndexedObject(Properties);
	  var keys = objectKeys(Properties);
	  var length = keys.length;
	  var index = 0;
	  var key;
	  while (length > index) definePropertyModule.f(O, key = keys[index++], props[key]);
	  return O;
	};
	return objectDefineProperties;
}

var html;
var hasRequiredHtml;

function requireHtml () {
	if (hasRequiredHtml) return html;
	hasRequiredHtml = 1;
	var getBuiltIn = requireGetBuiltIn();

	html = getBuiltIn('document', 'documentElement');
	return html;
}

var objectCreate;
var hasRequiredObjectCreate;

function requireObjectCreate () {
	if (hasRequiredObjectCreate) return objectCreate;
	hasRequiredObjectCreate = 1;
	/* global ActiveXObject -- old IE, WSH */
	var anObject = requireAnObject();
	var definePropertiesModule = requireObjectDefineProperties();
	var enumBugKeys = requireEnumBugKeys();
	var hiddenKeys = requireHiddenKeys();
	var html = requireHtml();
	var documentCreateElement = requireDocumentCreateElement();
	var sharedKey = requireSharedKey();

	var GT = '>';
	var LT = '<';
	var PROTOTYPE = 'prototype';
	var SCRIPT = 'script';
	var IE_PROTO = sharedKey('IE_PROTO');

	var EmptyConstructor = function () { /* empty */ };

	var scriptTag = function (content) {
	  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
	};

	// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
	var NullProtoObjectViaActiveX = function (activeXDocument) {
	  activeXDocument.write(scriptTag(''));
	  activeXDocument.close();
	  var temp = activeXDocument.parentWindow.Object;
	  // eslint-disable-next-line no-useless-assignment -- avoid memory leak
	  activeXDocument = null;
	  return temp;
	};

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var NullProtoObjectViaIFrame = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = documentCreateElement('iframe');
	  var JS = 'java' + SCRIPT + ':';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  html.appendChild(iframe);
	  // https://github.com/zloirock/core-js/issues/475
	  iframe.src = String(JS);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(scriptTag('document.F=Object'));
	  iframeDocument.close();
	  return iframeDocument.F;
	};

	// Check for document.domain and active x support
	// No need to use active x approach when document.domain is not set
	// see https://github.com/es-shims/es5-shim/issues/150
	// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
	// avoid IE GC bug
	var activeXDocument;
	var NullProtoObject = function () {
	  try {
	    activeXDocument = new ActiveXObject('htmlfile');
	  } catch (error) { /* ignore */ }
	  NullProtoObject = typeof document != 'undefined'
	    ? document.domain && activeXDocument
	      ? NullProtoObjectViaActiveX(activeXDocument) // old IE
	      : NullProtoObjectViaIFrame()
	    : NullProtoObjectViaActiveX(activeXDocument); // WSH
	  var length = enumBugKeys.length;
	  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
	  return NullProtoObject();
	};

	hiddenKeys[IE_PROTO] = true;

	// `Object.create` method
	// https://tc39.es/ecma262/#sec-object.create
	// eslint-disable-next-line es/no-object-create -- safe
	objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    EmptyConstructor[PROTOTYPE] = anObject(O);
	    result = new EmptyConstructor();
	    EmptyConstructor[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = NullProtoObject();
	  return Properties === undefined ? result : definePropertiesModule.f(result, Properties);
	};
	return objectCreate;
}

var iteratorsCore;
var hasRequiredIteratorsCore;

function requireIteratorsCore () {
	if (hasRequiredIteratorsCore) return iteratorsCore;
	hasRequiredIteratorsCore = 1;
	var fails = requireFails();
	var isCallable = requireIsCallable();
	var isObject = requireIsObject();
	var create = requireObjectCreate();
	var getPrototypeOf = requireObjectGetPrototypeOf();
	var defineBuiltIn = requireDefineBuiltIn();
	var wellKnownSymbol = requireWellKnownSymbol();
	var IS_PURE = requireIsPure();

	var ITERATOR = wellKnownSymbol('iterator');
	var BUGGY_SAFARI_ITERATORS = false;

	// `%IteratorPrototype%` object
	// https://tc39.es/ecma262/#sec-%iteratorprototype%-object
	var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

	/* eslint-disable es/no-array-prototype-keys -- safe */
	if ([].keys) {
	  arrayIterator = [].keys();
	  // Safari 8 has buggy iterators w/o `next`
	  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
	  else {
	    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
	    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
	  }
	}

	var NEW_ITERATOR_PROTOTYPE = !isObject(IteratorPrototype) || fails(function () {
	  var test = {};
	  // FF44- legacy iterators case
	  return IteratorPrototype[ITERATOR].call(test) !== test;
	});

	if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {};
	else if (IS_PURE) IteratorPrototype = create(IteratorPrototype);

	// `%IteratorPrototype%[@@iterator]()` method
	// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator
	if (!isCallable(IteratorPrototype[ITERATOR])) {
	  defineBuiltIn(IteratorPrototype, ITERATOR, function () {
	    return this;
	  });
	}

	iteratorsCore = {
	  IteratorPrototype: IteratorPrototype,
	  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
	};
	return iteratorsCore;
}

var hasRequiredEs_iterator_constructor;

function requireEs_iterator_constructor () {
	if (hasRequiredEs_iterator_constructor) return es_iterator_constructor;
	hasRequiredEs_iterator_constructor = 1;
	var $ = require_export();
	var globalThis = requireGlobalThis();
	var anInstance = requireAnInstance();
	var anObject = requireAnObject();
	var isCallable = requireIsCallable();
	var getPrototypeOf = requireObjectGetPrototypeOf();
	var defineBuiltInAccessor = requireDefineBuiltInAccessor();
	var createProperty = requireCreateProperty();
	var fails = requireFails();
	var hasOwn = requireHasOwnProperty();
	var wellKnownSymbol = requireWellKnownSymbol();
	var IteratorPrototype = requireIteratorsCore().IteratorPrototype;
	var DESCRIPTORS = requireDescriptors();
	var IS_PURE = requireIsPure();

	var CONSTRUCTOR = 'constructor';
	var ITERATOR = 'Iterator';
	var TO_STRING_TAG = wellKnownSymbol('toStringTag');

	var $TypeError = TypeError;
	var NativeIterator = globalThis[ITERATOR];

	// FF56- have non-standard global helper `Iterator`
	var FORCED = IS_PURE
	  || !isCallable(NativeIterator)
	  || NativeIterator.prototype !== IteratorPrototype
	  // FF44- non-standard `Iterator` passes previous tests
	  || !fails(function () { NativeIterator({}); });

	var IteratorConstructor = function Iterator() {
	  anInstance(this, IteratorPrototype);
	  if (getPrototypeOf(this) === IteratorPrototype) throw new $TypeError('Abstract class Iterator not directly constructable');
	};

	var defineIteratorPrototypeAccessor = function (key, value) {
	  if (DESCRIPTORS) {
	    defineBuiltInAccessor(IteratorPrototype, key, {
	      configurable: true,
	      get: function () {
	        return value;
	      },
	      set: function (replacement) {
	        anObject(this);
	        if (this === IteratorPrototype) throw new $TypeError("You can't redefine this property");
	        if (hasOwn(this, key)) this[key] = replacement;
	        else createProperty(this, key, replacement);
	      }
	    });
	  } else IteratorPrototype[key] = value;
	};

	if (!hasOwn(IteratorPrototype, TO_STRING_TAG)) defineIteratorPrototypeAccessor(TO_STRING_TAG, ITERATOR);

	if (FORCED || !hasOwn(IteratorPrototype, CONSTRUCTOR) || IteratorPrototype[CONSTRUCTOR] === Object) {
	  defineIteratorPrototypeAccessor(CONSTRUCTOR, IteratorConstructor);
	}

	IteratorConstructor.prototype = IteratorPrototype;

	// `Iterator` constructor
	// https://tc39.es/ecma262/#sec-iterator
	$({ global: true, constructor: true, forced: FORCED }, {
	  Iterator: IteratorConstructor
	});
	return es_iterator_constructor;
}

var hasRequiredEsnext_iterator_constructor;

function requireEsnext_iterator_constructor () {
	if (hasRequiredEsnext_iterator_constructor) return esnext_iterator_constructor;
	hasRequiredEsnext_iterator_constructor = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_constructor();
	return esnext_iterator_constructor;
}

requireEsnext_iterator_constructor();

var esnext_iterator_every = {};

var es_iterator_every = {};

var functionUncurryThisClause;
var hasRequiredFunctionUncurryThisClause;

function requireFunctionUncurryThisClause () {
	if (hasRequiredFunctionUncurryThisClause) return functionUncurryThisClause;
	hasRequiredFunctionUncurryThisClause = 1;
	var classofRaw = requireClassofRaw();
	var uncurryThis = requireFunctionUncurryThis();

	functionUncurryThisClause = function (fn) {
	  // Nashorn bug:
	  //   https://github.com/zloirock/core-js/issues/1128
	  //   https://github.com/zloirock/core-js/issues/1130
	  if (classofRaw(fn) === 'Function') return uncurryThis(fn);
	};
	return functionUncurryThisClause;
}

var functionBindContext;
var hasRequiredFunctionBindContext;

function requireFunctionBindContext () {
	if (hasRequiredFunctionBindContext) return functionBindContext;
	hasRequiredFunctionBindContext = 1;
	var uncurryThis = requireFunctionUncurryThisClause();
	var aCallable = requireACallable();
	var NATIVE_BIND = requireFunctionBindNative();

	var bind = uncurryThis(uncurryThis.bind);

	// optional / simple context binding
	functionBindContext = function (fn, that) {
	  aCallable(fn);
	  return that === undefined ? fn : NATIVE_BIND ? bind(fn, that) : function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};
	return functionBindContext;
}

var iterators;
var hasRequiredIterators;

function requireIterators () {
	if (hasRequiredIterators) return iterators;
	hasRequiredIterators = 1;
	iterators = {};
	return iterators;
}

var isArrayIteratorMethod;
var hasRequiredIsArrayIteratorMethod;

function requireIsArrayIteratorMethod () {
	if (hasRequiredIsArrayIteratorMethod) return isArrayIteratorMethod;
	hasRequiredIsArrayIteratorMethod = 1;
	var wellKnownSymbol = requireWellKnownSymbol();
	var Iterators = requireIterators();

	var ITERATOR = wellKnownSymbol('iterator');
	var ArrayPrototype = Array.prototype;

	// check on default Array iterator
	isArrayIteratorMethod = function (it) {
	  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
	};
	return isArrayIteratorMethod;
}

var getIteratorMethod;
var hasRequiredGetIteratorMethod;

function requireGetIteratorMethod () {
	if (hasRequiredGetIteratorMethod) return getIteratorMethod;
	hasRequiredGetIteratorMethod = 1;
	var classof = requireClassof();
	var getMethod = requireGetMethod();
	var isNullOrUndefined = requireIsNullOrUndefined();
	var Iterators = requireIterators();
	var wellKnownSymbol = requireWellKnownSymbol();

	var ITERATOR = wellKnownSymbol('iterator');

	getIteratorMethod = function (it) {
	  if (!isNullOrUndefined(it)) return getMethod(it, ITERATOR)
	    || getMethod(it, '@@iterator')
	    || Iterators[classof(it)];
	};
	return getIteratorMethod;
}

var getIterator;
var hasRequiredGetIterator;

function requireGetIterator () {
	if (hasRequiredGetIterator) return getIterator;
	hasRequiredGetIterator = 1;
	var call = requireFunctionCall();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var tryToString = requireTryToString();
	var getIteratorMethod = requireGetIteratorMethod();

	var $TypeError = TypeError;

	getIterator = function (argument, usingIterator) {
	  var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
	  if (aCallable(iteratorMethod)) return anObject(call(iteratorMethod, argument));
	  throw new $TypeError(tryToString(argument) + ' is not iterable');
	};
	return getIterator;
}

var iteratorClose;
var hasRequiredIteratorClose;

function requireIteratorClose () {
	if (hasRequiredIteratorClose) return iteratorClose;
	hasRequiredIteratorClose = 1;
	var call = requireFunctionCall();
	var anObject = requireAnObject();
	var getMethod = requireGetMethod();

	iteratorClose = function (iterator, kind, value) {
	  var innerResult, innerError;
	  anObject(iterator);
	  try {
	    innerResult = getMethod(iterator, 'return');
	    if (!innerResult) {
	      if (kind === 'throw') throw value;
	      return value;
	    }
	    innerResult = call(innerResult, iterator);
	  } catch (error) {
	    innerError = true;
	    innerResult = error;
	  }
	  if (kind === 'throw') throw value;
	  if (innerError) throw innerResult;
	  anObject(innerResult);
	  return value;
	};
	return iteratorClose;
}

var iterate;
var hasRequiredIterate;

function requireIterate () {
	if (hasRequiredIterate) return iterate;
	hasRequiredIterate = 1;
	var bind = requireFunctionBindContext();
	var call = requireFunctionCall();
	var anObject = requireAnObject();
	var tryToString = requireTryToString();
	var isArrayIteratorMethod = requireIsArrayIteratorMethod();
	var lengthOfArrayLike = requireLengthOfArrayLike();
	var isPrototypeOf = requireObjectIsPrototypeOf();
	var getIterator = requireGetIterator();
	var getIteratorMethod = requireGetIteratorMethod();
	var iteratorClose = requireIteratorClose();

	var $TypeError = TypeError;

	var Result = function (stopped, result) {
	  this.stopped = stopped;
	  this.result = result;
	};

	var ResultPrototype = Result.prototype;

	iterate = function (iterable, unboundFunction, options) {
	  var that = options && options.that;
	  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
	  var IS_RECORD = !!(options && options.IS_RECORD);
	  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
	  var INTERRUPTED = !!(options && options.INTERRUPTED);
	  var fn = bind(unboundFunction, that);
	  var iterator, iterFn, index, length, result, next, step;

	  var stop = function (condition) {
	    if (iterator) iteratorClose(iterator, 'normal', condition);
	    return new Result(true, condition);
	  };

	  var callFn = function (value) {
	    if (AS_ENTRIES) {
	      anObject(value);
	      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
	    } return INTERRUPTED ? fn(value, stop) : fn(value);
	  };

	  if (IS_RECORD) {
	    iterator = iterable.iterator;
	  } else if (IS_ITERATOR) {
	    iterator = iterable;
	  } else {
	    iterFn = getIteratorMethod(iterable);
	    if (!iterFn) throw new $TypeError(tryToString(iterable) + ' is not iterable');
	    // optimisation for array iterators
	    if (isArrayIteratorMethod(iterFn)) {
	      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
	        result = callFn(iterable[index]);
	        if (result && isPrototypeOf(ResultPrototype, result)) return result;
	      } return new Result(false);
	    }
	    iterator = getIterator(iterable, iterFn);
	  }

	  next = IS_RECORD ? iterable.next : iterator.next;
	  while (!(step = call(next, iterator)).done) {
	    try {
	      result = callFn(step.value);
	    } catch (error) {
	      iteratorClose(iterator, 'throw', error);
	    }
	    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
	  } return new Result(false);
	};
	return iterate;
}

var getIteratorDirect;
var hasRequiredGetIteratorDirect;

function requireGetIteratorDirect () {
	if (hasRequiredGetIteratorDirect) return getIteratorDirect;
	hasRequiredGetIteratorDirect = 1;
	// `GetIteratorDirect(obj)` abstract operation
	// https://tc39.es/proposal-iterator-helpers/#sec-getiteratordirect
	getIteratorDirect = function (obj) {
	  return {
	    iterator: obj,
	    next: obj.next,
	    done: false
	  };
	};
	return getIteratorDirect;
}

var hasRequiredEs_iterator_every;

function requireEs_iterator_every () {
	if (hasRequiredEs_iterator_every) return es_iterator_every;
	hasRequiredEs_iterator_every = 1;
	var $ = require_export();
	var iterate = requireIterate();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();

	// `Iterator.prototype.every` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.every
	$({ target: 'Iterator', proto: true, real: true }, {
	  every: function every(predicate) {
	    anObject(this);
	    aCallable(predicate);
	    var record = getIteratorDirect(this);
	    var counter = 0;
	    return !iterate(record, function (value, stop) {
	      if (!predicate(value, counter++)) return stop();
	    }, { IS_RECORD: true, INTERRUPTED: true }).stopped;
	  }
	});
	return es_iterator_every;
}

var hasRequiredEsnext_iterator_every;

function requireEsnext_iterator_every () {
	if (hasRequiredEsnext_iterator_every) return esnext_iterator_every;
	hasRequiredEsnext_iterator_every = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_every();
	return esnext_iterator_every;
}

requireEsnext_iterator_every();

var esnext_iterator_map = {};

var es_iterator_map = {};

var defineBuiltIns;
var hasRequiredDefineBuiltIns;

function requireDefineBuiltIns () {
	if (hasRequiredDefineBuiltIns) return defineBuiltIns;
	hasRequiredDefineBuiltIns = 1;
	var defineBuiltIn = requireDefineBuiltIn();

	defineBuiltIns = function (target, src, options) {
	  for (var key in src) defineBuiltIn(target, key, src[key], options);
	  return target;
	};
	return defineBuiltIns;
}

var createIterResultObject;
var hasRequiredCreateIterResultObject;

function requireCreateIterResultObject () {
	if (hasRequiredCreateIterResultObject) return createIterResultObject;
	hasRequiredCreateIterResultObject = 1;
	// `CreateIterResultObject` abstract operation
	// https://tc39.es/ecma262/#sec-createiterresultobject
	createIterResultObject = function (value, done) {
	  return { value: value, done: done };
	};
	return createIterResultObject;
}

var iteratorCreateProxy;
var hasRequiredIteratorCreateProxy;

function requireIteratorCreateProxy () {
	if (hasRequiredIteratorCreateProxy) return iteratorCreateProxy;
	hasRequiredIteratorCreateProxy = 1;
	var call = requireFunctionCall();
	var create = requireObjectCreate();
	var createNonEnumerableProperty = requireCreateNonEnumerableProperty();
	var defineBuiltIns = requireDefineBuiltIns();
	var wellKnownSymbol = requireWellKnownSymbol();
	var InternalStateModule = requireInternalState();
	var getMethod = requireGetMethod();
	var IteratorPrototype = requireIteratorsCore().IteratorPrototype;
	var createIterResultObject = requireCreateIterResultObject();
	var iteratorClose = requireIteratorClose();

	var TO_STRING_TAG = wellKnownSymbol('toStringTag');
	var ITERATOR_HELPER = 'IteratorHelper';
	var WRAP_FOR_VALID_ITERATOR = 'WrapForValidIterator';
	var setInternalState = InternalStateModule.set;

	var createIteratorProxyPrototype = function (IS_ITERATOR) {
	  var getInternalState = InternalStateModule.getterFor(IS_ITERATOR ? WRAP_FOR_VALID_ITERATOR : ITERATOR_HELPER);

	  return defineBuiltIns(create(IteratorPrototype), {
	    next: function next() {
	      var state = getInternalState(this);
	      // for simplification:
	      //   for `%WrapForValidIteratorPrototype%.next` our `nextHandler` returns `IterResultObject`
	      //   for `%IteratorHelperPrototype%.next` - just a value
	      if (IS_ITERATOR) return state.nextHandler();
	      try {
	        var result = state.done ? undefined : state.nextHandler();
	        return createIterResultObject(result, state.done);
	      } catch (error) {
	        state.done = true;
	        throw error;
	      }
	    },
	    'return': function () {
	      var state = getInternalState(this);
	      var iterator = state.iterator;
	      state.done = true;
	      if (IS_ITERATOR) {
	        var returnMethod = getMethod(iterator, 'return');
	        return returnMethod ? call(returnMethod, iterator) : createIterResultObject(undefined, true);
	      }
	      if (state.inner) try {
	        iteratorClose(state.inner.iterator, 'normal');
	      } catch (error) {
	        return iteratorClose(iterator, 'throw', error);
	      }
	      if (iterator) iteratorClose(iterator, 'normal');
	      return createIterResultObject(undefined, true);
	    }
	  });
	};

	var WrapForValidIteratorPrototype = createIteratorProxyPrototype(true);
	var IteratorHelperPrototype = createIteratorProxyPrototype(false);

	createNonEnumerableProperty(IteratorHelperPrototype, TO_STRING_TAG, 'Iterator Helper');

	iteratorCreateProxy = function (nextHandler, IS_ITERATOR) {
	  var IteratorProxy = function Iterator(record, state) {
	    if (state) {
	      state.iterator = record.iterator;
	      state.next = record.next;
	    } else state = record;
	    state.type = IS_ITERATOR ? WRAP_FOR_VALID_ITERATOR : ITERATOR_HELPER;
	    state.nextHandler = nextHandler;
	    state.counter = 0;
	    state.done = false;
	    setInternalState(this, state);
	  };

	  IteratorProxy.prototype = IS_ITERATOR ? WrapForValidIteratorPrototype : IteratorHelperPrototype;

	  return IteratorProxy;
	};
	return iteratorCreateProxy;
}

var callWithSafeIterationClosing;
var hasRequiredCallWithSafeIterationClosing;

function requireCallWithSafeIterationClosing () {
	if (hasRequiredCallWithSafeIterationClosing) return callWithSafeIterationClosing;
	hasRequiredCallWithSafeIterationClosing = 1;
	var anObject = requireAnObject();
	var iteratorClose = requireIteratorClose();

	// call something on iterator step with safe closing on error
	callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
	  try {
	    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
	  } catch (error) {
	    iteratorClose(iterator, 'throw', error);
	  }
	};
	return callWithSafeIterationClosing;
}

var iteratorMap;
var hasRequiredIteratorMap;

function requireIteratorMap () {
	if (hasRequiredIteratorMap) return iteratorMap;
	hasRequiredIteratorMap = 1;
	var call = requireFunctionCall();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();
	var createIteratorProxy = requireIteratorCreateProxy();
	var callWithSafeIterationClosing = requireCallWithSafeIterationClosing();

	var IteratorProxy = createIteratorProxy(function () {
	  var iterator = this.iterator;
	  var result = anObject(call(this.next, iterator));
	  var done = this.done = !!result.done;
	  if (!done) return callWithSafeIterationClosing(iterator, this.mapper, [result.value, this.counter++], true);
	});

	// `Iterator.prototype.map` method
	// https://github.com/tc39/proposal-iterator-helpers
	iteratorMap = function map(mapper) {
	  anObject(this);
	  aCallable(mapper);
	  return new IteratorProxy(getIteratorDirect(this), {
	    mapper: mapper
	  });
	};
	return iteratorMap;
}

var hasRequiredEs_iterator_map;

function requireEs_iterator_map () {
	if (hasRequiredEs_iterator_map) return es_iterator_map;
	hasRequiredEs_iterator_map = 1;
	var $ = require_export();
	var map = requireIteratorMap();
	var IS_PURE = requireIsPure();

	// `Iterator.prototype.map` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.map
	$({ target: 'Iterator', proto: true, real: true, forced: IS_PURE }, {
	  map: map
	});
	return es_iterator_map;
}

var hasRequiredEsnext_iterator_map;

function requireEsnext_iterator_map () {
	if (hasRequiredEsnext_iterator_map) return esnext_iterator_map;
	hasRequiredEsnext_iterator_map = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_map();
	return esnext_iterator_map;
}

requireEsnext_iterator_map();

var esnext_iterator_some = {};

var es_iterator_some = {};

var hasRequiredEs_iterator_some;

function requireEs_iterator_some () {
	if (hasRequiredEs_iterator_some) return es_iterator_some;
	hasRequiredEs_iterator_some = 1;
	var $ = require_export();
	var iterate = requireIterate();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();

	// `Iterator.prototype.some` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.some
	$({ target: 'Iterator', proto: true, real: true }, {
	  some: function some(predicate) {
	    anObject(this);
	    aCallable(predicate);
	    var record = getIteratorDirect(this);
	    var counter = 0;
	    return iterate(record, function (value, stop) {
	      if (predicate(value, counter++)) return stop();
	    }, { IS_RECORD: true, INTERRUPTED: true }).stopped;
	  }
	});
	return es_iterator_some;
}

var hasRequiredEsnext_iterator_some;

function requireEsnext_iterator_some () {
	if (hasRequiredEsnext_iterator_some) return esnext_iterator_some;
	hasRequiredEsnext_iterator_some = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_some();
	return esnext_iterator_some;
}

requireEsnext_iterator_some();

var esnext_set_difference_v2 = {};

var es_set_difference_v2 = {};

var setHelpers;
var hasRequiredSetHelpers;

function requireSetHelpers () {
	if (hasRequiredSetHelpers) return setHelpers;
	hasRequiredSetHelpers = 1;
	var uncurryThis = requireFunctionUncurryThis();

	// eslint-disable-next-line es/no-set -- safe
	var SetPrototype = Set.prototype;

	setHelpers = {
	  // eslint-disable-next-line es/no-set -- safe
	  Set: Set,
	  add: uncurryThis(SetPrototype.add),
	  has: uncurryThis(SetPrototype.has),
	  remove: uncurryThis(SetPrototype['delete']),
	  proto: SetPrototype
	};
	return setHelpers;
}

var aSet;
var hasRequiredASet;

function requireASet () {
	if (hasRequiredASet) return aSet;
	hasRequiredASet = 1;
	var has = requireSetHelpers().has;

	// Perform ? RequireInternalSlot(M, [[SetData]])
	aSet = function (it) {
	  has(it);
	  return it;
	};
	return aSet;
}

var iterateSimple;
var hasRequiredIterateSimple;

function requireIterateSimple () {
	if (hasRequiredIterateSimple) return iterateSimple;
	hasRequiredIterateSimple = 1;
	var call = requireFunctionCall();

	iterateSimple = function (record, fn, ITERATOR_INSTEAD_OF_RECORD) {
	  var iterator = ITERATOR_INSTEAD_OF_RECORD ? record : record.iterator;
	  var next = record.next;
	  var step, result;
	  while (!(step = call(next, iterator)).done) {
	    result = fn(step.value);
	    if (result !== undefined) return result;
	  }
	};
	return iterateSimple;
}

var setIterate;
var hasRequiredSetIterate;

function requireSetIterate () {
	if (hasRequiredSetIterate) return setIterate;
	hasRequiredSetIterate = 1;
	var uncurryThis = requireFunctionUncurryThis();
	var iterateSimple = requireIterateSimple();
	var SetHelpers = requireSetHelpers();

	var Set = SetHelpers.Set;
	var SetPrototype = SetHelpers.proto;
	var forEach = uncurryThis(SetPrototype.forEach);
	var keys = uncurryThis(SetPrototype.keys);
	var next = keys(new Set()).next;

	setIterate = function (set, fn, interruptible) {
	  return interruptible ? iterateSimple({ iterator: keys(set), next: next }, fn) : forEach(set, fn);
	};
	return setIterate;
}

var setClone;
var hasRequiredSetClone;

function requireSetClone () {
	if (hasRequiredSetClone) return setClone;
	hasRequiredSetClone = 1;
	var SetHelpers = requireSetHelpers();
	var iterate = requireSetIterate();

	var Set = SetHelpers.Set;
	var add = SetHelpers.add;

	setClone = function (set) {
	  var result = new Set();
	  iterate(set, function (it) {
	    add(result, it);
	  });
	  return result;
	};
	return setClone;
}

var setSize;
var hasRequiredSetSize;

function requireSetSize () {
	if (hasRequiredSetSize) return setSize;
	hasRequiredSetSize = 1;
	var uncurryThisAccessor = requireFunctionUncurryThisAccessor();
	var SetHelpers = requireSetHelpers();

	setSize = uncurryThisAccessor(SetHelpers.proto, 'size', 'get') || function (set) {
	  return set.size;
	};
	return setSize;
}

var getSetRecord;
var hasRequiredGetSetRecord;

function requireGetSetRecord () {
	if (hasRequiredGetSetRecord) return getSetRecord;
	hasRequiredGetSetRecord = 1;
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var call = requireFunctionCall();
	var toIntegerOrInfinity = requireToIntegerOrInfinity();
	var getIteratorDirect = requireGetIteratorDirect();

	var INVALID_SIZE = 'Invalid size';
	var $RangeError = RangeError;
	var $TypeError = TypeError;
	var max = Math.max;

	var SetRecord = function (set, intSize) {
	  this.set = set;
	  this.size = max(intSize, 0);
	  this.has = aCallable(set.has);
	  this.keys = aCallable(set.keys);
	};

	SetRecord.prototype = {
	  getIterator: function () {
	    return getIteratorDirect(anObject(call(this.keys, this.set)));
	  },
	  includes: function (it) {
	    return call(this.has, this.set, it);
	  }
	};

	// `GetSetRecord` abstract operation
	// https://tc39.es/proposal-set-methods/#sec-getsetrecord
	getSetRecord = function (obj) {
	  anObject(obj);
	  var numSize = +obj.size;
	  // NOTE: If size is undefined, then numSize will be NaN
	  // eslint-disable-next-line no-self-compare -- NaN check
	  if (numSize !== numSize) throw new $TypeError(INVALID_SIZE);
	  var intSize = toIntegerOrInfinity(numSize);
	  if (intSize < 0) throw new $RangeError(INVALID_SIZE);
	  return new SetRecord(obj, intSize);
	};
	return getSetRecord;
}

var setDifference;
var hasRequiredSetDifference;

function requireSetDifference () {
	if (hasRequiredSetDifference) return setDifference;
	hasRequiredSetDifference = 1;
	var aSet = requireASet();
	var SetHelpers = requireSetHelpers();
	var clone = requireSetClone();
	var size = requireSetSize();
	var getSetRecord = requireGetSetRecord();
	var iterateSet = requireSetIterate();
	var iterateSimple = requireIterateSimple();

	var has = SetHelpers.has;
	var remove = SetHelpers.remove;

	// `Set.prototype.difference` method
	// https://github.com/tc39/proposal-set-methods
	setDifference = function difference(other) {
	  var O = aSet(this);
	  var otherRec = getSetRecord(other);
	  var result = clone(O);
	  if (size(O) <= otherRec.size) iterateSet(O, function (e) {
	    if (otherRec.includes(e)) remove(result, e);
	  });
	  else iterateSimple(otherRec.getIterator(), function (e) {
	    if (has(O, e)) remove(result, e);
	  });
	  return result;
	};
	return setDifference;
}

var setMethodAcceptSetLike;
var hasRequiredSetMethodAcceptSetLike;

function requireSetMethodAcceptSetLike () {
	if (hasRequiredSetMethodAcceptSetLike) return setMethodAcceptSetLike;
	hasRequiredSetMethodAcceptSetLike = 1;
	var getBuiltIn = requireGetBuiltIn();

	var createSetLike = function (size) {
	  return {
	    size: size,
	    has: function () {
	      return false;
	    },
	    keys: function () {
	      return {
	        next: function () {
	          return { done: true };
	        }
	      };
	    }
	  };
	};

	setMethodAcceptSetLike = function (name) {
	  var Set = getBuiltIn('Set');
	  try {
	    new Set()[name](createSetLike(0));
	    try {
	      // late spec change, early WebKit ~ Safari 17.0 beta implementation does not pass it
	      // https://github.com/tc39/proposal-set-methods/pull/88
	      new Set()[name](createSetLike(-1));
	      return false;
	    } catch (error2) {
	      return true;
	    }
	  } catch (error) {
	    return false;
	  }
	};
	return setMethodAcceptSetLike;
}

var hasRequiredEs_set_difference_v2;

function requireEs_set_difference_v2 () {
	if (hasRequiredEs_set_difference_v2) return es_set_difference_v2;
	hasRequiredEs_set_difference_v2 = 1;
	var $ = require_export();
	var difference = requireSetDifference();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	// `Set.prototype.difference` method
	// https://tc39.es/ecma262/#sec-set.prototype.difference
	$({ target: 'Set', proto: true, real: true, forced: !setMethodAcceptSetLike('difference') }, {
	  difference: difference
	});
	return es_set_difference_v2;
}

var hasRequiredEsnext_set_difference_v2;

function requireEsnext_set_difference_v2 () {
	if (hasRequiredEsnext_set_difference_v2) return esnext_set_difference_v2;
	hasRequiredEsnext_set_difference_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_difference_v2();
	return esnext_set_difference_v2;
}

requireEsnext_set_difference_v2();

var esnext_set_intersection_v2 = {};

var es_set_intersection_v2 = {};

var setIntersection;
var hasRequiredSetIntersection;

function requireSetIntersection () {
	if (hasRequiredSetIntersection) return setIntersection;
	hasRequiredSetIntersection = 1;
	var aSet = requireASet();
	var SetHelpers = requireSetHelpers();
	var size = requireSetSize();
	var getSetRecord = requireGetSetRecord();
	var iterateSet = requireSetIterate();
	var iterateSimple = requireIterateSimple();

	var Set = SetHelpers.Set;
	var add = SetHelpers.add;
	var has = SetHelpers.has;

	// `Set.prototype.intersection` method
	// https://github.com/tc39/proposal-set-methods
	setIntersection = function intersection(other) {
	  var O = aSet(this);
	  var otherRec = getSetRecord(other);
	  var result = new Set();

	  if (size(O) > otherRec.size) {
	    iterateSimple(otherRec.getIterator(), function (e) {
	      if (has(O, e)) add(result, e);
	    });
	  } else {
	    iterateSet(O, function (e) {
	      if (otherRec.includes(e)) add(result, e);
	    });
	  }

	  return result;
	};
	return setIntersection;
}

var hasRequiredEs_set_intersection_v2;

function requireEs_set_intersection_v2 () {
	if (hasRequiredEs_set_intersection_v2) return es_set_intersection_v2;
	hasRequiredEs_set_intersection_v2 = 1;
	var $ = require_export();
	var fails = requireFails();
	var intersection = requireSetIntersection();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	var INCORRECT = !setMethodAcceptSetLike('intersection') || fails(function () {
	  // eslint-disable-next-line es/no-array-from, es/no-set -- testing
	  return String(Array.from(new Set([1, 2, 3]).intersection(new Set([3, 2])))) !== '3,2';
	});

	// `Set.prototype.intersection` method
	// https://tc39.es/ecma262/#sec-set.prototype.intersection
	$({ target: 'Set', proto: true, real: true, forced: INCORRECT }, {
	  intersection: intersection
	});
	return es_set_intersection_v2;
}

var hasRequiredEsnext_set_intersection_v2;

function requireEsnext_set_intersection_v2 () {
	if (hasRequiredEsnext_set_intersection_v2) return esnext_set_intersection_v2;
	hasRequiredEsnext_set_intersection_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_intersection_v2();
	return esnext_set_intersection_v2;
}

requireEsnext_set_intersection_v2();

var esnext_set_isDisjointFrom_v2 = {};

var es_set_isDisjointFrom_v2 = {};

var setIsDisjointFrom;
var hasRequiredSetIsDisjointFrom;

function requireSetIsDisjointFrom () {
	if (hasRequiredSetIsDisjointFrom) return setIsDisjointFrom;
	hasRequiredSetIsDisjointFrom = 1;
	var aSet = requireASet();
	var has = requireSetHelpers().has;
	var size = requireSetSize();
	var getSetRecord = requireGetSetRecord();
	var iterateSet = requireSetIterate();
	var iterateSimple = requireIterateSimple();
	var iteratorClose = requireIteratorClose();

	// `Set.prototype.isDisjointFrom` method
	// https://tc39.github.io/proposal-set-methods/#Set.prototype.isDisjointFrom
	setIsDisjointFrom = function isDisjointFrom(other) {
	  var O = aSet(this);
	  var otherRec = getSetRecord(other);
	  if (size(O) <= otherRec.size) return iterateSet(O, function (e) {
	    if (otherRec.includes(e)) return false;
	  }, true) !== false;
	  var iterator = otherRec.getIterator();
	  return iterateSimple(iterator, function (e) {
	    if (has(O, e)) return iteratorClose(iterator, 'normal', false);
	  }) !== false;
	};
	return setIsDisjointFrom;
}

var hasRequiredEs_set_isDisjointFrom_v2;

function requireEs_set_isDisjointFrom_v2 () {
	if (hasRequiredEs_set_isDisjointFrom_v2) return es_set_isDisjointFrom_v2;
	hasRequiredEs_set_isDisjointFrom_v2 = 1;
	var $ = require_export();
	var isDisjointFrom = requireSetIsDisjointFrom();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	// `Set.prototype.isDisjointFrom` method
	// https://tc39.es/ecma262/#sec-set.prototype.isdisjointfrom
	$({ target: 'Set', proto: true, real: true, forced: !setMethodAcceptSetLike('isDisjointFrom') }, {
	  isDisjointFrom: isDisjointFrom
	});
	return es_set_isDisjointFrom_v2;
}

var hasRequiredEsnext_set_isDisjointFrom_v2;

function requireEsnext_set_isDisjointFrom_v2 () {
	if (hasRequiredEsnext_set_isDisjointFrom_v2) return esnext_set_isDisjointFrom_v2;
	hasRequiredEsnext_set_isDisjointFrom_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_isDisjointFrom_v2();
	return esnext_set_isDisjointFrom_v2;
}

requireEsnext_set_isDisjointFrom_v2();

var esnext_set_isSubsetOf_v2 = {};

var es_set_isSubsetOf_v2 = {};

var setIsSubsetOf;
var hasRequiredSetIsSubsetOf;

function requireSetIsSubsetOf () {
	if (hasRequiredSetIsSubsetOf) return setIsSubsetOf;
	hasRequiredSetIsSubsetOf = 1;
	var aSet = requireASet();
	var size = requireSetSize();
	var iterate = requireSetIterate();
	var getSetRecord = requireGetSetRecord();

	// `Set.prototype.isSubsetOf` method
	// https://tc39.github.io/proposal-set-methods/#Set.prototype.isSubsetOf
	setIsSubsetOf = function isSubsetOf(other) {
	  var O = aSet(this);
	  var otherRec = getSetRecord(other);
	  if (size(O) > otherRec.size) return false;
	  return iterate(O, function (e) {
	    if (!otherRec.includes(e)) return false;
	  }, true) !== false;
	};
	return setIsSubsetOf;
}

var hasRequiredEs_set_isSubsetOf_v2;

function requireEs_set_isSubsetOf_v2 () {
	if (hasRequiredEs_set_isSubsetOf_v2) return es_set_isSubsetOf_v2;
	hasRequiredEs_set_isSubsetOf_v2 = 1;
	var $ = require_export();
	var isSubsetOf = requireSetIsSubsetOf();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	// `Set.prototype.isSubsetOf` method
	// https://tc39.es/ecma262/#sec-set.prototype.issubsetof
	$({ target: 'Set', proto: true, real: true, forced: !setMethodAcceptSetLike('isSubsetOf') }, {
	  isSubsetOf: isSubsetOf
	});
	return es_set_isSubsetOf_v2;
}

var hasRequiredEsnext_set_isSubsetOf_v2;

function requireEsnext_set_isSubsetOf_v2 () {
	if (hasRequiredEsnext_set_isSubsetOf_v2) return esnext_set_isSubsetOf_v2;
	hasRequiredEsnext_set_isSubsetOf_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_isSubsetOf_v2();
	return esnext_set_isSubsetOf_v2;
}

requireEsnext_set_isSubsetOf_v2();

var esnext_set_isSupersetOf_v2 = {};

var es_set_isSupersetOf_v2 = {};

var setIsSupersetOf;
var hasRequiredSetIsSupersetOf;

function requireSetIsSupersetOf () {
	if (hasRequiredSetIsSupersetOf) return setIsSupersetOf;
	hasRequiredSetIsSupersetOf = 1;
	var aSet = requireASet();
	var has = requireSetHelpers().has;
	var size = requireSetSize();
	var getSetRecord = requireGetSetRecord();
	var iterateSimple = requireIterateSimple();
	var iteratorClose = requireIteratorClose();

	// `Set.prototype.isSupersetOf` method
	// https://tc39.github.io/proposal-set-methods/#Set.prototype.isSupersetOf
	setIsSupersetOf = function isSupersetOf(other) {
	  var O = aSet(this);
	  var otherRec = getSetRecord(other);
	  if (size(O) < otherRec.size) return false;
	  var iterator = otherRec.getIterator();
	  return iterateSimple(iterator, function (e) {
	    if (!has(O, e)) return iteratorClose(iterator, 'normal', false);
	  }) !== false;
	};
	return setIsSupersetOf;
}

var hasRequiredEs_set_isSupersetOf_v2;

function requireEs_set_isSupersetOf_v2 () {
	if (hasRequiredEs_set_isSupersetOf_v2) return es_set_isSupersetOf_v2;
	hasRequiredEs_set_isSupersetOf_v2 = 1;
	var $ = require_export();
	var isSupersetOf = requireSetIsSupersetOf();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	// `Set.prototype.isSupersetOf` method
	// https://tc39.es/ecma262/#sec-set.prototype.issupersetof
	$({ target: 'Set', proto: true, real: true, forced: !setMethodAcceptSetLike('isSupersetOf') }, {
	  isSupersetOf: isSupersetOf
	});
	return es_set_isSupersetOf_v2;
}

var hasRequiredEsnext_set_isSupersetOf_v2;

function requireEsnext_set_isSupersetOf_v2 () {
	if (hasRequiredEsnext_set_isSupersetOf_v2) return esnext_set_isSupersetOf_v2;
	hasRequiredEsnext_set_isSupersetOf_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_isSupersetOf_v2();
	return esnext_set_isSupersetOf_v2;
}

requireEsnext_set_isSupersetOf_v2();

var esnext_set_symmetricDifference_v2 = {};

var es_set_symmetricDifference_v2 = {};

var setSymmetricDifference;
var hasRequiredSetSymmetricDifference;

function requireSetSymmetricDifference () {
	if (hasRequiredSetSymmetricDifference) return setSymmetricDifference;
	hasRequiredSetSymmetricDifference = 1;
	var aSet = requireASet();
	var SetHelpers = requireSetHelpers();
	var clone = requireSetClone();
	var getSetRecord = requireGetSetRecord();
	var iterateSimple = requireIterateSimple();

	var add = SetHelpers.add;
	var has = SetHelpers.has;
	var remove = SetHelpers.remove;

	// `Set.prototype.symmetricDifference` method
	// https://github.com/tc39/proposal-set-methods
	setSymmetricDifference = function symmetricDifference(other) {
	  var O = aSet(this);
	  var keysIter = getSetRecord(other).getIterator();
	  var result = clone(O);
	  iterateSimple(keysIter, function (e) {
	    if (has(O, e)) remove(result, e);
	    else add(result, e);
	  });
	  return result;
	};
	return setSymmetricDifference;
}

var hasRequiredEs_set_symmetricDifference_v2;

function requireEs_set_symmetricDifference_v2 () {
	if (hasRequiredEs_set_symmetricDifference_v2) return es_set_symmetricDifference_v2;
	hasRequiredEs_set_symmetricDifference_v2 = 1;
	var $ = require_export();
	var symmetricDifference = requireSetSymmetricDifference();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	// `Set.prototype.symmetricDifference` method
	// https://tc39.es/ecma262/#sec-set.prototype.symmetricdifference
	$({ target: 'Set', proto: true, real: true, forced: !setMethodAcceptSetLike('symmetricDifference') }, {
	  symmetricDifference: symmetricDifference
	});
	return es_set_symmetricDifference_v2;
}

var hasRequiredEsnext_set_symmetricDifference_v2;

function requireEsnext_set_symmetricDifference_v2 () {
	if (hasRequiredEsnext_set_symmetricDifference_v2) return esnext_set_symmetricDifference_v2;
	hasRequiredEsnext_set_symmetricDifference_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_symmetricDifference_v2();
	return esnext_set_symmetricDifference_v2;
}

requireEsnext_set_symmetricDifference_v2();

var esnext_set_union_v2 = {};

var es_set_union_v2 = {};

var setUnion;
var hasRequiredSetUnion;

function requireSetUnion () {
	if (hasRequiredSetUnion) return setUnion;
	hasRequiredSetUnion = 1;
	var aSet = requireASet();
	var add = requireSetHelpers().add;
	var clone = requireSetClone();
	var getSetRecord = requireGetSetRecord();
	var iterateSimple = requireIterateSimple();

	// `Set.prototype.union` method
	// https://github.com/tc39/proposal-set-methods
	setUnion = function union(other) {
	  var O = aSet(this);
	  var keysIter = getSetRecord(other).getIterator();
	  var result = clone(O);
	  iterateSimple(keysIter, function (it) {
	    add(result, it);
	  });
	  return result;
	};
	return setUnion;
}

var hasRequiredEs_set_union_v2;

function requireEs_set_union_v2 () {
	if (hasRequiredEs_set_union_v2) return es_set_union_v2;
	hasRequiredEs_set_union_v2 = 1;
	var $ = require_export();
	var union = requireSetUnion();
	var setMethodAcceptSetLike = requireSetMethodAcceptSetLike();

	// `Set.prototype.union` method
	// https://tc39.es/ecma262/#sec-set.prototype.union
	$({ target: 'Set', proto: true, real: true, forced: !setMethodAcceptSetLike('union') }, {
	  union: union
	});
	return es_set_union_v2;
}

var hasRequiredEsnext_set_union_v2;

function requireEsnext_set_union_v2 () {
	if (hasRequiredEsnext_set_union_v2) return esnext_set_union_v2;
	hasRequiredEsnext_set_union_v2 = 1;
	// TODO: Remove from `core-js@4`
	requireEs_set_union_v2();
	return esnext_set_union_v2;
}

requireEsnext_set_union_v2();

/** @import { Matrix3x3, Vector3 } from "./types.js" */

/**
 * A is m x n. B is n x p. product is m x p.
 *
 * Array arguments are treated like vectors:
 * - A becomes 1 x n
 * - B becomes n x 1
 *
 * Returns Matrix m x p or equivalent array or number
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[]} B Vector n x 1
 * @returns {number} Scalar number
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[]} B Vector n x 1
 * @returns {number[]} Array with length m
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[]} Array with length p
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[][]} Matrix m x p
 *
 * @param {number[] | number[][]} A Matrix m x n or a vector
 * @param {number[] | number[][]} B Matrix n x p or a vector
 * @returns {number | number[] | number[][]} Matrix m x p or equivalent array or number
 */
function multiplyMatrices(A, B) {
  let m = A.length;
  /** @type {number[][]} */
  let AM;
  /** @type {number[][]} */
  let BM;
  let aVec = false;
  let bVec = false;
  if (!Array.isArray(A[0])) {
    // A is vector, convert to [[a, b, c, ...]]
    AM = [(/** @type {number[]} */A)];
    m = AM.length;
    aVec = true;
  } else {
    AM = /** @type {number[][]} */A;
  }
  if (!Array.isArray(B[0])) {
    // B is vector, convert to [[a], [b], [c], ...]]
    BM = B.length > 0 ? B.map(x => [x]) : [[]]; // Avoid mapping empty array
    bVec = true;
  } else {
    BM = /** @type {number[][]} */B;
  }
  let p = BM[0].length;
  let BM_cols = BM[0].map((_, i) => BM.map(x => x[i])); // transpose B
  /** @type {number[] | number[][]} */
  let product = AM.map(row => BM_cols.map(col => {
    let ret = 0;
    if (!Array.isArray(row)) {
      for (let c of col) {
        ret += row * c;
      }
      return ret;
    }
    for (let i = 0; i < row.length; i++) {
      ret += row[i] * (col[i] || 0);
    }
    return ret;
  }));
  if (m === 1 && aVec) {
    product = product[0]; // Avoid [[a, b, c, ...]]
  }
  if (p === 1 && bVec) {
    if (m === 1 && aVec) {
      return product[0]; // Avoid [[a]], return a number
    } else {
      return product.map(x => x[0]); // Avoid [[a], [b], [c], ...]]
    }
  }
  return product;
}

// dot3 and transform functions adapted from https://github.com/texel-org/color/blob/9793c7d4d02b51f068e0f3fd37131129a4270396/src/core.js
//
// The MIT License (MIT)
// Copyright (c) 2024 Matt DesLauriers

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
// OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * Returns the dot product of two vectors each with a length of 3.
 *
 * @param {Vector3} a
 * @param {Vector3} b
 * @returns {number}
 */
function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Transforms a vector of length 3 by a 3x3 matrix. Specify the same input and output
 * vector to transform in place.
 *
 * @param {Vector3} input
 * @param {Matrix3x3} matrix
 * @param {Vector3} [out]
 * @returns {Vector3}
 */
function multiply_v3_m3x3(input, matrix, out = [0, 0, 0]) {
  const x = dot3(input, matrix[0]);
  const y = dot3(input, matrix[1]);
  const z = dot3(input, matrix[2]);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Various utility functions
 */


/**
 * Check if a value is a string (including a String object)
 * @param {any} str - Value to check
 * @returns {str is string}
 */
function isString(str) {
  return type(str) === "string";
}

/**
 * Determine the internal JavaScript [[Class]] of an object.
 * @param {any} o - Value to check
 * @returns {string}
 */
function type(o) {
  let str = Object.prototype.toString.call(o);
  return (str.match(/^\[object\s+(.*?)\]$/)[1] || "").toLowerCase();
}

/**
 * @param {number} n
 * @param {{ precision?: number | undefined, unit?: string | undefined }} options
 * @returns {string}
 */
function serializeNumber(n, {
  precision = 16,
  unit
}) {
  if (isNone(n)) {
    return "none";
  }
  n = +toPrecision(n, precision);
  return n + (unit !== null && unit !== void 0 ? unit : "");
}

/**
 * Check if a value corresponds to a none argument
 * @param {any} n - Value to check
 * @returns {n is null}
 */
function isNone(n) {
  return n === null;
}

/**
 * Replace none values with 0
 * @param {number | null} n
 * @returns {number}
 */
function skipNone(n) {
  return isNone(n) ? 0 : n;
}

/**
 * Round a number to a certain number of significant digits
 * @param {number} n - The number to round
 * @param {number} precision - Number of significant digits
 */
function toPrecision(n, precision) {
  if (n === 0) {
    return 0;
  }
  let integer = ~~n;
  let digits = 0;
  if (integer && precision) {
    digits = ~~Math.log10(Math.abs(integer)) + 1;
  }
  const multiplier = 10.0 ** (precision - digits);
  return Math.floor(n * multiplier + 0.5) / multiplier;
}

/**
 * @param {number} start
 * @param {number} end
 * @param {number} p
 */
function interpolate(start, end, p) {
  if (isNaN(start)) {
    return end;
  }
  if (isNaN(end)) {
    return start;
  }
  return start + (end - start) * p;
}

/**
 * @param {number} start
 * @param {number} end
 * @param {number} value
 */
function interpolateInv(start, end, value) {
  return (value - start) / (end - start);
}

/**
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} value
 */
function mapRange(from, to, value) {
  if (!from || !to || from === to || from[0] === to[0] && from[1] === to[1] || isNaN(value) || value === null) {
    // Ranges missing or the same
    return value;
  }
  return interpolate(to[0], to[1], interpolateInv(from[0], from[1], value));
}

/**
 * Clamp value between the minimum and maximum
 * @param {number} min minimum value to return
 * @param {number} val the value to return if it is between min and max
 * @param {number} max maximum value to return
 */
function clamp(min, val, max) {
  return Math.max(Math.min(max, val), min);
}

/**
 * Copy sign of one value to another.
 * @param {number} to - Number to copy sign to
 * @param {number} from - Number to copy sign from
 */
function copySign(to, from) {
  return Math.sign(to) === Math.sign(from) ? to : -to;
}

/**
 * Perform pow on a signed number and copy sign to result
 * @param {number} base The base number
 * @param {number} exp The exponent
 */
function spow(base, exp) {
  return copySign(Math.abs(base) ** exp, base);
}

/**
 * Perform a divide, but return zero if the denominator is zero
 * @param {number} n The numerator
 * @param {number} d The denominator
 */
function zdiv(n, d) {
  return d === 0 ? 0 : n / d;
}

/**
 * Perform a bisect on a sorted list and locate the insertion point for
 * a value in arr to maintain sorted order.
 * @param {number[]} arr - array of sorted numbers
 * @param {number} value - value to find insertion point for
 * @param {number} lo - used to specify a the low end of a subset of the list
 * @param {number} hi - used to specify a the high end of a subset of the list
 */
function bisectLeft(arr, value, lo = 0, hi = arr.length) {
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (arr[mid] < value) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Determines whether an argument is an instance of a constructor, including subclasses.
 * This is done by first just checking `instanceof`,
 * and then comparing the string names of the constructors if that fails.
 * @param {any} arg
 * @param {C} constructor
 * @template {new (...args: any) => any} C
 * @returns {arg is InstanceType<C>}
 */
function isInstance(arg, constructor) {
  if (arg instanceof constructor) {
    return true;
  }
  const targetName = constructor.name;
  while (arg) {
    var _proto$constructor;
    const proto = Object.getPrototypeOf(arg);
    const constructorName = proto === null || proto === void 0 || (_proto$constructor = proto.constructor) === null || _proto$constructor === void 0 ? void 0 : _proto$constructor.name;
    if (constructorName === targetName) {
      return true;
    }
    if (!constructorName || constructorName === "Object") {
      return false;
    }
    arg = proto;
  }
  return false;
}

var esnext_iterator_find = {};

var es_iterator_find = {};

var hasRequiredEs_iterator_find;

function requireEs_iterator_find () {
	if (hasRequiredEs_iterator_find) return es_iterator_find;
	hasRequiredEs_iterator_find = 1;
	var $ = require_export();
	var iterate = requireIterate();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();

	// `Iterator.prototype.find` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.find
	$({ target: 'Iterator', proto: true, real: true }, {
	  find: function find(predicate) {
	    anObject(this);
	    aCallable(predicate);
	    var record = getIteratorDirect(this);
	    var counter = 0;
	    return iterate(record, function (value, stop) {
	      if (predicate(value, counter++)) return stop(value);
	    }, { IS_RECORD: true, INTERRUPTED: true }).result;
	  }
	});
	return es_iterator_find;
}

var hasRequiredEsnext_iterator_find;

function requireEsnext_iterator_find () {
	if (hasRequiredEsnext_iterator_find) return esnext_iterator_find;
	hasRequiredEsnext_iterator_find = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_find();
	return esnext_iterator_find;
}

requireEsnext_iterator_find();

class Type {
  // Class properties - declared here so that type inference works
  type;
  coordMeta;
  coordRange;
  /** @type {[number, number]} */
  range;

  /**
   * @param {any} type
   * @param {import("./types.js").CoordMeta} coordMeta
   */
  constructor(type, coordMeta) {
    if (typeof type === "object") {
      this.coordMeta = type;
    }
    if (coordMeta) {
      var _coordMeta$range;
      this.coordMeta = coordMeta;
      this.coordRange = (_coordMeta$range = coordMeta.range) !== null && _coordMeta$range !== void 0 ? _coordMeta$range : coordMeta.refRange;
    }
    if (typeof type === "string") {
      let params = type.trim().match(/^(?<type><[a-z]+>)(\[(?<min>-?[.\d]+),\s*(?<max>-?[.\d]+)\])?$/);
      if (!params) {
        throw new TypeError(`Cannot parse ${type} as a type definition.`);
      }
      this.type = params.groups.type;
      let {
        min,
        max
      } = params.groups;
      if (min || max) {
        this.range = [+min, +max];
      }
    }
  }

  /** @returns {[number, number]} */
  get computedRange() {
    if (this.range) {
      return this.range;
    }
    if (this.type === "<percentage>") {
      return this.percentageRange();
    } else if (this.type === "<angle>") {
      return [0, 360];
    }
    return null;
  }
  get unit() {
    if (this.type === "<percentage>") {
      return "%";
    } else if (this.type === "<angle>") {
      return "deg";
    }
    return "";
  }

  /**
   * Map a number to the internal representation
   * @param {number} number
   */
  resolve(number) {
    if (this.type === "<angle>") {
      return number;
    }
    let fromRange = this.computedRange;
    let toRange = this.coordRange;
    if (this.type === "<percentage>") {
      var _toRange;
      (_toRange = toRange) !== null && _toRange !== void 0 ? _toRange : toRange = this.percentageRange();
    }
    return mapRange(fromRange, toRange, number);
  }

  /**
   * Serialize a number from the internal representation to a string
   * @param {number} number
   * @param {number} [precision]
   */
  serialize(number, precision) {
    let toRange = this.type === "<percentage>" ? this.percentageRange(100) : this.computedRange;
    let unit = this.unit;
    number = mapRange(this.coordRange, toRange, number);
    return serializeNumber(number, {
      unit,
      precision
    });
  }
  toString() {
    let ret = this.type;
    if (this.range) {
      let [min = "", max = ""] = this.range;
      ret += `[${min},${max}]`;
    }
    return ret;
  }

  /**
   * Returns a percentage range for values of this type
   * @param {number} scale
   * @returns {[number, number]}
   */
  percentageRange(scale = 1) {
    let range;
    if (this.coordMeta && this.coordMeta.range || this.coordRange && this.coordRange[0] >= 0) {
      range = [0, 1];
    } else {
      range = [-1, 1];
    }
    return [range[0] * scale, range[1] * scale];
  }
  static get(type, coordMeta) {
    if (isInstance(type, this)) {
      return type;
    }
    return new this(type, coordMeta);
  }
}

/** @import { ColorSpace, Coords } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").Format} FormatInterface */

/**
 * @internal
 * Used to index {@link FormatInterface Format} objects and store an instance.
 * Not meant for external use
 */
const instance = Symbol("instance");

/**
 * Remove the first element of an array type
 * @template {any[]} T
 * @typedef {T extends [any, ...infer R] ? R : T[number][]} RemoveFirstElement
 */

/**
 * @class Format
 * @implements {Omit<FormatInterface, "coords" | "serializeCoords">}
 * Class to hold a color serialization format
 */
class Format {
  // Class properties - declared here so that type inference works
  type;
  name;
  spaceCoords;
  /** @type {Type[][]} */
  coords;
  /** @type {string | undefined} */
  id;
  /** @type {boolean | undefined} */
  alpha;

  /**
   * @param {FormatInterface} format
   * @param {ColorSpace} space
   */
  constructor(format, space = format.space) {
    format[instance] = this;
    this.type = "function";
    this.name = "color";
    Object.assign(this, format);
    this.space = space;
    if (this.type === "custom") {
      // Nothing else to do here
      return;
    }
    this.spaceCoords = Object.values(space.coords);
    if (!this.coords) {
      // @ts-expect-error Strings are converted to the correct type later
      this.coords = this.spaceCoords.map(coordMeta => {
        let ret = ["<number>", "<percentage>"];
        if (coordMeta.type === "angle") {
          ret.push("<angle>");
        }
        return ret;
      });
    }
    this.coords = this.coords.map(/** @param {string | string[] | Type[]} types */(types, i) => {
      let coordMeta = this.spaceCoords[i];
      if (typeof types === "string") {
        types = types.trim().split(/\s*\|\s*/);
      }
      return types.map(type => Type.get(type, coordMeta));
    });
  }

  /**
   * @param {Coords} coords
   * @param {number} precision
   * @param {Type[]} types
   */
  serializeCoords(coords, precision, types) {
    types = coords.map((_, i) => {
      var _types$i, _types;
      return Type.get((_types$i = (_types = types) === null || _types === void 0 ? void 0 : _types[i]) !== null && _types$i !== void 0 ? _types$i : this.coords[i][0], this.spaceCoords[i]);
    });
    return coords.map((c, i) => types[i].serialize(c, precision));
  }

  /**
   * Validates the coordinates of a color against a format's coord grammar and
   * maps the coordinates to the range or refRange of the coordinates.
   * @param {Coords} coords
   * @param {[string, string, string]} types
   */
  coerceCoords(coords, types) {
    return Object.entries(this.space.coords).map(([id, coordMeta], i) => {
      let arg = coords[i];
      if (isNone(arg) || isNaN(arg)) {
        // Nothing to do here
        return arg;
      }

      // Find grammar alternative that matches the provided type
      // Non-strict equals is intentional because we are comparing w/ string objects
      let providedType = types[i];
      let type = this.coords[i].find(c => c.type == providedType);

      // Check that each coord conforms to its grammar
      if (!type) {
        var _ref, _arg;
        // Type does not exist in the grammar, throw
        let coordName = coordMeta.name || id;
        throw new TypeError(`${(_ref = providedType !== null && providedType !== void 0 ? providedType : /** @type {any} */(_arg = arg) === null || _arg === void 0 ? void 0 : _arg.raw) !== null && _ref !== void 0 ? _ref : arg} not allowed for ${coordName} in ${this.name}()`);
      }
      arg = type.resolve(arg);
      if (type.range) {
        // Adjust type to include range
        types[i] = type.toString();
      }
      return arg;
    });
  }

  /**
   * @returns {boolean | Required<FormatInterface>["serialize"]}
   */
  canSerialize() {
    return this.type === "function" || /** @type {any} */this.serialize;
  }

  /**
   * @param {string} str
   * @returns {(import("./types.js").ColorConstructor) | undefined | null}
   */
  parse(str) {
    return null;
  }

  /**
   * @param {Format | FormatInterface} format
   * @param {RemoveFirstElement<ConstructorParameters<typeof Format>>} args
   * @returns {Format}
   */
  static get(format, ...args) {
    if (!format || isInstance(format, this)) {
      return /** @type {Format} */format;
    }
    if (format[instance]) {
      return format[instance];
    }
    return new Format(format, ...args);
  }
}

var esnext_iterator_forEach = {};

var es_iterator_forEach = {};

var hasRequiredEs_iterator_forEach;

function requireEs_iterator_forEach () {
	if (hasRequiredEs_iterator_forEach) return es_iterator_forEach;
	hasRequiredEs_iterator_forEach = 1;
	var $ = require_export();
	var iterate = requireIterate();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();

	// `Iterator.prototype.forEach` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.foreach
	$({ target: 'Iterator', proto: true, real: true }, {
	  forEach: function forEach(fn) {
	    anObject(this);
	    aCallable(fn);
	    var record = getIteratorDirect(this);
	    var counter = 0;
	    iterate(record, function (value) {
	      fn(value, counter++);
	    }, { IS_RECORD: true });
	  }
	});
	return es_iterator_forEach;
}

var hasRequiredEsnext_iterator_forEach;

function requireEsnext_iterator_forEach () {
	if (hasRequiredEsnext_iterator_forEach) return esnext_iterator_forEach;
	hasRequiredEsnext_iterator_forEach = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_forEach();
	return esnext_iterator_forEach;
}

requireEsnext_iterator_forEach();

/**
 * A class for adding deep extensibility to any piece of JS code
 */
class Hooks {
  add(name, callback, first) {
    if (typeof arguments[0] != "string") {
      // Multiple hooks
      for (var name in arguments[0]) {
        this.add(name, arguments[0][name], arguments[1]);
      }
      return;
    }
    (Array.isArray(name) ? name : [name]).forEach(function (name) {
      this[name] = this[name] || [];
      if (callback) {
        this[name][first ? "unshift" : "push"](callback);
      }
    }, this);
  }
  run(name, env) {
    this[name] = this[name] || [];
    this[name].forEach(function (callback) {
      callback.call(env && env.context ? env.context : env, env);
    });
  }
}

/**
 * The instance of {@link Hooks} used throughout Color.js
 */
const hooks = new Hooks();

// Type re-exports
/** @typedef {import("./types.js").White} White */

/** @type {Record<string, White>} */
// prettier-ignore
const WHITES = {
  // for compatibility, the four-digit chromaticity-derived ones everyone else uses
  D50: [0.3457 / 0.3585, 1.00000, (1.0 - 0.3457 - 0.3585) / 0.3585],
  D65: [0.3127 / 0.3290, 1.00000, (1.0 - 0.3127 - 0.3290) / 0.3290]
};

/**
 *
 * @param {string | White} name
 * @returns {White}
 */
function getWhite(name) {
  if (Array.isArray(name)) {
    return name;
  }
  return WHITES[name];
}

/**
 * Adapt XYZ from white point W1 to W2
 * @param {White | string} W1
 * @param {White | string} W2
 * @param {[number, number, number]} XYZ
 * @param {{ method?: string | undefined }} options
 * @returns {[number, number, number]}
 */
function adapt$2(W1, W2, XYZ, options = {}) {
  W1 = getWhite(W1);
  W2 = getWhite(W2);
  if (!W1 || !W2) {
    throw new TypeError(`Missing white point to convert ${!W1 ? "from" : ""}${!W1 && !W2 ? "/" : ""}${!W2 ? "to" : ""}`);
  }
  if (W1 === W2) {
    // Same whitepoints, no conversion needed
    return XYZ;
  }
  let env = {
    W1,
    W2,
    XYZ,
    options
  };
  hooks.run("chromatic-adaptation-start", env);
  if (!env.M) {
    if (env.W1 === WHITES.D65 && env.W2 === WHITES.D50) {
      // prettier-ignore
      env.M = [[1.0479297925449969, 0.022946870601609652, -0.05019226628920524], [0.02962780877005599, 0.9904344267538799, -0.017073799063418826], [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371]];
    } else if (env.W1 === WHITES.D50 && env.W2 === WHITES.D65) {
      // prettier-ignore
      env.M = [[0.955473421488075, -0.02309845494876471, 0.06325924320057072], [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323], [0.012314014864481998, -0.020507649298898964, 1.330365926242124]];
    }
  }
  hooks.run("chromatic-adaptation-end", env);
  if (env.M) {
    return multiply_v3_m3x3(env.XYZ, env.M);
  } else {
    throw new TypeError("Only Bradford CAT with white points D50 and D65 supported for now.");
  }
}

var _globalThis$process;
// Global defaults one may want to configure
var defaults = {
  gamut_mapping: "css",
  precision: 5,
  deltaE: "76",
  // Default deltaE method
  verbose: (globalThis === null || globalThis === void 0 || (_globalThis$process = globalThis.process) === null || _globalThis$process === void 0 || (_globalThis$process = _globalThis$process.env) === null || _globalThis$process === void 0 || (_globalThis$process = _globalThis$process.NODE_ENV) === null || _globalThis$process === void 0 ? void 0 : _globalThis$process.toLowerCase()) !== "test",
  warn: function warn(msg) {
    if (this.verbose) {
      var _globalThis$console, _globalThis$console$w;
      globalThis === null || globalThis === void 0 || (_globalThis$console = globalThis.console) === null || _globalThis$console === void 0 || (_globalThis$console$w = _globalThis$console.warn) === null || _globalThis$console$w === void 0 || _globalThis$console$w.call(_globalThis$console, msg);
    }
  }
};

/** @import { ColorConstructor } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").ArgumentMeta} ArgumentMeta */
/** @typedef {import("./types.js").ParseFunctionReturn} ParseFunctionReturn */
/** @typedef {import("./types.js").ParseOptions} ParseOptions */

/**
 * Convert a CSS Color string to a color object
 * @param {string} str
 * @param {ParseOptions} [options]
 * @returns {ColorConstructor}
 */
function parse(str, options) {
  var _String, _env$options$parseMet;
  let env = {
    str: (_String = String(str)) === null || _String === void 0 ? void 0 : _String.trim(),
    options
  };
  hooks.run("parse-start", env);
  if (env.color) {
    return env.color;
  }
  env.parsed = parseFunction(env.str);
  let ret;
  let meta = env.options ? (_env$options$parseMet = env.options.parseMeta) !== null && _env$options$parseMet !== void 0 ? _env$options$parseMet : env.options.meta : null;
  if (env.parsed) {
    // Is a functional syntax
    let name = env.parsed.name;
    let format;
    let space;
    let coords = env.parsed.args;
    let types = coords.map((c, i) => {
      var _env$parsed$argMeta$i;
      return (_env$parsed$argMeta$i = env.parsed.argMeta[i]) === null || _env$parsed$argMeta$i === void 0 ? void 0 : _env$parsed$argMeta$i.type;
    });
    if (name === "color") {
      // color() function
      let id = coords.shift();
      types.shift();
      // Check against both <dashed-ident> and <ident> versions
      let alternateId = id.startsWith("--") ? id.substring(2) : `--${id}`;
      let ids = [id, alternateId];
      format = ColorSpace.findFormat({
        name,
        id: ids,
        type: "function"
      });
      if (!format) {
        var _didYouMean;
        // Not found
        let didYouMean;
        let registryId = id in ColorSpace.registry ? id : alternateId;
        if (registryId in ColorSpace.registry) {
          var _ColorSpace$registry$;
          // Used color space id instead of color() id, these are often different
          let cssId = (_ColorSpace$registry$ = ColorSpace.registry[registryId].formats) === null || _ColorSpace$registry$ === void 0 || (_ColorSpace$registry$ = _ColorSpace$registry$.color) === null || _ColorSpace$registry$ === void 0 ? void 0 : _ColorSpace$registry$.id;
          if (cssId) {
            let altColor = str.replace("color(" + id, "color(" + cssId);
            didYouMean = `Did you mean ${altColor}?`;
          }
        }
        throw new TypeError(`Cannot parse ${env.str}. ` + ((_didYouMean = didYouMean) !== null && _didYouMean !== void 0 ? _didYouMean : "Missing a plugin?"));
      }
      space = format.space;
      if (format.id.startsWith("--") && !id.startsWith("--")) {
        defaults.warn(`${space.name} is a non-standard space and not currently supported in the CSS spec. ` + `Use prefixed color(${format.id}) instead of color(${id}).`);
      }
      if (id.startsWith("--") && !format.id.startsWith("--")) {
        defaults.warn(`${space.name} is a standard space and supported in the CSS spec. ` + `Use color(${format.id}) instead of prefixed color(${id}).`);
      }
    } else {
      format = ColorSpace.findFormat({
        name,
        type: "function"
      });
      space = format.space;
    }
    if (meta) {
      Object.assign(meta, {
        format,
        formatId: format.name,
        types,
        commas: env.parsed.commas
      });
    }
    let alpha = 1;
    if (env.parsed.lastAlpha) {
      alpha = env.parsed.args.pop();
      if (meta) {
        meta.alphaType = types.pop();
      }
    }
    let coordCount = format.coords.length;
    if (coords.length !== coordCount) {
      throw new TypeError(`Expected ${coordCount} coordinates for ${space.id} in ${env.str}), got ${coords.length}`);
    }
    coords = format.coerceCoords(coords, types);
    ret = {
      spaceId: space.id,
      coords,
      alpha
    };
  } else {
    // Custom, colorspace-specific format
    spaceloop: for (let space of ColorSpace.all) {
      for (let formatId in space.formats) {
        let format = space.formats[formatId];
        if (format.type !== "custom") {
          continue;
        }
        if (format.test && !format.test(env.str)) {
          continue;
        }

        // Convert to Format object
        let formatObject = space.getFormat(format);
        let color = formatObject.parse(env.str);
        if (color) {
          if (meta) {
            Object.assign(meta, {
              format: formatObject,
              formatId
            });
          }
          ret = color;
          break spaceloop;
        }
      }
    }
  }
  if (!ret) {
    // If we're here, we couldn't parse
    throw new TypeError(`Could not parse ${str} as a color. Missing a plugin?`);
  }

  // Clamp alpha to [0, 1]
  ret.alpha = isNone(ret.alpha) ? ret.alpha : ret.alpha === undefined ? 1 : clamp(0, ret.alpha, 1);
  return ret;
}

/**
 * Units and multiplication factors for the internally stored numbers
 */
const units = {
  "%": 0.01,
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360
};
const regex = {
  // Need to list calc(NaN) explicitly as otherwise its ending paren would terminate the function call
  function: /^([a-z]+)\(((?:calc\(NaN\)|.)+?)\)$/i,
  number: /^([-+]?(?:[0-9]*\.)?[0-9]+(e[-+]?[0-9]+)?)$/i,
  unitValue: RegExp(`(${Object.keys(units).join("|")})$`),
  // NOTE The -+ are not just for prefix, but also for idents, and e+N notation!
  singleArgument: /\/?\s*(none|NaN|calc\(NaN\)|[-+\w.]+(?:%|deg|g?rad|turn)?)/g
};

/**
 * Parse a single function argument
 * @param {string} rawArg
 * @returns {{value: number, meta: ArgumentMeta}}
 */
function parseArgument(rawArg) {
  var _rawArg$match;
  /** @type {Partial<ArgumentMeta>} */
  let meta = {};
  let unit = (_rawArg$match = rawArg.match(regex.unitValue)) === null || _rawArg$match === void 0 ? void 0 : _rawArg$match[0];
  /** @type {string | number} */
  let value = meta.raw = rawArg;
  if (unit) {
    // It’s a dimension token
    meta.type = unit === "%" ? "<percentage>" : "<angle>";
    meta.unit = unit;
    meta.unitless = Number(value.slice(0, -unit.length)); // unitless number

    value = meta.unitless * units[unit];
  } else if (regex.number.test(value)) {
    // It's a number
    // Convert numerical args to numbers
    value = Number(value);
    meta.type = "<number>";
  } else if (value === "none") {
    value = null;
  } else if (value === "NaN" || value === "calc(NaN)") {
    value = NaN;
    meta.type = "<number>";
  } else {
    meta.type = "<ident>";
  }
  return {
    value: (/** @type {number} */value),
    meta: (/** @type {ArgumentMeta} */meta)
  };
}

/**
 * Parse a CSS function, regardless of its name and arguments
 * @param {string} str String to parse
 * @return {ParseFunctionReturn | void}
 */
function parseFunction(str) {
  if (!str) {
    return;
  }
  str = str.trim();
  let parts = str.match(regex.function);
  if (parts) {
    // It is a function, parse args
    let args = [];
    let argMeta = [];
    let lastAlpha = false;
    let name = parts[1].toLowerCase();
    let separators = parts[2].replace(regex.singleArgument, ($0, rawArg) => {
      let {
        value,
        meta
      } = parseArgument(rawArg);
      if (
      // If there's a slash here, it's modern syntax
      $0.startsWith("/") ||
      // If there's still elements to process after there's already 3 in `args` (and the we're not dealing with "color()"), it's likely to be a legacy color like "hsl(0, 0%, 0%, 0.5)"
      name !== "color" && args.length === 3) {
        // It's alpha
        lastAlpha = true;
      }
      args.push(value);
      argMeta.push(meta);
      return "";
    });
    return {
      name,
      args,
      argMeta,
      lastAlpha,
      commas: separators.includes(","),
      rawName: parts[1],
      rawArgs: parts[2]
    };
  }
}

/** @import { ColorTypes, ParseOptions as GetColorOptions, PlainColorObject } from "./types.js" */

/**
 * Resolves a color reference (object or string) to a plain color object
 * @overload
 * @param {ColorTypes} color
 * @param {GetColorOptions} [options]
 * @returns {PlainColorObject}
 */
/**
 * @overload
 * @param {ColorTypes[]} color
 * @param {GetColorOptions} [options]
 * @returns {PlainColorObject[]}
 */
function getColor(color, options) {
  if (Array.isArray(color)) {
    return color.map(c => getColor(c, options));
  }
  if (!color) {
    throw new TypeError("Empty color reference");
  }
  if (isString(color)) {
    color = parse(color, options);
  }

  // Object fixup
  let space = color.space || color.spaceId;
  if (typeof space === "string") {
    // Convert string id to color space object
    color.space = ColorSpace.get(space);
  }
  if (color.alpha === undefined) {
    color.alpha = 1;
  }
  return color;
}

const ε$7 = 0.000075;

/**
 * Class to represent a color space
 */
class ColorSpace {
  constructor(options) {
    var _options$displaySpace, _options$coords, _ref, _options$white, _options$formats, _this$formats$color;
    this.id = options.id;
    this.name = options.name;
    this.base = options.base ? ColorSpace.get(options.base) : null;
    this.aliases = options.aliases;
    this.displaySpaces = (_options$displaySpace = options.displaySpaces) === null || _options$displaySpace === void 0 ? void 0 : _options$displaySpace.map(space => ColorSpace.get(space));

    // This space's ancestors, closest first (immediate base → root), excluding the space itself.
    this.bases = [];
    for (let base = this.base; base; base = base.base) {
      this.bases.push(base);
    }
    if (options.rgbGamut) {
      this.rgbGamut = options.rgbGamut;
    }
    if (options.linearGamut) {
      this.linearGamut = options.linearGamut;
    }
    if (this.base) {
      this.fromBase = options.fromBase;
      this.toBase = options.toBase;
    }

    // Coordinate metadata

    let coords = (_options$coords = options.coords) !== null && _options$coords !== void 0 ? _options$coords : this.base.coords;
    for (let name in coords) {
      if (!("name" in coords[name])) {
        coords[name].name = name;
      }
    }
    this.coords = coords;

    // White point

    let white = (_ref = (_options$white = options.white) !== null && _options$white !== void 0 ? _options$white : this.base.white) !== null && _ref !== void 0 ? _ref : "D65";
    this.white = getWhite(white);

    // Sort out formats

    this.formats = (_options$formats = options.formats) !== null && _options$formats !== void 0 ? _options$formats : {};
    for (let name in this.formats) {
      let format = this.formats[name];
      format.type || (format.type = "function");
      format.name || (format.name = name);
    }
    if (!((_this$formats$color = this.formats.color) !== null && _this$formats$color !== void 0 && _this$formats$color.id)) {
      var _this$formats$color2;
      this.formats.color = {
        ...((_this$formats$color2 = this.formats.color) !== null && _this$formats$color2 !== void 0 ? _this$formats$color2 : {}),
        id: options.cssId || this.id
      };
    }

    // Gamut space

    if (options.gamutSpace) {
      // Gamut space explicitly specified
      this.gamutSpace = options.gamutSpace === "self" ? this : ColorSpace.get(options.gamutSpace);
    } else {
      // No gamut space specified, calculate a sensible default
      if (this.isPolar) {
        // Do not check gamut through polar coordinates
        this.gamutSpace = this.base;
      } else {
        this.gamutSpace = this;
      }
    }

    // Optimize inGamut for unbounded spaces
    if (this.gamutSpace.isUnbounded) {
      this.inGamut = (coords, options) => {
        return true;
      };
    }

    // Other stuff
    this.referred = options.referred;

    // Compute ancestors and store them, since they will never change
    Object.defineProperty(this, "path", {
      value: getPath(this).reverse(),
      writable: false,
      enumerable: true,
      configurable: true
    });
    hooks.run("colorspace-init-end", this);
  }
  inGamut(coords, {
    epsilon = ε$7
  } = {}) {
    if (!this.equals(this.gamutSpace)) {
      coords = this.to(this.gamutSpace, coords);
      return this.gamutSpace.inGamut(coords, {
        epsilon
      });
    }
    let coordMeta = Object.values(this.coords);
    return coords.every((c, i) => {
      let meta = coordMeta[i];
      if (meta.type !== "angle" && meta.range) {
        if (isNone(c)) {
          // NaN is always in gamut
          return true;
        }
        let [min, max] = meta.range;
        return (min === undefined || c >= min - epsilon) && (max === undefined || c <= max + epsilon);
      }
      return true;
    });
  }
  get isUnbounded() {
    return Object.values(this.coords).every(coord => !("range" in coord));
  }
  get cssId() {
    var _this$formats;
    return ((_this$formats = this.formats) === null || _this$formats === void 0 || (_this$formats = _this$formats.color) === null || _this$formats === void 0 ? void 0 : _this$formats.id) || this.id;
  }
  get isPolar() {
    for (let id in this.coords) {
      if (this.coords[id].type === "angle") {
        return true;
      }
    }
    return false;
  }

  /**
   * Lookup a format in this color space
   * @param {string | object | Format} format - Format id if string. If object, it's converted to a `Format` object and returned.
   * @returns {Format}
   */
  getFormat(format) {
    if (!format) {
      return null;
    }
    if (format === "default") {
      format = Object.values(this.formats)[0];
    } else if (typeof format === "string") {
      format = this.formats[format];
    }
    let ret = Format.get(format, this);
    if (ret !== format && format.name in this.formats) {
      // Update the format we have on file so we can find it more quickly next time
      this.formats[format.name] = ret;
    }
    return ret;
  }

  /**
   * Check if this color space is the same as another color space reference.
   * Allows proxying color space objects and comparing color spaces with ids.
   * @param {string | ColorSpace} space ColorSpace object or id to compare to
   * @returns {boolean}
   */
  equals(space) {
    if (!space) {
      return false;
    }
    return this === space || this.id === space || this.id === space.id;
  }
  to(space, coords) {
    if (arguments.length === 1) {
      const color = getColor(space);
      [space, coords] = [color.space, color.coords];
    }
    space = ColorSpace.get(space);
    if (this.equals(space)) {
      // Same space, no change needed
      return coords;
    }

    // Convert NaN to 0, which seems to be valid in every coordinate of every color space
    coords = coords.map(c => isNone(c) ? 0 : c);

    // Find connection space = lowest common ancestor in the base tree
    let myPath = this.path;
    let otherPath = space.path;
    let connectionSpace, connectionSpaceIndex;
    for (let i = 0; i < myPath.length; i++) {
      if (myPath[i].equals(otherPath[i])) {
        connectionSpace = myPath[i];
        connectionSpaceIndex = i;
      } else {
        break;
      }
    }
    if (!connectionSpace) {
      // This should never happen
      throw new Error(`Cannot convert between color spaces ${this} and ${space}: no connection space was found`);
    }

    // Go up from current space to connection space
    for (let i = myPath.length - 1; i > connectionSpaceIndex; i--) {
      coords = myPath[i].toBase(coords);
    }

    // Go down from connection space to target space
    for (let i = connectionSpaceIndex + 1; i < otherPath.length; i++) {
      coords = otherPath[i].fromBase(coords);
    }
    return coords;
  }
  from(space, coords) {
    if (arguments.length === 1) {
      const color = getColor(space);
      [space, coords] = [color.space, color.coords];
    }
    space = ColorSpace.get(space);
    return space.to(this, coords);
  }
  toString() {
    return `${this.name} (${this.id})`;
  }
  getMinCoords() {
    let ret = [];
    for (let id in this.coords) {
      var _range$min;
      let meta = this.coords[id];
      let range = meta.range || meta.refRange;
      ret.push((_range$min = range === null || range === void 0 ? void 0 : range.min) !== null && _range$min !== void 0 ? _range$min : 0);
    }
    return ret;
  }
  static registry = {};

  // Returns array of unique color spaces
  static get all() {
    return [...new Set(Object.values(ColorSpace.registry))];
  }
  static register(id, space) {
    if (arguments.length === 1) {
      space = arguments[0];
      id = space.id;
    }
    space = this.get(space);
    if (this.registry[id] && this.registry[id] !== space) {
      throw new Error(`Duplicate color space registration: '${id}'`);
    }
    this.registry[id] = space;

    // Register aliases when called without an explicit ID.
    if (arguments.length === 1 && space.aliases) {
      for (let alias of space.aliases) {
        this.register(alias, space);
      }
    }
    return space;
  }

  /**
   * Lookup ColorSpace object by name
   * @param {ColorSpace | string} name
   */
  static get(space, ...alternatives) {
    if (!space || isInstance(space, this)) {
      return space;
    }
    let argType = type(space);
    if (argType === "string") {
      // It's a color space id
      let ret = ColorSpace.registry[space.toLowerCase()];
      if (!ret) {
        throw new TypeError(`No color space found with id = "${space}"`);
      }
      return ret;
    }
    if (alternatives.length) {
      return ColorSpace.get(...alternatives);
    }
    throw new TypeError(`${space} is not a valid color space`);
  }

  /**
   * Look up all color spaces for a format that matches certain criteria
   * @param {object | string} filters
   * @param {Array<ColorSpace>} [spaces=ColorSpace.all]
   * @returns {Format | null}
   */
  static findFormat(filters, spaces = ColorSpace.all) {
    if (!filters) {
      return null;
    }
    if (typeof filters === "string") {
      filters = {
        name: filters
      };
    }
    for (let space of spaces) {
      for (let [name, format] of Object.entries(space.formats)) {
        var _format$name, _format$type;
        (_format$name = format.name) !== null && _format$name !== void 0 ? _format$name : format.name = name;
        (_format$type = format.type) !== null && _format$type !== void 0 ? _format$type : format.type = "function";
        let matches = (!filters.name || format.name === filters.name) && (!filters.type || format.type === filters.type);
        if (filters.id) {
          let ids = format.ids || [format.id];
          let filterIds = Array.isArray(filters.id) ? filters.id : [filters.id];
          matches && (matches = filterIds.some(id => ids.includes(id)));
        }
        if (matches) {
          let ret = Format.get(format, space);
          if (ret !== format) {
            space.formats[format.name] = ret;
          }
          return ret;
        }
      }
    }
    return null;
  }

  /**
   * Get metadata about a coordinate of a color space
   *
   * @static
   * @param {Array | string} ref
   * @param {ColorSpace | string} [workingSpace]
   * @return {Object}
   */
  static resolveCoord(ref, workingSpace) {
    let coordType = type(ref);
    let space, coord;
    if (coordType === "string") {
      if (ref.includes(".")) {
        // Absolute coordinate
        [space, coord] = ref.split(".");
      } else {
        // Relative coordinate
        [space, coord] = [, ref];
      }
    } else if (Array.isArray(ref)) {
      [space, coord] = ref;
    } else {
      // Object
      space = ref.space;
      coord = ref.coordId;
    }
    space = ColorSpace.get(space);
    if (!space) {
      space = workingSpace;
    }
    if (!space) {
      throw new TypeError(`Cannot resolve coordinate reference ${ref}: No color space specified and relative references are not allowed here`);
    }
    coordType = type(coord);
    if (coordType === "number" || coordType === "string" && coord >= 0) {
      // Resolve numerical coord
      let meta = Object.entries(space.coords)[coord];
      if (meta) {
        return {
          space,
          id: meta[0],
          index: coord,
          ...meta[1]
        };
      }
    }
    space = ColorSpace.get(space);
    let normalizedCoord = coord.toLowerCase();
    let i = 0;
    for (let id in space.coords) {
      var _meta$name;
      let meta = space.coords[id];
      if (id.toLowerCase() === normalizedCoord || ((_meta$name = meta.name) === null || _meta$name === void 0 ? void 0 : _meta$name.toLowerCase()) === normalizedCoord) {
        return {
          space,
          id,
          index: i,
          ...meta
        };
      }
      i++;
    }
    throw new TypeError(`No "${coord}" coordinate found in ${space.name}. Its coordinates are: ${Object.keys(space.coords).join(", ")}`);
  }
  static DEFAULT_FORMAT = {
    type: "functions",
    name: "color"
  };
}
function getPath(space) {
  let ret = [space];
  for (let s = space; s = s.base;) {
    ret.push(s);
  }
  return ret;
}

var XYZ_D65 = new ColorSpace({
  id: "xyz-d65",
  name: "XYZ D65",
  coords: {
    x: {
      refRange: [0, 1],
      name: "X"
    },
    y: {
      refRange: [0, 1],
      name: "Y"
    },
    z: {
      refRange: [0, 1],
      name: "Z"
    }
  },
  white: "D65",
  formats: {
    color: {
      ids: ["xyz-d65", "xyz"]
    }
  },
  aliases: ["xyz"]
});

// Type re-exports
/** @typedef {import("./types.js").RGBOptions} RGBOptions */

/** Convenience class for RGB color spaces */
class RGBColorSpace extends ColorSpace {
  /**
   * Creates a new RGB ColorSpace.
   * If coords are not specified, they will use the default RGB coords.
   * Instead of `fromBase()` and `toBase()` functions,
   * you can specify to/from XYZ matrices and have `toBase()` and `fromBase()` automatically generated.
   * @param {RGBOptions} options
   */
  constructor(options) {
    var _options$referred;
    if (!options.coords) {
      options.coords = {
        r: {
          range: [0, 1],
          name: "Red"
        },
        g: {
          range: [0, 1],
          name: "Green"
        },
        b: {
          range: [0, 1],
          name: "Blue"
        }
      };
    }
    if (!options.base) {
      options.base = XYZ_D65;
    }
    if (options.toXYZ_M && options.fromXYZ_M) {
      var _options$toBase, _options$fromBase;
      (_options$toBase = options.toBase) !== null && _options$toBase !== void 0 ? _options$toBase : options.toBase = rgb => {
        let xyz = multiply_v3_m3x3(rgb, options.toXYZ_M);
        if (this.white !== this.base.white) {
          // Perform chromatic adaptation
          xyz = adapt$2(this.white, this.base.white, xyz);
        }
        return xyz;
      };
      (_options$fromBase = options.fromBase) !== null && _options$fromBase !== void 0 ? _options$fromBase : options.fromBase = xyz => {
        xyz = adapt$2(this.base.white, this.white, xyz);
        return multiply_v3_m3x3(xyz, options.fromXYZ_M);
      };
    }
    (_options$referred = options.referred) !== null && _options$referred !== void 0 ? _options$referred : options.referred = "display";
    super(options);
  }
}

/** @import { ColorTypes, PlainColorObject } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").TryColorOptions} TryColorOptions */

/**
 * Resolves a color reference (object or string) to a plain color object, or `null` if resolution fails.
 * Can resolve more complex CSS colors (e.g. relative colors, `calc()`, CSS variables, `color-mix()`, etc.) through the DOM.
 *
 * @overload
 * @param {ColorTypes} color
 * @param {TryColorOptions} [options]
 * @returns {PlainColorObject | null}
 */
/**
 * @overload
 * @param {ColorTypes[]} color
 * @param {TryColorOptions} [options]
 * @returns {(PlainColorObject | null)[]}
 */
function tryColor(color, options = {}) {
  if (Array.isArray(color)) {
    return color.map(c => tryColor(c, options));
  }
  let {
    cssProperty = "background-color",
    element,
    ...getColorOptions
  } = options;
  let error = null;
  try {
    return getColor(color, getColorOptions);
  } catch (e) {
    error = e;
  }
  let {
    CSS,
    getComputedStyle
  } = globalThis;
  if (isString(color) && element && CSS && getComputedStyle) {
    // Try resolving the color using the DOM, if supported in CSS
    if (CSS.supports(cssProperty, color)) {
      let previousValue = element.style[cssProperty];
      if (color !== previousValue) {
        element.style[cssProperty] = color;
      }
      let computedColor = getComputedStyle(element).getPropertyValue(cssProperty);
      if (color !== previousValue) {
        element.style[cssProperty] = previousValue;
      }
      if (computedColor !== color) {
        // getComputedStyle() changed the color, try again
        try {
          return getColor(computedColor, getColorOptions);
        } catch (e) {
          error = e;
        }
      } else {
        // Still not resolved
        error = {
          message: "Color value is a valid CSS color, but it could not be resolved :("
        };
      }
    }
  }

  // If we're here, we failed to resolve the color
  if (options.errorMeta) {
    options.errorMeta.error = error;
  }
  return null;
}

/** @import { ColorTypes, Coords } from "./types.js" */

/**
 * Options for {@link getAll}
 * @typedef GetAllOptions
 * @property {string | ColorSpace | undefined} [space]
 * The color space to convert to. Defaults to the color's current space
 * @property {number | undefined} [precision]
 * The number of significant digits to round the coordinates to
 */

/**
 * Get the coordinates of a color in any color space
 * @overload
 * @param {ColorTypes} color
 * @param {string | ColorSpace} [options=color.space] The color space to convert to. Defaults to the color's current space
 * @returns {Coords} The color coordinates in the given color space
 */
/**
 * @overload
 * @param {ColorTypes} color
 * @param {GetAllOptions} [options]
 * @returns {Coords} The color coordinates in the given color space
 */
function getAll(color, options) {
  color = getColor(color);
  let space = ColorSpace.get(options, options === null || options === void 0 ? void 0 : options.space);
  let precision = options === null || options === void 0 ? void 0 : options.precision;
  let coords;
  if (!space || color.space.equals(space)) {
    // No conversion needed
    coords = color.coords.slice();
  } else {
    coords = space.from(color);
  }
  return precision === undefined ? coords : coords.map(coord => toPrecision(coord, precision));
}

/** @import { ColorTypes, Ref } from "./types.js" */

/**
 * @param {ColorTypes} color
 * @param {Ref} prop
 * @returns {number}
 */
function get(color, prop) {
  color = getColor(color);
  if (prop === "alpha") {
    var _color$alpha;
    return (_color$alpha = color.alpha) !== null && _color$alpha !== void 0 ? _color$alpha : 1;
  }
  let {
    space,
    index
  } = ColorSpace.resolveCoord(prop, color.space);
  let coords = getAll(color, space);
  return coords[index];
}

/** @import { ColorTypes, Coords, PlainColorObject } from "./types.js" */

/**
 * Set all coordinates of a color at once, in its own color space or another.
 * Modifies the color in place.
 * @overload
 * @param {ColorTypes} color
 * @param {Coords} coords Array of coordinates
 * @param {number} [alpha]
 * @returns {PlainColorObject}
 */
/**
 * @overload
 * @param {ColorTypes} color
 * @param {string | ColorSpace} space The color space of the provided coordinates.
 * @param {Coords} coords Array of coordinates
 * @param {number} [alpha]
 * @returns {PlainColorObject}
 */
function setAll(color, space, coords, alpha) {
  color = getColor(color);
  if (Array.isArray(space)) {
    // Space is omitted
    [space, coords, alpha] = [color.space, space, coords];
  }
  space = ColorSpace.get(space); // Make sure we have a ColorSpace object
  color.coords = space === color.space ? coords.slice() : space.to(color.space, coords);
  if (alpha !== undefined) {
    color.alpha = alpha;
  }
  return color;
}

/** @type {"color"} */
setAll.returns = "color";

/** @import { ColorTypes, PlainColorObject, Ref } from "./types.js" */

/**
 * Set properties and return current instance
 * @overload
 * @param {ColorTypes} color
 * @param {Ref} prop
 * @param {number | ((coord: number) => number)} value
 * @returns {PlainColorObject}
 */
/**
 * @overload
 * @param {ColorTypes} color
 * @param {Record<string, number | ((coord: number) => number)>} props
 * @returns {PlainColorObject}
 */
function set(color, prop, value) {
  color = getColor(color);
  if (arguments.length === 2 && type(arguments[1]) === "object") {
    // Argument is an object literal
    let object = arguments[1];
    for (let p in object) {
      set(color, p, object[p]);
    }
  } else {
    if (typeof value === "function") {
      value = value(get(color, prop));
    }
    if (prop === "alpha") {
      color.alpha = value;
    } else {
      let {
        space,
        index
      } = ColorSpace.resolveCoord(prop, color.space);
      let coords = getAll(color, space);
      coords[index] = value;
      setAll(color, space, coords);
    }
  }
  return color;
}

/** @type {"color"} */
set.returns = "color";

var XYZ_D50 = new ColorSpace({
  id: "xyz-d50",
  name: "XYZ D50",
  white: "D50",
  base: XYZ_D65,
  fromBase: coords => adapt$2(XYZ_D65.white, "D50", coords),
  toBase: coords => adapt$2("D50", XYZ_D65.white, coords)
});

// κ * ε  = 2^3 = 8
const ε$6 = 216 / 24389; // 6^3/29^3 == (24/116)^3
const ε3$1 = 24 / 116;
const κ$4 = 24389 / 27; // 29^3/3^3

let white$4 = WHITES.D50;
var lab = new ColorSpace({
  id: "lab",
  name: "Lab",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    a: {
      refRange: [-125, 125]
    },
    b: {
      refRange: [-125, 125]
    }
  },
  // Assuming XYZ is relative to D50, convert to CIE Lab
  // from CIE standard, which now defines these as a rational fraction
  white: white$4,
  base: XYZ_D50,
  // Convert D50-adapted XYX to Lab
  // CIE 15.3:2004 section 8.2.1.1
  fromBase(XYZ) {
    // XYZ scaled relative to reference white
    let xyz = XYZ.map((value, i) => value / white$4[i]);
    let f = xyz.map(value => value > ε$6 ? Math.cbrt(value) : (κ$4 * value + 16) / 116);
    let L = 116 * f[1] - 16;
    let a = 500 * (f[0] - f[1]);
    let b = 200 * (f[1] - f[2]);
    return [L, a, b];
  },
  // Convert Lab to D50-adapted XYZ
  // Same result as CIE 15.3:2004 Appendix D although the derivation is different
  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
  toBase(Lab) {
    // compute f, starting with the luminance-related term
    let [L, a, b] = Lab;
    let f = [];
    f[1] = (L + 16) / 116;
    f[0] = a / 500 + f[1];
    f[2] = f[1] - b / 200;

    // compute xyz
    // prettier-ignore
    let xyz = [f[0] > ε3$1 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ$4, Lab[0] > 8 ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / κ$4, f[2] > ε3$1 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ$4];

    // Compute XYZ by scaling xyz by reference white
    return xyz.map((value, i) => value * white$4[i]);
  },
  formats: {
    lab: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <percentage>"]
    }
  }
});

/**
 * Constrain an angle to 360 degrees
 * @param {number} angle
 * @returns {number}
 */
function constrain(angle) {
  if (typeof angle !== "number") {
    return angle;
  }
  return (angle % 360 + 360) % 360;
}

/**
 * @param {"raw" | "increasing" | "decreasing" | "longer" | "shorter"} arc
 * @param {[number, number]} angles
 * @returns {[number, number]}
 */
function adjust(arc, angles) {
  let [a1, a2] = angles;
  let none1 = isNone(a1);
  let none2 = isNone(a2);
  if (none1 && none2) {
    return [a1, a2];
  } else if (none1) {
    a1 = a2;
  } else if (none2) {
    a2 = a1;
  }
  if (arc === "raw") {
    return angles;
  }
  a1 = constrain(a1);
  a2 = constrain(a2);
  let angleDiff = a2 - a1;
  if (arc === "increasing") {
    if (angleDiff < 0) {
      a2 += 360;
    }
  } else if (arc === "decreasing") {
    if (angleDiff > 0) {
      a1 += 360;
    }
  } else if (arc === "longer") {
    if (-180 < angleDiff && angleDiff < 180) {
      if (angleDiff > 0) {
        a1 += 360;
      } else {
        a2 += 360;
      }
    }
  } else if (arc === "shorter") {
    if (angleDiff > 180) {
      a1 += 360;
    } else if (angleDiff < -180) {
      a2 += 360;
    }
  }
  return [a1, a2];
}

var lch = new ColorSpace({
  id: "lch",
  name: "LCH",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    c: {
      refRange: [0, 150],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: lab,
  fromBase(Lab) {
    // These methods are used for other polar forms as well, so we can't hardcode the ε
    if (this.ε === undefined) {
      // @ts-expect-error Property 'coords' does not exist on type 'string | ColorSpace'
      let range = Object.values(this.base.coords)[1].refRange;
      let extent = range[1] - range[0];
      this.ε = extent / 100000;
    }

    // Convert to polar form
    let [L, a, b] = Lab;
    let isAchromatic = Math.abs(a) < this.ε && Math.abs(b) < this.ε;
    let h = isAchromatic ? null : constrain(Math.atan2(b, a) * 180 / Math.PI);
    let C = isAchromatic ? 0 : Math.sqrt(a ** 2 + b ** 2);
    return [L, C, h];
  },
  toBase(lch) {
    // Convert from polar form
    let [L, C, h] = lch;
    let a = null,
      b = null;
    if (!isNone(h)) {
      C = C < 0 ? 0 : C; // Clamp negative Chroma
      a = C * Math.cos(h * Math.PI / 180);
      b = C * Math.sin(h * Math.PI / 180);
    }
    return [L, a, b];
  },
  formats: {
    lch: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});

// deltaE2000 is a statistically significant improvement
// and is recommended by the CIE and Idealliance
// especially for color differences less than 10 deltaE76
// but is wicked complicated
// and many implementations have small errors!
// DeltaE2000 is also discontinuous; in case this
// matters to you, use deltaECMC instead.

const Gfactor = 25 ** 7;
const π$1 = Math.PI;
const r2d = 180 / π$1;
const d2r$1 = π$1 / 180;
function pow7(x) {
  // Faster than x ** 7 or Math.pow(x, 7)

  const x2 = x * x;
  const x7 = x2 * x2 * x2 * x;
  return x7;
}

/**
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @param {{ kL?: number | undefined; kC?: number | undefined; kH?: number | undefined }} options
 * @returns {number}
 */
function deltaE2000 (color, sample, {
  kL = 1,
  kC = 1,
  kH = 1
} = {}) {
  [color, sample] = getColor([color, sample]);

  // Given this color as the reference
  // and the function parameter as the sample,
  // calculate deltaE 2000.

  // This implementation assumes the parametric
  // weighting factors kL, kC and kH
  // for the influence of viewing conditions
  // are all 1, as sadly seems typical.
  // kL should be increased for lightness texture or noise
  // and kC increased for chroma noise

  let [L1, a1, b1] = lab.from(color);
  let C1 = lch.from(lab, [L1, a1, b1])[1];
  let [L2, a2, b2] = lab.from(sample);
  let C2 = lch.from(lab, [L2, a2, b2])[1];

  // Check for negative Chroma,
  // which might happen through
  // direct user input of LCH values

  if (C1 < 0) {
    C1 = 0;
  }
  if (C2 < 0) {
    C2 = 0;
  }
  let Cbar = (C1 + C2) / 2; // mean Chroma

  // calculate a-axis asymmetry factor from mean Chroma
  // this turns JND ellipses for near-neutral colors back into circles
  let C7 = pow7(Cbar);
  let G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Gfactor)));

  // scale a axes by asymmetry factor
  // this by the way is why there is no Lab2000 colorspace
  let adash1 = (1 + G) * a1;
  let adash2 = (1 + G) * a2;

  // calculate new Chroma from scaled a and original b axes
  let Cdash1 = Math.sqrt(adash1 ** 2 + b1 ** 2);
  let Cdash2 = Math.sqrt(adash2 ** 2 + b2 ** 2);

  // calculate new hues, with zero hue for true neutrals
  // and in degrees, not radians

  let h1 = adash1 === 0 && b1 === 0 ? 0 : Math.atan2(b1, adash1);
  let h2 = adash2 === 0 && b2 === 0 ? 0 : Math.atan2(b2, adash2);
  if (h1 < 0) {
    h1 += 2 * π$1;
  }
  if (h2 < 0) {
    h2 += 2 * π$1;
  }
  h1 *= r2d;
  h2 *= r2d;

  // Lightness and Chroma differences; sign matters
  let ΔL = L2 - L1;
  let ΔC = Cdash2 - Cdash1;

  // Hue difference, getting the sign correct
  let hdiff = h2 - h1;
  let hsum = h1 + h2;
  let habs = Math.abs(hdiff);
  let Δh;
  if (Cdash1 * Cdash2 === 0) {
    Δh = 0;
  } else if (habs <= 180) {
    Δh = hdiff;
  } else if (hdiff > 180) {
    Δh = hdiff - 360;
  } else if (hdiff < -180) {
    Δh = hdiff + 360;
  } else {
    defaults.warn("the unthinkable has happened");
  }

  // weighted Hue difference, more for larger Chroma
  let ΔH = 2 * Math.sqrt(Cdash2 * Cdash1) * Math.sin(Δh * d2r$1 / 2);

  // calculate mean Lightness and Chroma
  let Ldash = (L1 + L2) / 2;
  let Cdash = (Cdash1 + Cdash2) / 2;
  let Cdash7 = pow7(Cdash);

  // Compensate for non-linearity in the blue region of Lab.
  // Four possibilities for hue weighting factor,
  // depending on the angles, to get the correct sign
  let hdash;
  if (Cdash1 * Cdash2 === 0) {
    hdash = hsum; // which should be zero
  } else if (habs <= 180) {
    hdash = hsum / 2;
  } else if (hsum < 360) {
    hdash = (hsum + 360) / 2;
  } else {
    hdash = (hsum - 360) / 2;
  }

  // positional corrections to the lack of uniformity of CIELAB
  // These are all trying to make JND ellipsoids more like spheres

  // SL Lightness crispening factor
  // a background with L=50 is assumed
  let lsq = (Ldash - 50) ** 2;
  let SL = 1 + 0.015 * lsq / Math.sqrt(20 + lsq);

  // SC Chroma factor, similar to those in CMC and deltaE 94 formulae
  let SC = 1 + 0.045 * Cdash;

  // Cross term T for blue non-linearity
  let T = 1;
  T -= 0.17 * Math.cos((hdash - 30) * d2r$1);
  T += 0.24 * Math.cos(2 * hdash * d2r$1);
  T += 0.32 * Math.cos((3 * hdash + 6) * d2r$1);
  T -= 0.2 * Math.cos((4 * hdash - 63) * d2r$1);

  // SH Hue factor depends on Chroma,
  // as well as adjusted hue angle like deltaE94.
  let SH = 1 + 0.015 * Cdash * T;

  // RT Hue rotation term compensates for rotation of JND ellipses
  // and Munsell constant hue lines
  // in the medium-high Chroma blue region
  // (Hue 225 to 315)
  let Δθ = 30 * Math.exp(-1 * ((hdash - 275) / 25) ** 2);
  let RC = 2 * Math.sqrt(Cdash7 / (Cdash7 + Gfactor));
  let RT = -1 * Math.sin(2 * Δθ * d2r$1) * RC;

  // Finally calculate the deltaE, term by term as root sume of squares
  let dE = (ΔL / (kL * SL)) ** 2;
  dE += (ΔC / (kC * SC)) ** 2;
  dE += (ΔH / (kH * SH)) ** 2;
  dE += RT * (ΔC / (kC * SC)) * (ΔH / (kH * SH));
  return Math.sqrt(dE);
  // Yay!!!
}

/** @import { Matrix3x3 } from "../types.js" */

// Recalculated for consistent reference white
// see https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-943521484
/** @type {Matrix3x3} */
// prettier-ignore
const XYZtoLMS_M$1 = [[0.8190224379967030, 0.3619062600528904, -0.1288737815209879], [0.0329836539323885, 0.9292868615863434, 0.0361446663506424], [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]];
// inverse of XYZtoLMS_M
/** @type {Matrix3x3} */
// prettier-ignore
const LMStoXYZ_M$1 = [[1.2268798758459243, -0.5578149944602171, 0.2813910456659647], [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164], [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]];
/** @type {Matrix3x3} */
// prettier-ignore
const LMStoLab_M = [[0.2104542683093140, 0.7936177747023054, -0.0040720430116193], [1.9779985324311684, -2.4285922420485799, 0.4505937096174110], [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]];
// LMStoIab_M inverted
/** @type {Matrix3x3} */
// prettier-ignore
const LabtoLMS_M = [[1.0000000000000000, 0.3963377773761749, 0.2158037573099136], [1.0000000000000000, -0.1055613458156586, -0.0638541728258133], [1.0000000000000000, -0.0894841775298119, -1.2914855480194092]];
var Oklab = new ColorSpace({
  id: "oklab",
  name: "Oklab",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    a: {
      refRange: [-0.4, 0.4]
    },
    b: {
      refRange: [-0.4, 0.4]
    }
  },
  // Note that XYZ is relative to D65
  white: "D65",
  base: XYZ_D65,
  fromBase(XYZ) {
    // move to LMS cone domain
    let LMS = multiply_v3_m3x3(XYZ, XYZtoLMS_M$1);

    // non-linearity
    LMS[0] = Math.cbrt(LMS[0]);
    LMS[1] = Math.cbrt(LMS[1]);
    LMS[2] = Math.cbrt(LMS[2]);
    return multiply_v3_m3x3(LMS, LMStoLab_M, LMS);
  },
  toBase(OKLab) {
    // move to LMS cone domain
    let LMSg = multiply_v3_m3x3(OKLab, LabtoLMS_M);

    // restore linearity
    LMSg[0] = LMSg[0] ** 3;
    LMSg[1] = LMSg[1] ** 3;
    LMSg[2] = LMSg[2] ** 3;
    return multiply_v3_m3x3(LMSg, LMStoXYZ_M$1, LMSg);
  },
  formats: {
    oklab: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <percentage>"]
    }
  }
});

/**
 * More accurate color-difference formulae
 * than the simple 1976 Euclidean distance in CIE Lab
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaEOK (color, sample) {
  [color, sample] = getColor([color, sample]);

  // Given this color as the reference
  // and a sample,
  // calculate deltaEOK, term by term as root sum of squares
  let [L1, a1, b1] = Oklab.from(color);
  let [L2, a2, b2] = Oklab.from(sample);
  let ΔL = L1 - L2;
  let Δa = a1 - a2;
  let Δb = b1 - b2;
  return Math.sqrt(ΔL ** 2 + Δa ** 2 + Δb ** 2);
}

/** @import { ColorTypes } from "./types.js" */

const ε$5 = 0.000075;

/**
 * Check if a color is in gamut of either its own or another color space
 * @param {ColorTypes} color
 * @param {string | ColorSpace} [space]
 * @param {{ epsilon?: number | undefined }} [param2]
 * @returns {boolean}
 */
function inGamut(color, space, {
  epsilon = ε$5
} = {}) {
  color = getColor(color);
  if (!space) {
    space = color.space;
  }
  space = ColorSpace.get(space);
  let coords = color.coords;
  if (space !== color.space) {
    coords = space.from(color);
  }
  return space.inGamut(coords, {
    epsilon
  });
}

var OKLCH = new ColorSpace({
  id: "oklch",
  name: "OkLCh",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    c: {
      refRange: [0, 0.4],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  white: "D65",
  base: Oklab,
  fromBase: lch.fromBase,
  toBase: lch.toBase,
  formats: {
    oklch: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});

/** @import { Coords, PlainColorObject } from "./types.js" */

/**
 * @param {PlainColorObject} color
 * @returns {PlainColorObject}
 */
function clone(color) {
  return {
    space: color.space,
    coords: (/** @type {Coords} */color.coords.slice()),
    alpha: color.alpha
  };
}

var esnext_iterator_reduce = {};

var es_iterator_reduce = {};

var hasRequiredEs_iterator_reduce;

function requireEs_iterator_reduce () {
	if (hasRequiredEs_iterator_reduce) return es_iterator_reduce;
	hasRequiredEs_iterator_reduce = 1;
	var $ = require_export();
	var iterate = requireIterate();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();

	var $TypeError = TypeError;

	// `Iterator.prototype.reduce` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.reduce
	$({ target: 'Iterator', proto: true, real: true }, {
	  reduce: function reduce(reducer /* , initialValue */) {
	    anObject(this);
	    aCallable(reducer);
	    var record = getIteratorDirect(this);
	    var noInitial = arguments.length < 2;
	    var accumulator = noInitial ? undefined : arguments[1];
	    var counter = 0;
	    iterate(record, function (value) {
	      if (noInitial) {
	        noInitial = false;
	        accumulator = value;
	      } else {
	        accumulator = reducer(accumulator, value, counter);
	      }
	      counter++;
	    }, { IS_RECORD: true });
	    if (noInitial) throw new $TypeError('Reduce of empty iterator with no initial value');
	    return accumulator;
	  }
	});
	return es_iterator_reduce;
}

var hasRequiredEsnext_iterator_reduce;

function requireEsnext_iterator_reduce () {
	if (hasRequiredEsnext_iterator_reduce) return esnext_iterator_reduce;
	hasRequiredEsnext_iterator_reduce = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_reduce();
	return esnext_iterator_reduce;
}

requireEsnext_iterator_reduce();

/** @import { ColorTypes } from "./types.js" */

/**
 * Euclidean distance of colors in an arbitrary color space
 * @param {ColorTypes} color1
 * @param {ColorTypes} color2
 * @param {string | ColorSpace} space
 * @returns {number}
 */
function distance(color1, color2, space = "lab") {
  space = ColorSpace.get(space);

  // Assume getColor() is called on color in space.from()
  let coords1 = space.from(color1);
  let coords2 = space.from(color2);
  return Math.sqrt(coords1.reduce((acc, c1, i) => {
    let c2 = coords2[i];
    if (isNone(c1) || isNone(c2)) {
      return acc;
    }
    return acc + (c2 - c1) ** 2;
  }, 0));
}

/**
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaE76(color, sample) {
  // Assume getColor() is called in the distance function
  return distance(color, sample, "lab");
}

// More accurate color-difference formulae
// than the simple 1976 Euclidean distance in Lab

// CMC by the Color Measurement Committee of the
// Bradford Society of Dyeists and Colorsts, 1994.
// Uses LCH rather than Lab,
// with different weights for L, C and H differences
// A nice increase in accuracy for modest increase in complexity
const π = Math.PI;
const d2r = π / 180;

/**
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @param {{ l?: number | undefined; c?: number | undefined }} options
 * @returns {number}
 */
function deltaECMC (color, sample, {
  l = 2,
  c = 1
} = {}) {
  [color, sample] = getColor([color, sample]);

  // Given this color as the reference
  // and a sample,
  // calculate deltaE CMC.

  // This implementation assumes the parametric
  // weighting factors l:c are 2:1
  // which is typical for non-textile uses.

  let [L1, a1, b1] = lab.from(color);
  let [, C1, H1] = lch.from(lab, [L1, a1, b1]);
  let [L2, a2, b2] = lab.from(sample);
  let C2 = lch.from(lab, [L2, a2, b2])[1];

  // let [L1, a1, b1] = color.getAll(lab);
  // let C1 = color.get("lch.c");
  // let H1 = color.get("lch.h");
  // let [L2, a2, b2] = sample.getAll(lab);
  // let C2 = sample.get("lch.c");

  // Check for negative Chroma,
  // which might happen through
  // direct user input of LCH values

  if (C1 < 0) {
    C1 = 0;
  }
  if (C2 < 0) {
    C2 = 0;
  }

  // we don't need H2 as ΔH is calculated from Δa, Δb and ΔC

  // Lightness and Chroma differences
  // These are (color - sample), unlike deltaE2000
  let ΔL = L1 - L2;
  let ΔC = C1 - C2;
  let Δa = a1 - a2;
  let Δb = b1 - b2;

  // weighted Hue difference, less for larger Chroma difference

  let H2 = Δa ** 2 + Δb ** 2 - ΔC ** 2;
  // due to roundoff error it is possible that, for zero a and b,
  // ΔC > Δa + Δb is 0, resulting in attempting
  // to take the square root of a negative number

  // trying instead the equation from Industrial Color Physics
  // By Georg A. Klein

  // let ΔH = ((a1 * b2) - (a2 * b1)) / Math.sqrt(0.5 * ((C2 * C1) + (a2 * a1) + (b2 * b1)));
  // console.log({ΔH});
  // This gives the same result to 12 decimal places
  // except it sometimes NaNs when trying to root a negative number

  // let ΔH = Math.sqrt(H2); we never actually use the root, it gets squared again!!

  // positional corrections to the lack of uniformity of CIELAB
  // These are all trying to make JND ellipsoids more like spheres

  // SL Lightness crispening factor, depends entirely on L1 not L2
  let SL = 0.511; // linear portion of the Y to L transfer function
  if (L1 >= 16) {
    // cubic portion
    SL = 0.040975 * L1 / (1 + 0.01765 * L1);
  }

  // SC Chroma factor
  let SC = 0.0638 * C1 / (1 + 0.0131 * C1) + 0.638;

  // Cross term T for blue non-linearity
  let T;
  if (isNone(H1)) {
    H1 = 0;
  }
  if (H1 >= 164 && H1 <= 345) {
    T = 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * d2r));
  } else {
    T = 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * d2r));
  }
  // console.log({T});

  // SH Hue factor also depends on C1,
  let C4 = Math.pow(C1, 4);
  let F = Math.sqrt(C4 / (C4 + 1900));
  let SH = SC * (F * T + 1 - F);

  // Finally calculate the deltaE, term by term as root sume of squares
  let dE = (ΔL / (l * SL)) ** 2;
  dE += (ΔC / (c * SC)) ** 2;
  dE += H2 / SH ** 2;
  // dE += (ΔH / SH)  ** 2;
  return Math.sqrt(dE);
  // Yay!!!
}

const Yw$1 = 203; // absolute luminance of media white

var XYZ_Abs_D65 = new ColorSpace({
  // Absolute CIE XYZ, with a D65 whitepoint,
  // as used in most HDR colorspaces as a starting point.
  // SDR spaces are converted per BT.2048
  // so that diffuse, media white is 203 cd/m²
  id: "xyz-abs-d65",
  cssId: "--xyz-abs-d65",
  name: "Absolute XYZ D65",
  coords: {
    x: {
      refRange: [0, 9504.7],
      name: "Xa"
    },
    y: {
      refRange: [0, 10000],
      name: "Ya"
    },
    z: {
      refRange: [0, 10888.3],
      name: "Za"
    }
  },
  base: XYZ_D65,
  fromBase(XYZ) {
    // Make XYZ absolute, not relative to media white
    // Maximum luminance in PQ is 10,000 cd/m²
    // Relative XYZ has Y=1 for media white
    return XYZ.map(v => v * Yw$1);
  },
  toBase(AbsXYZ) {
    // Convert to media-white relative XYZ
    return AbsXYZ.map(v => v / Yw$1);
  }
});

/** @import { Matrix3x3, Vector3 } from "../types.js" */

const b$1 = 1.15;
const g = 0.66;
const n$1 = 2610 / 2 ** 14;
const ninv$1 = 2 ** 14 / 2610;
const c1$2 = 3424 / 2 ** 12;
const c2$2 = 2413 / 2 ** 7;
const c3$2 = 2392 / 2 ** 7;
const p$1 = 1.7 * 2523 / 2 ** 5;
const pinv = 2 ** 5 / (1.7 * 2523);
const d = -0.56;
const d0 = 1.6295499532821566e-11;

/** @type {Matrix3x3} */
// prettier-ignore
const XYZtoCone_M = [[0.41478972, 0.579999, 0.0146480], [-0.2015100, 1.120649, 0.0531008], [-0.0166008, 0.264800, 0.6684799]];
// XYZtoCone_M inverted
/** @type {Matrix3x3} */
// prettier-ignore
const ConetoXYZ_M = [[1.9242264357876067, -1.0047923125953657, 0.037651404030618], [0.35031676209499907, 0.7264811939316552, -0.06538442294808501], [-0.09098281098284752, -0.3127282905230739, 1.5227665613052603]];
/** @type {Matrix3x3} */
// prettier-ignore
const ConetoIab_M = [[0.5, 0.5, 0], [3.524000, -4.066708, 0.542708], [0.199076, 1.096799, -1.295875]];
// ConetoIab_M inverted
/** @type {Matrix3x3} */
// prettier-ignore
const IabtoCone_M = [[1, 0.13860504327153927, 0.05804731615611883], [1, -0.1386050432715393, -0.058047316156118904], [1, -0.09601924202631895, -0.81189189605603900]];
var Jzazbz = new ColorSpace({
  id: "jzazbz",
  name: "Jzazbz",
  coords: {
    jz: {
      refRange: [0, 1],
      name: "Jz"
    },
    az: {
      refRange: [-0.21, 0.21]
    },
    bz: {
      refRange: [-0.21, 0.21]
    }
  },
  base: XYZ_Abs_D65,
  fromBase(XYZ) {
    // First make XYZ absolute, not relative to media white
    // Maximum luminance in PQ is 10,000 cd/m²
    // Relative XYZ has Y=1 for media white
    // BT.2048 says media white Y=203 at PQ 58

    let [Xa, Ya, Za] = XYZ;

    // modify X and Y to minimize blue curvature
    let Xm = b$1 * Xa - (b$1 - 1) * Za;
    let Ym = g * Ya - (g - 1) * Xa;

    // move to LMS cone domain
    let LMS = multiply_v3_m3x3([Xm, Ym, Za], XYZtoCone_M);

    // PQ-encode LMS
    let PQLMS = /** @type {Vector3} } */
    LMS.map(function (val) {
      let num = c1$2 + c2$2 * spow(val / 10000, n$1);
      let denom = 1 + c3$2 * spow(val / 10000, n$1);
      return spow(num / denom, p$1);
    });

    // almost there, calculate Iz az bz
    let [Iz, az, bz] = multiply_v3_m3x3(PQLMS, ConetoIab_M);
    // console.log({Iz, az, bz});

    let Jz = (1 + d) * Iz / (1 + d * Iz) - d0;
    return [Jz, az, bz];
  },
  toBase(Jzazbz) {
    let [Jz, az, bz] = Jzazbz;
    let Iz = (Jz + d0) / (1 + d - d * (Jz + d0));

    // bring into LMS cone domain
    let PQLMS = multiply_v3_m3x3([Iz, az, bz], IabtoCone_M);

    // convert from PQ-coded to linear-light
    let LMS = /** @type {Vector3} } */
    PQLMS.map(function (val) {
      let num = c1$2 - spow(val, pinv);
      let denom = c3$2 * spow(val, pinv) - c2$2;
      let x = 10000 * spow(num / denom, ninv$1);
      return x; // luminance relative to diffuse white, [0, 70 or so].
    });

    // modified abs XYZ
    let [Xm, Ym, Za] = multiply_v3_m3x3(LMS, ConetoXYZ_M);

    // un-modify X and Y to get D65 XYZ, relative to media white
    let Xa = (Xm + (b$1 - 1) * Za) / b$1;
    let Ya = (Ym + (g - 1) * Xa) / g;
    return [Xa, Ya, Za];
  },
  formats: {
    // https://drafts.csswg.org/css-color-hdr/#Jzazbz
    jzazbz: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <percentage>"]
    }
  }
});

var jzczhz = new ColorSpace({
  id: "jzczhz",
  name: "JzCzHz",
  coords: {
    jz: {
      refRange: [0, 1],
      name: "Jz"
    },
    cz: {
      refRange: [0, 0.26],
      name: "Chroma"
    },
    hz: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: Jzazbz,
  fromBase: lch.fromBase,
  toBase: lch.toBase,
  formats: {
    // https://drafts.csswg.org/css-color-hdr/#JzCzhz
    jzczhz: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});

/**
 * More accurate color-difference formulae
 * than the simple 1976 Euclidean distance in Lab
 *
 * Uses JzCzHz, which has improved perceptual uniformity
 * and thus a simple Euclidean root-sum of ΔL² ΔC² ΔH²
 * gives good results.
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaEJz (color, sample) {
  [color, sample] = getColor([color, sample]);

  // Given this color as the reference
  // and a sample,
  // calculate deltaE in JzCzHz.
  let [Jz1, Cz1, Hz1] = jzczhz.from(color);
  let [Jz2, Cz2, Hz2] = jzczhz.from(sample);

  // Lightness and Chroma differences
  // sign does not matter as they are squared.
  let ΔJ = Jz1 - Jz2;
  let ΔC = Cz1 - Cz2;

  // length of chord for ΔH
  if (isNone(Hz1) && isNone(Hz2)) {
    // both undefined hues
    Hz1 = 0;
    Hz2 = 0;
  } else if (isNone(Hz1)) {
    // one undefined, set to the defined hue
    Hz1 = Hz2;
  } else if (isNone(Hz2)) {
    Hz2 = Hz1;
  }
  let Δh = Hz1 - Hz2;
  let ΔH = 2 * Math.sqrt(Cz1 * Cz2) * Math.sin(Δh / 2 * (Math.PI / 180));
  return Math.sqrt(ΔJ ** 2 + ΔC ** 2 + ΔH ** 2);
}

/** @import { Matrix3x3, Vector3 } from "../types.js" */

const c1$1 = 3424 / 4096;
const c2$1 = 2413 / 128;
const c3$1 = 2392 / 128;
const m1$1 = 2610 / 16384;
const m2 = 2523 / 32;
const im1 = 16384 / 2610;
const im2 = 32 / 2523;

// The matrix below includes the 4% crosstalk components
// and is from the Dolby "What is ICtCp" paper"
/** @type {Matrix3x3} */
// prettier-ignore
const XYZtoLMS_M = [[0.3592832590121217, 0.6976051147779502, -0.0358915932320290], [-0.1920808463704993, 1.1004767970374321, 0.0753748658519118], [0.0070797844607479, 0.0748396662186362, 0.8433265453898765]];
// linear-light Rec.2020 to LMS, again with crosstalk
// rational terms from Jan Fröhlich,
// Encoding High Dynamic Range andWide Color Gamut Imagery, p.97
// and ITU-R BT.2124-0 p.2
/*
const Rec2020toLMS_M = [
	[ 1688 / 4096,  2146 / 4096,   262 / 4096 ],
	[  683 / 4096,  2951 / 4096,   462 / 4096 ],
	[   99 / 4096,   309 / 4096,  3688 / 4096 ]
];
*/
// this includes the Ebner LMS coefficients,
// the rotation, and the scaling to [-0.5,0.5] range
// rational terms from Fröhlich p.97
// and ITU-R BT.2124-0 pp.2-3
/** @type {Matrix3x3} */
// prettier-ignore
const LMStoIPT_M = [[2048 / 4096, 2048 / 4096, 0], [6610 / 4096, -13613 / 4096, 7003 / 4096], [17933 / 4096, -17390 / 4096, -543 / 4096]];

// inverted matrices, calculated from the above
/** @type {Matrix3x3} */
// prettier-ignore
const IPTtoLMS_M = [[0.9999999999999998, 0.0086090370379328, 0.1110296250030260], [0.9999999999999998, -0.0086090370379328, -0.1110296250030259], [0.9999999999999998, 0.5600313357106791, -0.3206271749873188]];
/*
// prettier-ignore
const LMStoRec2020_M = [
	[ 3.4375568932814012112,   -2.5072112125095058195,   0.069654319228104608382],
	[-0.79142868665644156125,   1.9838372198740089874,  -0.19240853321756742626 ],
	[-0.025646662911506476363, -0.099240248643945566751, 1.1248869115554520431  ]
];
*/
/** @type {Matrix3x3} */
// prettier-ignore
const LMStoXYZ_M = [[2.0701522183894223, -1.3263473389671563, 0.2066510476294053], [0.3647385209748072, 0.6805660249472273, -0.0453045459220347], [-0.0497472075358123, -0.0492609666966131, 1.1880659249923042]];

// Only the PQ form of ICtCp is implemented here. There is also an HLG form.
// from Dolby, "WHAT IS ICTCP?"
// https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
// and
// Dolby, "Perceptual Color Volume
// Measuring the Distinguishable Colors of HDR and WCG Displays"
// https://professional.dolby.com/siteassets/pdfs/dolby-vision-measuring-perceptual-color-volume-v7.1.pdf
var ictcp = new ColorSpace({
  id: "ictcp",
  name: "ICTCP",
  // From BT.2100-2 page 7:
  // During production, signal values are expected to exceed the
  // range E′ = [0.0 : 1.0]. This provides processing headroom and avoids
  // signal degradation during cascaded processing. Such values of E′,
  // below 0.0 or exceeding 1.0, should not be clipped during production
  // and exchange.
  // Values below 0.0 should not be clipped in reference displays (even
  // though they represent “negative” light) to allow the black level of
  // the signal (LB) to be properly set using test signals known as “PLUGE”
  coords: {
    i: {
      refRange: [0, 1],
      // Constant luminance,
      name: "I"
    },
    ct: {
      refRange: [-0.5, 0.5],
      // Full BT.2020 gamut in range [-0.5, 0.5]
      name: "CT"
    },
    cp: {
      refRange: [-0.5, 0.5],
      name: "CP"
    }
  },
  base: XYZ_Abs_D65,
  fromBase(XYZ) {
    // move to LMS cone domain
    let LMS = multiply_v3_m3x3(XYZ, XYZtoLMS_M);
    return LMStoICtCp(LMS);
  },
  toBase(ICtCp) {
    let LMS = ICtCptoLMS(ICtCp);
    return multiply_v3_m3x3(LMS, LMStoXYZ_M);
  },
  formats: {
    ictcp: {
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <percentage>"]
    }
  }
});

/**
 *
 * @param {Vector3} LMS
 * @returns {Vector3}
 */
function LMStoICtCp(LMS) {
  // apply the PQ EOTF
  // we can't ever be dividing by zero because of the "1 +" in the denominator
  let PQLMS = /** @type {Vector3} */
  LMS.map(function (val) {
    let num = c1$1 + c2$1 * (val / 10000) ** m1$1;
    let denom = 1 + c3$1 * (val / 10000) ** m1$1;
    return (num / denom) ** m2;
  });

  // LMS to IPT, with rotation for Y'C'bC'r compatibility
  return multiply_v3_m3x3(PQLMS, LMStoIPT_M);
}

/**
 *
 * @param {Vector3} ICtCp
 * @returns {Vector3}
 */
function ICtCptoLMS(ICtCp) {
  let PQLMS = multiply_v3_m3x3(ICtCp, IPTtoLMS_M);

  // From BT.2124-0 Annex 2 Conversion 3
  let LMS = /** @type {Vector3} */
  PQLMS.map(function (val) {
    let num = Math.max(val ** im2 - c1$1, 0);
    let denom = c2$1 - c3$1 * val ** im2;
    return 10000 * (num / denom) ** im1;
  });
  return LMS;
}

/**
 * Delta E in ICtCp space,
 * which the ITU calls Delta E ITP, which is shorter.
 * Formulae from ITU Rec. ITU-R BT.2124-0
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaEITP (color, sample) {
  [color, sample] = getColor([color, sample]);

  // Given this color as the reference
  // and a sample,
  // calculate deltaE in ICtCp
  // which is simply the Euclidean distance

  let [I1, T1, P1] = ictcp.from(color);
  let [I2, T2, P2] = ictcp.from(sample);

  // the 0.25 factor is to undo the encoding scaling in Ct
  // the 720 is so that 1 deltaE = 1 JND
  // per  ITU-R BT.2124-0 p.3

  return 720 * Math.sqrt((I1 - I2) ** 2 + 0.25 * (T1 - T2) ** 2 + (P1 - P2) ** 2);
}

/**
 * More accurate color-difference formulae
 * than the simple 1976 Euclidean distance in CIE Lab
 * The Oklab a and b axes are scaled relative to the L axis, for better uniformity
 * Björn Ottosson said:
 * "I've recently done some tests with color distance datasets as implemented
 * in Colorio and on both the Combvd dataset and the OSA-UCS dataset a
 * scale factor of slightly more than 2 for a and b would give the best results
 * (2.016 works best for Combvd and 2.045 for the OSA-UCS dataset)."
 * @see {@link <https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-945714988>}
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaEOK2 (color, sample) {
  [color, sample] = getColor([color, sample]);

  // Given this color as the reference
  // and a sample,
  // calculate deltaEOK2, term by term as root sum of squares
  let abscale = 2;
  let [L1, a1, b1] = Oklab.from(color);
  let [L2, a2, b2] = Oklab.from(sample);
  let ΔL = L1 - L2;
  let Δa = abscale * (a1 - a2);
  let Δb = abscale * (b1 - b2);
  return Math.sqrt(ΔL ** 2 + Δa ** 2 + Δb ** 2);
}

/** @import { Coords, Matrix3x3, Vector3 } from "../types.js" */

// Type re-exports
/** @typedef {import("../types.js").Cam16Object} Cam16Object */
/** @typedef {import("../types.js").Cam16Input} Cam16Input */
/** @typedef {import("../types.js").Cam16Environment} Cam16Environment */

const white$3 = WHITES.D65;
const adaptedCoef = 0.42;
const adaptedCoefInv = 1 / adaptedCoef;
const tau$1 = 2 * Math.PI;

/** @type {Matrix3x3} */
// prettier-ignore
const cat16 = [[0.401288, 0.650173, -0.051461], [-0.250268, 1.204414, 0.045854], [-0.002079, 0.048952, 0.953127]];

/** @type {Matrix3x3} */
const cat16Inv = [[1.8620678550872327, -1.0112546305316843, 0.14918677544445175], [0.38752654323613717, 0.6214474419314753, -0.008973985167612518], [-0.015841498849333856, -0.03412293802851557, 1.0499644368778496]];

/** @type {Matrix3x3} */
const m1 = [[460.0, 451.0, 288.0], [460.0, -891.0, -261.0], [460.0, -220.0, -6300.0]];
const surroundMap = {
  dark: [0.8, 0.525, 0.8],
  dim: [0.9, 0.59, 0.9],
  average: [1, 0.69, 1]
};
const hueQuadMap = {
  // Red, Yellow, Green, Blue, Red
  h: [20.14, 90.0, 164.25, 237.53, 380.14],
  e: [0.8, 0.7, 1.0, 1.2, 0.8],
  H: [0.0, 100.0, 200.0, 300.0, 400.0]
};
const rad2deg = 180 / Math.PI;
const deg2rad$1 = Math.PI / 180;

/**
 * @param {Coords} coords
 * @param {number} fl
 * @returns {[number, number, number]}
 */
function adapt$1(coords, fl) {
  const temp = /** @type {[number, number, number]} */
  coords.map(c => {
    const x = spow(fl * Math.abs(c) * 0.01, adaptedCoef);
    return 400 * copySign(x, c) / (x + 27.13);
  });
  return temp;
}

/**
 * @param {Coords} adapted
 * @param {number} fl
 * @returns {[number, number, number]}
 */
function unadapt(adapted, fl) {
  const constant = 100 / fl * 27.13 ** adaptedCoefInv;
  return /** @type {[number, number, number]} */adapted.map(c => {
    const cabs = Math.abs(c);
    return copySign(constant * spow(cabs / (400 - cabs), adaptedCoefInv), c);
  });
}

/**
 * @param {number} h
 */
function hueQuadrature(h) {
  let hp = constrain(h);
  if (hp <= hueQuadMap.h[0]) {
    hp += 360;
  }
  const i = bisectLeft(hueQuadMap.h, hp) - 1;
  const [hi, hii] = hueQuadMap.h.slice(i, i + 2);
  const [ei, eii] = hueQuadMap.e.slice(i, i + 2);
  const Hi = hueQuadMap.H[i];
  const t = (hp - hi) / ei;
  return Hi + 100 * t / (t + (hii - hp) / eii);
}

/**
 * @param {number} H
 */
function invHueQuadrature(H) {
  let Hp = (H % 400 + 400) % 400;
  const i = Math.floor(0.01 * Hp);
  Hp = Hp % 100;
  const [hi, hii] = hueQuadMap.h.slice(i, i + 2);
  const [ei, eii] = hueQuadMap.e.slice(i, i + 2);
  return constrain((Hp * (eii * hi - ei * hii) - 100 * hi * eii) / (Hp * (eii - ei) - 100 * eii));
}

/**
 * @param {[number, number, number]} refWhite
 * @param {number} adaptingLuminance
 * @param {number} backgroundLuminance
 * @param {keyof typeof surroundMap} surround
 * @param {boolean} discounting
 * @returns {Cam16Environment}
 */
function environment(refWhite, adaptingLuminance, backgroundLuminance, surround, discounting) {
  const env = {};
  env.discounting = discounting;
  env.refWhite = refWhite;
  env.surround = surround;
  const xyzW = /** @type {Vector3} */
  refWhite.map(c => {
    return c * 100;
  });

  // The average luminance of the environment in `cd/m^2cd/m` (a.k.a. nits)
  env.la = adaptingLuminance;
  // The relative luminance of the nearby background
  env.yb = backgroundLuminance;
  // Absolute luminance of the reference white.
  const yw = xyzW[1];

  // Cone response for reference white
  const rgbW = multiply_v3_m3x3(xyzW, cat16);

  // Surround: dark, dim, and average
  let values = surroundMap[env.surround];
  const f = values[0];
  env.c = values[1];
  env.nc = values[2];
  const k = 1 / (5 * env.la + 1);
  const k4 = k ** 4;

  // Factor of luminance level adaptation
  env.fl = k4 * env.la + 0.1 * (1 - k4) * (1 - k4) * Math.cbrt(5 * env.la);
  env.flRoot = env.fl ** 0.25;
  env.n = env.yb / yw;
  env.z = 1.48 + Math.sqrt(env.n);
  env.nbb = 0.725 * env.n ** -0.2;
  env.ncb = env.nbb;

  // Degree of adaptation calculating if not discounting
  // illuminant (assumed eye is fully adapted)
  const d = Math.max(Math.min(f * (1 - 1 / 3.6 * Math.exp((-env.la - 42) / 92)), 1), 0);
  env.dRgb = /** @type {[number, number, number]} */
  rgbW.map(c => {
    return interpolate(1, yw / c, d);
  });
  env.dRgbInv = /** @type {[number, number, number]} */
  env.dRgb.map(c => {
    return 1 / c;
  });

  // Achromatic response
  const rgbCW = /** @type {[number, number, number]} */
  rgbW.map((c, i) => {
    return c * env.dRgb[i];
  });
  const rgbAW = adapt$1(rgbCW, env.fl);
  env.aW = env.nbb * (2 * rgbAW[0] + rgbAW[1] + 0.05 * rgbAW[2]);

  // console.log(env);

  return env;
}

// Pre-calculate everything we can with the viewing conditions
const viewingConditions$1 = environment(white$3, 64 / Math.PI * 0.2, 20, "average", false);

/**
 * @param {Cam16Input} cam16
 * @param {Cam16Environment} env
 * @returns {[number, number, number]}
 */
function fromCam16(cam16, env) {
  // These check ensure one, and only one attribute for a
  // given category is provided.
  // @ts-expect-error The '^` operator is not allowed for boolean types
  if (!(cam16.J !== undefined ^ cam16.Q !== undefined)) {
    throw new Error("Conversion requires one and only one: 'J' or 'Q'");
  }

  // @ts-expect-error - The '^` operator is not allowed for boolean types
  if (!(cam16.C !== undefined ^ cam16.M !== undefined ^ cam16.s !== undefined)) {
    throw new Error("Conversion requires one and only one: 'C', 'M' or 's'");
  }

  // Hue is absolutely required
  // @ts-expect-error - The '^` operator is not allowed for boolean types
  if (!(cam16.h !== undefined ^ cam16.H !== undefined)) {
    throw new Error("Conversion requires one and only one: 'h' or 'H'");
  }

  // Black
  if (cam16.J === 0.0 || cam16.Q === 0.0) {
    return [0.0, 0.0, 0.0];
  }

  // Break hue into Cartesian components
  let hRad = 0.0;
  if (cam16.h !== undefined) {
    hRad = constrain(cam16.h) * deg2rad$1;
  } else {
    hRad = invHueQuadrature(cam16.H) * deg2rad$1;
  }
  const cosh = Math.cos(hRad);
  const sinh = Math.sin(hRad);

  // Calculate `Jroot` from one of the lightness derived coordinates.
  let Jroot = 0.0;
  if (cam16.J !== undefined) {
    Jroot = spow(cam16.J, 1 / 2) * 0.1;
  } else if (cam16.Q !== undefined) {
    Jroot = 0.25 * env.c * cam16.Q / ((env.aW + 4) * env.flRoot);
  }

  // Calculate the `t` value from one of the chroma derived coordinates
  let alpha = 0.0;
  if (cam16.C !== undefined) {
    alpha = cam16.C / Jroot;
  } else if (cam16.M !== undefined) {
    alpha = cam16.M / env.flRoot / Jroot;
  } else if (cam16.s !== undefined) {
    alpha = 0.0004 * cam16.s ** 2 * (env.aW + 4) / env.c;
  }
  const t = spow(alpha * Math.pow(1.64 - Math.pow(0.29, env.n), -0.73), 10 / 9);

  // Eccentricity
  const et = 0.25 * (Math.cos(hRad + 2) + 3.8);

  // Achromatic response
  const A = env.aW * spow(Jroot, 2 / env.c / env.z);

  // Calculate red-green and yellow-blue components
  const p1 = 5e4 / 13 * env.nc * env.ncb * et;
  const p2 = A / env.nbb;
  const r = 23 * (p2 + 0.305) * zdiv(t, 23 * p1 + t * (11 * cosh + 108 * sinh));
  const a = r * cosh;
  const b = r * sinh;

  // Calculate back from cone response to XYZ
  const rgb_c = unadapt(/** @type {Vector3} */

  multiply_v3_m3x3([p2, a, b], m1).map(c => {
    return c * 1 / 1403;
  }), env.fl);
  return /** @type {Vector3} */multiply_v3_m3x3(/** @type {Vector3} */
  rgb_c.map((c, i) => {
    return c * env.dRgbInv[i];
  }), cat16Inv).map(c => {
    return c / 100;
  });
}

/**
 * @param {[number, number, number]} xyzd65
 * @param {Cam16Environment} env
 * @returns {Cam16Object}
 */
function toCam16(xyzd65, env) {
  // Cone response
  const xyz100 = /** @type {Vector3} */
  xyzd65.map(c => {
    return c * 100;
  });
  const rgbA = adapt$1(/** @type {[number, number, number]} */

  multiply_v3_m3x3(xyz100, cat16).map((c, i) => {
    return c * env.dRgb[i];
  }), env.fl);

  // Calculate hue from red-green and yellow-blue components
  const a = rgbA[0] + (-12 * rgbA[1] + rgbA[2]) / 11;
  const b = (rgbA[0] + rgbA[1] - 2 * rgbA[2]) / 9;
  const hRad = (Math.atan2(b, a) % tau$1 + tau$1) % tau$1;

  // Eccentricity
  const et = 0.25 * (Math.cos(hRad + 2) + 3.8);
  const t = 5e4 / 13 * env.nc * env.ncb * zdiv(et * Math.sqrt(a ** 2 + b ** 2), rgbA[0] + rgbA[1] + 1.05 * rgbA[2] + 0.305);
  const alpha = spow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, env.n), 0.73);

  // Achromatic response
  const A = env.nbb * (2 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]);
  const Jroot = spow(A / env.aW, 0.5 * env.c * env.z);

  // Lightness
  const J = 100 * spow(Jroot, 2);

  // Brightness
  const Q = 4 / env.c * Jroot * (env.aW + 4) * env.flRoot;

  // Chroma
  const C = alpha * Jroot;

  // Colorfulness
  const M = C * env.flRoot;

  // Hue
  const h = constrain(hRad * rad2deg);

  // Hue quadrature
  const H = hueQuadrature(h);

  // Saturation
  const s = 50 * spow(env.c * alpha / (env.aW + 4), 1 / 2);

  // console.log({J: J, C: C, h: h, s: s, Q: Q, M: M, H: H});

  return {
    J: J,
    C: C,
    h: h,
    s: s,
    Q: Q,
    M: M,
    H: H
  };
}

// Provided as a way to directly evaluate the CAM16 model
// https://observablehq.com/@jrus/cam16: reference implementation
// https://arxiv.org/pdf/1802.06067.pdf: Nico Schlömer
// https://onlinelibrary.wiley.com/doi/pdf/10.1002/col.22324: hue quadrature
// https://www.researchgate.net/publication/318152296_Comprehensive_color_solutions_CAM16_CAT16_and_CAM16-UCS
// Results compared against: https://github.com/colour-science/colour
var cam16 = new ColorSpace({
  id: "cam16-jmh",
  cssId: "--cam16-jmh",
  name: "CAM16-JMh",
  coords: {
    j: {
      refRange: [0, 100],
      name: "J"
    },
    m: {
      refRange: [0, 105.0],
      name: "Colorfulness"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: XYZ_D65,
  fromBase(xyz) {
    // If another derivation is created, ε could vary, so we can't hardcode
    if (this.ε === undefined) {
      this.ε = Object.values(this.coords)[1].refRange[1] / 100000;
    }
    const cam16 = toCam16(xyz, viewingConditions$1);
    const isAchromatic = Math.abs(cam16.M) < this.ε;
    return [cam16.J, isAchromatic ? 0 : cam16.M, isAchromatic ? null : cam16.h];
  },
  toBase(cam16) {
    return fromCam16({
      J: cam16[0],
      M: cam16[1],
      h: cam16[2]
    }, viewingConditions$1);
  }
});

const white$2 = WHITES.D65;
const ε$4 = 216 / 24389; // 6^3/29^3 == (24/116)^3
const κ$3 = 24389 / 27; // 29^3/3^3

function toLstar(y) {
  // Convert XYZ Y to L*

  const fy = y > ε$4 ? Math.cbrt(y) : (κ$3 * y + 16) / 116;
  return 116.0 * fy - 16.0;
}
function fromLstar(lstar) {
  // Convert L* back to XYZ Y

  return lstar > 8 ? Math.pow((lstar + 16) / 116, 3) : lstar / κ$3;
}
function fromHct(coords, env) {
  // Use Newton's method to try and converge as quick as possible or
  // converge as close as we can. While the requested precision is achieved
  // most of the time, it may not always be achievable. Especially past the
  // visible spectrum, the algorithm will likely struggle to get the same
  // precision. If, for whatever reason, we cannot achieve the accuracy we
  // seek in the allotted iterations, just return the closest we were able to
  // get.

  let [h, c, t] = coords;
  let xyz = [];
  let j = 0;

  // Shortcut out for black
  if (t === 0) {
    return [0.0, 0.0, 0.0];
  }

  // Calculate the Y we need to target
  let y = fromLstar(t);

  // A better initial guess yields better results. Polynomials come from
  // curve fitting the T vs J response.
  if (t > 0) {
    j = 0.00379058511492914 * t ** 2 + 0.608983189401032 * t + 0.9155088574762233;
  } else {
    j = 9.514440756550361e-6 * t ** 2 + 0.08693057439788597 * t - 21.928975842194614;
  }

  // Threshold of how close is close enough, and max number of attempts.
  // More precision and more attempts means more time spent iterating. Higher
  // required precision gives more accuracy but also increases the chance of
  // not hitting the goal. 2e-12 allows us to convert round trip with
  // reasonable accuracy of six decimal places or more.
  const threshold = 2e-12;
  const max_attempts = 15;
  let attempt = 0;
  let last = Infinity;
  let best = [0, 0, 0];

  // Try to find a J such that the returned y matches the returned y of the L*
  while (attempt <= max_attempts) {
    xyz = fromCam16({
      J: j,
      C: c,
      h: h
    }, env);

    // If we are within range, return XYZ
    // If we are closer than last time, save the values
    const delta = Math.abs(xyz[1] - y);
    if (delta < last) {
      if (delta <= threshold) {
        return xyz;
      }
      best = xyz;
      last = delta;
    }

    // f(j_root) = (j ** (1 / 2)) * 0.1
    // f(j) = ((f(j_root) * 100) ** 2) / j - 1 = 0
    // f(j_root) = Y = y / 100
    // f(j) = (y ** 2) / j - 1
    // f'(j) = (2 * y) / j
    j = j - (xyz[1] - y) * j / (2 * xyz[1]);
    attempt += 1;
  }

  // We could not acquire the precision we desired,
  // return our closest attempt.
  return best;
}
function toHct(xyz, env) {
  // Calculate HCT by taking the L* of CIE LCh D65 and CAM16 chroma and hue.

  const t = toLstar(xyz[1]);
  if (t === 0.0) {
    return [0.0, 0.0, 0.0];
  }
  const cam16 = toCam16(xyz, viewingConditions);
  return [constrain(cam16.h), cam16.C, t];
}

// Pre-calculate everything we can with the viewing conditions
const viewingConditions = environment(white$2, 200 / Math.PI * fromLstar(50.0), fromLstar(50.0) * 100, "average", false);

// https://material.io/blog/science-of-color-design
// This is not a port of the material-color-utilities,
// but instead implements the full color space as described,
// combining CAM16 JCh and Lab D65. This does not clamp conversion
// to HCT to specific chroma bands and provides support for wider
// gamuts than Google currently supports and does so at a greater
// precision (> 8 bits back to sRGB).
// This implementation comes from https://github.com/facelessuser/coloraide
// which is licensed under MIT.
var hct = new ColorSpace({
  id: "hct",
  name: "HCT",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    c: {
      refRange: [0, 145],
      name: "Colorfulness"
    },
    t: {
      refRange: [0, 100],
      name: "Tone"
    }
  },
  base: XYZ_D65,
  fromBase(xyz) {
    if (this.ε === undefined) {
      this.ε = Object.values(this.coords)[1].refRange[1] / 100000;
    }
    let hct = toHct(xyz);
    if (hct[1] < this.ε) {
      hct[1] = 0.0;
      hct[0] = null;
    }
    return hct;
  },
  toBase(hct) {
    return fromHct(hct, viewingConditions);
  },
  formats: {
    color: {
      id: "--hct",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});

const deg2rad = Math.PI / 180;
const ucsCoeff = [1.0, 0.007, 0.0228];

/**
 * Convert HCT chroma and hue (CAM16 JMh colorfulness and hue) using UCS logic for a and b.
 * @param {Coords} coords - HCT coordinates.
 * @return {number[]}
 */
function convertUcsAb(coords) {
  // We want the distance between the actual color.
  // If chroma is negative, it will throw off our calculations.
  // Normally, converting back to the base and forward will correct it.
  // If we have a negative chroma after this, then we have a color that
  // cannot resolve to positive chroma.
  if (coords[1] < 0) {
    coords = hct.fromBase(hct.toBase(coords));
  }

  // Only in extreme cases (usually outside the visible spectrum)
  // can the input value for log become negative.
  // Avoid domain error by forcing a zero result via "max" if necessary.
  const M = Math.log(Math.max(1 + ucsCoeff[2] * coords[1] * viewingConditions.flRoot, 1.0)) / ucsCoeff[2];
  const hrad = coords[0] * deg2rad;
  const a = M * Math.cos(hrad);
  const b = M * Math.sin(hrad);
  return [coords[2], a, b];
}

/**
 * Color distance using HCT.
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaEHCT (color, sample) {
  [color, sample] = getColor([color, sample]);
  let [t1, a1, b1] = convertUcsAb(hct.from(color));
  let [t2, a2, b2] = convertUcsAb(hct.from(sample));

  // Use simple euclidean distance with a and b using UCS conversion
  // and LCh lightness (HCT tone).
  return Math.sqrt((t1 - t2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Helmlab MetricSpace — 13-stage perceptual color space.
 *
 * A data-driven analytical color space fit on COMBVD (3,813 paired human
 * color-difference judgments aggregating BFD-P, Witt 1999, RIT-DuPont, and
 * Leeds). Used internally by `deltaEHelmlab` and exposed as the CSS
 * color space `helmlab-metric` for inspectability. Its coordinate system
 * (asymmetric ab plane, L > 1 from H-K modeling, achromatic axis offset
 * from origin) is shaped for ΔE accuracy rather than author-facing
 * coordinates — for general CSS authoring use HelmGen (`helmgen`).
 *
 * Measured in this branch: ~24% lower STRESS than CIEDE2000 on COMBVD.
 *
 * Pipeline: XYZ → M1 → γ → M2 → hue correction → H-K → cubic L → dark L
 *   → hue-dep chroma scale → chroma power → L-dep chroma scale
 *   → HLC interaction → hue-dep lightness → rotation
 *
 * Reference: arXiv:2602.23010
 * @see https://github.com/Grkmyldz148/helmlab
 */

/** @import { Matrix3x3 } from "../types.js" */

const {
  cos,
  sin,
  sqrt,
  atan2,
  exp,
  abs,
  pow,
  PI
} = Math;

/** Bradford CAT: Color.js D65 → Helmlab D65 (apply in fromBase before M1) */
/** @type {Matrix3x3} */
// prettier-ignore
const CAT_TO_HELM = [[1.000042977349746, 2.0718877053183e-05, -4.361018085669474e-05], [2.6946201090235744e-05, 0.9999906145080147, -1.4898828405401079e-05], [-7.941753620756204e-06, 1.2875204405137254e-05, 0.9997859822609763]];

/** Bradford CAT: Helmlab D65 → Color.js D65 (apply in toBase after M1_INV) */
/** @type {Matrix3x3} */
// prettier-ignore
const CAT_FROM_HELM = [[0.9999570254019492, -2.071874272730964e-05, 4.361733292468361e-05], [-2.694517763358666e-05, 1.000009385946497, 1.490098223546482e-05], [7.943459292954202e-06, -1.287824596735154e-05, 1.000214063706999]];

// ── Utility functions ──────────────────────────────────────────────

// ── Core parameters (v21, 72 params) ──────────────────────────────

/** @type {Matrix3x3} */
// prettier-ignore
const M1$1 = [[0.72129864331134985189, 0.45344826541531813024, -0.19288975751942616377], [-0.78821186949557897616, 1.79524137675723594043, 0.08761724511817850503], [-0.09177005999121559676, 0.45765588659459255361, 1.29220455139176770842]];
/** @type {Matrix3x3} */
// prettier-ignore
const M1_INV$1 = [[1.06510729580885898926, -0.31500440753011210715, 0.18034923817410389302], [0.47211077138377960383, 0.42719957659624552271, 0.04150680489380984689], [-0.09156391926309541407, -0.17367093631949789834, 0.77197903825582936399]];
const GAMMA = [0.47229813098762524, 0.5149184096354483, 0.5113233386366979];
const INV_GAMMA = [2.1173067060606283, 1.9420552485353544, 1.9557096741686448];

/** @type {Matrix3x3} */
// prettier-ignore
const M2$1 = [[-0.26355622180094095963, 0.41683228837031738312, 0.49267631416564028335], [1.88975705087773215851, -3.12122320342057735232, 1.04216669210603840590], [0.35851086179620561545, 1.76940281937903676202, -1.41206260676953720967]];
/** @type {Matrix3x3} */
// prettier-ignore
const M2_INV$1 = [[0.91838978228150214278, 0.52320512370886662623, 0.70658045980908557038], [1.08990905744330257576, 0.07005324849041903723, 0.43197768747870440853], [1.59889572926420897581, 0.22061850068770233468, 0.01250603735522095097]];

// Enrichment parameters
const hue_cos1 = -0.02833024015436984,
  hue_sin1 = -0.21131429516166544;
const hue_cos2 = 0.2189784817615645,
  hue_sin2 = -0.06871898981942523;
const hue_cos3 = 0.005506053349515315,
  hue_sin3 = -0.0641329861299175;
const hue_cos4 = -0.053592461436994296,
  hue_sin4 = -0.00954137464208059;
const hk_weight = 0.2676231133101982,
  hk_power = 0.8934892185255707;
const hk_hue_mod = 0.7173169828841472;
const hk_sin1 = 0.6915224124600773,
  hk_cos2 = 0.48647127559605596,
  hk_sin2 = 0.9853124591201782;
const L_corr_p1 = 0.5385456675962418,
  L_corr_p2 = 0.12508858146241716,
  L_corr_p3 = 0.6768950256217603;
const Lh_cos1 = -0.4963251525324449,
  Lh_sin1 = -0.09564696283240552;
const lp_dark = -0.029053748937210654,
  lp_dark_hcos = 1.3346761652952872,
  lp_dark_hsin = -0.1698908144723919;
const cs_cos1 = -0.195370576218515,
  cs_sin1 = 0.5330819227283227;
const cs_cos2 = 0.08863325582067766,
  cs_sin2 = 0.9365540137751136;
const cs_cos3 = 0.13789738139719568,
  cs_sin3 = 0.061650260197979936;
const cs_cos4 = 0.0641970862504494,
  cs_sin4 = -0.027401052793571013;
const cp_cos1 = -0.09900209889026965,
  cp_sin1 = 0.059635520647228726;
const cp_cos2 = -0.013586499967803128,
  cp_sin2 = 0.2253393118474472;
const lc1 = -1.5239477450767043,
  lc2 = -1.751157310240011;
const hlc_cos1 = -0.43576378069144767,
  hlc_sin1 = 1.060094063845983;
const hlc_cos2 = 0.47931193034584496,
  hlc_sin2 = -0.2622579649434462;
const hl_cos1 = 0.13610794232685908,
  hl_sin1 = 0.1168702235362288;
const hl_cos2 = -0.01617739641422492,
  hl_sin2 = 0.038145638815030566;

// Rigid rotation φ = −28.2°
const PHI = -28.2 * PI / 180;
const ROT_COS = cos(PHI);
const ROT_SIN = sin(PHI);

// ── Pipeline helper functions ──────────────────────────────────────

function hueDelta(h) {
  return hue_cos1 * cos(h) + hue_sin1 * sin(h) + hue_cos2 * cos(2 * h) + hue_sin2 * sin(2 * h) + hue_cos3 * cos(3 * h) + hue_sin3 * sin(3 * h) + hue_cos4 * cos(4 * h) + hue_sin4 * sin(4 * h);
}
function hueDeltaDeriv(h) {
  return -hue_cos1 * sin(h) + hue_sin1 * cos(h) + -2 * hue_cos2 * sin(2 * h) + 2 * hue_sin2 * cos(2 * h) + -3 * hue_cos3 * sin(3 * h) + 3 * hue_sin3 * cos(3 * h) + -4 * hue_cos4 * sin(4 * h) + 4 * hue_sin4 * cos(4 * h);
}
function chromaScaleH(h) {
  let logS = cs_cos1 * cos(h) + cs_sin1 * sin(h) + cs_cos2 * cos(2 * h) + cs_sin2 * sin(2 * h) + cs_cos3 * cos(3 * h) + cs_sin3 * sin(3 * h) + cs_cos4 * cos(4 * h) + cs_sin4 * sin(4 * h);
  return exp(logS);
}
function lChromaScale(L) {
  let dL = L - 0.5;
  return exp(clamp(-30, lc1 * dL + lc2 * dL * dL, 30));
}
function hlcScale(h, L) {
  let hueFactor = hlc_cos1 * cos(h) + hlc_sin1 * sin(h) + hlc_cos2 * cos(2 * h) + hlc_sin2 * sin(2 * h);
  return exp(clamp(-30, (L - 0.5) * hueFactor, 30));
}
function hueLightnessScale(h) {
  let logS = hl_cos1 * cos(h) + hl_sin1 * sin(h) + hl_cos2 * cos(2 * h) + hl_sin2 * sin(2 * h);
  return exp(logS);
}
function chromaPowerH(h) {
  return 1 + cp_cos1 * cos(h) + cp_sin1 * sin(h) + cp_cos2 * cos(2 * h) + cp_sin2 * sin(2 * h);
}
function lCorrectFwd(L, h) {
  let t = L * (1 - L);
  let result = L + L_corr_p1 * t + L_corr_p2 * t * (0.5 - L) + L_corr_p3 * t * t;
  result += t * (Lh_cos1 * cos(h) + Lh_sin1 * sin(h));
  return result;
}
function lCorrectInv(L1, h) {
  let Lh = Lh_cos1 * cos(h) + Lh_sin1 * sin(h);
  let L = L1;
  for (let i = 0; i < 15; i++) {
    let t = L * (1 - L);
    let dt = 1 - 2 * L;
    let f = L + (L_corr_p1 + Lh) * t + L_corr_p2 * t * (0.5 - L) + L_corr_p3 * t * t - L1;
    let dfdL = 1 + (L_corr_p1 + Lh) * dt + L_corr_p2 * (dt * (0.5 - L) - t) + L_corr_p3 * 2 * t * dt;
    if (abs(dfdL) < 1e-10) {
      dfdL = 1;
    }
    L -= f / dfdL;
  }
  return L;
}
function darkLFwd(L, h) {
  let coeff = lp_dark + lp_dark_hcos * cos(h) + lp_dark_hsin * sin(h);
  let oml = L < 1 ? 1 - L : 0; // clamp at L=1: identity for L≥1
  let g = coeff * L * oml * oml;
  return L * exp(clamp(-30, g, 30));
}
function darkLInv(Ln, h) {
  let coeff = lp_dark + lp_dark_hcos * cos(h) + lp_dark_hsin * sin(h);
  let L = Ln;
  for (let i = 0; i < 12; i++) {
    let oml = L < 1 ? 1 - L : 0;
    let g = coeff * L * oml * oml;
    let eg = exp(clamp(-30, g, 30));
    let f = L * eg - Ln;
    let gp = coeff * oml * (1 - 3 * L);
    let fp = eg * (1 + L * gp);
    if (abs(fp) < 1e-10) {
      fp = 1;
    }
    L -= f / fp;
  }
  return L;
}

// ── Color space definition ─────────────────────────────────────────
// Helmlab MetricSpace is the perceptual forward space behind `deltaEHelmlab`.
// Its coordinate system is shaped to maximize ΔE prediction accuracy on
// visual-difference datasets (COMBVD: BFD-P, Witt 1999, RIT-DuPont, Leeds),
// not author convenience. As a result:
//   - the ab plane is asymmetric (the metric was fit to directionally
//     asymmetric human discrimination thresholds);
//   - the L axis exceeds 1 for highly chromatic colors because the
//     Helmholtz–Kohlrausch boost is modeled explicitly (high-chroma colors
//     appear brighter than equiluminant neutrals);
//   - the achromatic axis is not pinned to (0, 0) — the gray axis sits
//     slightly off-origin in this coordinate system. Distance is
//     translation-invariant, so this does not affect ΔE quality.
//
// For CSS-author-facing color authoring (palettes, gradients, gamut
// mapping), use HelmGen (`helmgen`) instead. This space (`helmlab-metric`)
// is exposed primarily so the metric forward is inspectable for
// debugging, color-science exploration, and as the internal forward used
// by `deltaEHelmlab`.

const fromXYZ = function (xyz) {
  // Stage 0: Chromatic adaptation (Color.js D65 → Helmlab D65)
  let adapted = multiply_v3_m3x3(xyz, CAT_TO_HELM);

  // Stage 1: XYZ → LMS (M1)
  let [lms0, lms1, lms2] = multiply_v3_m3x3(adapted, M1$1);

  // Stage 2: Power compression (signed)
  let c0 = spow(lms0, GAMMA[0]);
  let c1 = spow(lms1, GAMMA[1]);
  let c2 = spow(lms2, GAMMA[2]);

  // Stage 3: LMS_c → Lab_raw (M2)
  let [L, a, b] = multiply_v3_m3x3([c0, c1, c2], M2$1);

  // Stage 3.5: Hue correction (4-harmonic Fourier)
  let h = atan2(b, a);
  let C = sqrt(a * a + b * b);
  let delta = hueDelta(h);
  let hNew = h + delta;
  a = C * cos(hNew);
  b = C * sin(hNew);

  // Stage 3.7: Helmholtz-Kohlrausch correction
  let Cr = sqrt(a * a + b * b);
  let hkBoost = hk_weight * pow(Cr, clamp(0.01, hk_power, 10));
  let hr = atan2(b, a);
  let factor = 1 + hk_hue_mod * cos(hr) + hk_sin1 * sin(hr) + hk_cos2 * cos(2 * hr) + hk_sin2 * sin(2 * hr);
  L += hkBoost * factor;

  // Stage 4: Cubic L correction (with hue modulation)
  h = atan2(b, a);
  L = lCorrectFwd(L, h);

  // Stage 4.5: Dark L compression
  h = atan2(b, a);
  L = darkLFwd(L, h);

  // Stage 5: Hue-dependent chroma scaling
  h = atan2(b, a);
  let cs = chromaScaleH(h);
  a *= cs;
  b *= cs;

  // Stage 5.5: Nonlinear chroma power
  h = atan2(b, a);
  C = sqrt(a * a + b * b);
  let p = chromaPowerH(h);
  let Cn = C > 0 ? pow(C, p) : 0;
  a = Cn * cos(h);
  b = Cn * sin(h);

  // Stage 6: L-dependent chroma scaling
  let T = lChromaScale(L);
  a *= T;
  b *= T;

  // Stage 6.5: HLC interaction
  h = atan2(b, a);
  let hlcS = hlcScale(h, L);
  a *= hlcS;
  b *= hlcS;

  // Stage 8: Hue-dependent lightness scaling
  h = atan2(b, a);
  L *= hueLightnessScale(h);

  // Stage 11: Rigid rotation (φ = −28.2°)
  let aRot = a * ROT_COS - b * ROT_SIN;
  let bRot = a * ROT_SIN + b * ROT_COS;
  return [L, aRot, bRot];
};
const toXYZ = function (lab) {
  let [L, a, b] = lab;

  // Undo Stage 11: rotation
  let aUn = a * ROT_COS + b * ROT_SIN;
  let bUn = -a * ROT_SIN + b * ROT_COS;
  a = aUn;
  b = bUn;

  // Undo Stage 8: hue-dep lightness
  let h = atan2(b, a);
  L /= hueLightnessScale(h);

  // Undo Stage 6.5: HLC
  h = atan2(b, a);
  let hlcS = hlcScale(h, L);
  a /= hlcS;
  b /= hlcS;

  // Undo Stage 6: L-dep chroma
  let T = lChromaScale(L);
  a /= T;
  b /= T;

  // Undo Stage 5.5: chroma power
  h = atan2(b, a);
  let C = sqrt(a * a + b * b);
  let p = chromaPowerH(h);
  let Co = C > 0 ? pow(C, 1 / p) : 0;
  a = Co * cos(h);
  b = Co * sin(h);

  // Undo Stage 5: chroma scaling
  h = atan2(b, a);
  let cs = chromaScaleH(h);
  a /= cs;
  b /= cs;

  // Undo Stage 4.5: dark L
  h = atan2(b, a);
  L = darkLInv(L, h);

  // Undo Stage 4: cubic L
  h = atan2(b, a);
  L = lCorrectInv(L, h);

  // Undo Stage 3.7: H-K
  let Cr = sqrt(a * a + b * b);
  let hkBoost = hk_weight * pow(Cr, clamp(0.01, hk_power, 10));
  let hr = atan2(b, a);
  let factor = 1 + hk_hue_mod * cos(hr) + hk_sin1 * sin(hr) + hk_cos2 * cos(2 * hr) + hk_sin2 * sin(2 * hr);
  L -= hkBoost * factor;

  // Undo Stage 3.5: hue correction (Newton iteration)
  let hOut = atan2(b, a);
  C = sqrt(a * a + b * b);
  let hRaw = hOut;
  for (let i = 0; i < 8; i++) {
    let f = hRaw + hueDelta(hRaw) - hOut;
    let fp = 1 + hueDeltaDeriv(hRaw);
    if (abs(fp) < 1e-10) {
      fp = 1;
    }
    hRaw -= f / fp;
  }
  a = C * cos(hRaw);
  b = C * sin(hRaw);

  // Undo Stage 3: Lab → LMS_c (M2_inv)
  let [lc0, lc1, lc2] = multiply_v3_m3x3([L, a, b], M2_INV$1);

  // Undo Stage 2: power compression
  let l0 = spow(lc0, INV_GAMMA[0]);
  let l1 = spow(lc1, INV_GAMMA[1]);
  let l2 = spow(lc2, INV_GAMMA[2]);

  // Undo Stage 1: LMS → XYZ (M1_inv)
  let xyz = multiply_v3_m3x3([l0, l1, l2], M1_INV$1);

  // Undo Stage 0: Chromatic adaptation (Helmlab D65 → Color.js D65)
  return multiply_v3_m3x3(xyz, CAT_FROM_HELM);
};
var helmlab = new ColorSpace({
  id: "helmlab-metric",
  name: "Helmlab MetricSpace",
  cssId: "--helmlab-metric",
  coords: {
    l: {
      refRange: [0, 1.6],
      name: "Lightness"
    },
    a: {
      refRange: [-1.5, 1.5]
    },
    b: {
      refRange: [-1.5, 1.5]
    }
  },
  white: "D65",
  base: XYZ_D65,
  fromBase(xyz) {
    return fromXYZ(xyz);
  },
  toBase(lab) {
    return toXYZ(lab);
  }
});

// Helmlab MetricSpace weighted distance (v21, 72 params).
// Optimized on COMBVD human color-difference judgments.
//
// Formula:
//   SL = 1 + sl * (L_avg - 0.5)²
//   SC = 1 + sc * C_avg
//   raw = (ΔL²/SL² + wC * Δab²/SC²) ^ (p/2)
//   compressed = raw / (1 + c * raw)
//   ΔE = compressed ^ q

const sl = -0.9155125151657894;
const sc = 2.9268353744941558;
const wC = 3.966003089807536;
const p = 1.9737081170404969;
const compress = 52.473130649294724;
const q = 0.47897301074925214;

/**
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
function deltaEHelmlab (color, sample) {
  [color, sample] = getColor([color, sample]);
  let [L1, a1, b1] = helmlab.from(color);
  let [L2, a2, b2] = helmlab.from(sample);
  let ΔL = L1 - L2;
  let Δa = a1 - a2;
  let Δb = b1 - b2;

  // Pair-dependent weighting
  let Lavg = (L1 + L2) * 0.5;
  let SL = 1 + sl * (Lavg - 0.5) ** 2;
  let C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  let C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  let Cavg = (C1 + C2) * 0.5;
  let SC = 1 + sc * Cavg;

  // Weighted Minkowski distance
  let raw = (ΔL ** 2 / SL ** 2 + wC * (Δa ** 2 + Δb ** 2) / SC ** 2) ** (p / 2);

  // Monotonic compression
  let compressed = raw / (1 + compress * raw);
  return compressed ** q;
}

/**
 * @packageDocumentation
 * This module defines all the builtin deltaE methods.
 */
var deltaEMethods = {
  deltaE76,
  deltaECMC,
  deltaE2000,
  deltaEJz,
  deltaEITP,
  deltaEOK,
  deltaEOK2,
  deltaEHCT,
  deltaEHelmlab
};

/** @typedef {keyof typeof import("./index.js").default extends `deltaE${infer Method}` ? Method : string} Methods */

/** @import { ColorTypes, PlainColorObject } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").ToGamutOptions} ToGamutOptions */

/**
 * Calculate the epsilon to 2 degrees smaller than the specified JND.
 * @param {number} jnd The target "just noticeable difference".
 * @returns {number}
 */
function calcEpsilon(jnd) {
  // Calculate the epsilon to 2 degrees smaller than the specified JND.

  const order = !jnd ? 0 : Math.floor(Math.log10(Math.abs(jnd)));
  // Limit to an arbitrary value to ensure value is never too small and causes infinite loops.
  return Math.max(parseFloat(`1e${order - 2}`), 1e-6);
}
const GMAPPRESET = {
  hct: {
    method: "hct.c",
    jnd: 2,
    deltaEMethod: "hct",
    blackWhiteClamp: {}
  },
  "hct-tonal": {
    method: "hct.c",
    jnd: 0,
    deltaEMethod: "hct",
    blackWhiteClamp: {
      channel: "hct.t",
      min: 0,
      max: 100
    }
  }
};

/**
 * Force coordinates to be in gamut of a certain color space.
 * Mutates the color it is passed.
 * @overload
 * @param {ColorTypes} color
 * @param {ToGamutOptions} [options]
 * @returns {PlainColorObject}
 */
/**
 * @overload
 * @param {ColorTypes} color
 * @param {string} [space]
 * @returns {PlainColorObject}
 */
/**
 * @param {ColorTypes} color
 * @param {string & Partial<ToGamutOptions> | ToGamutOptions} [space]
 * @returns {PlainColorObject}
 */
function toGamut(color, {
  method = defaults.gamut_mapping,
  space = undefined,
  deltaEMethod = "",
  jnd = 2,
  blackWhiteClamp = undefined,
  min = undefined,
  max = undefined
} = {}) {
  color = getColor(color);
  if (isString(arguments[1])) {
    space = arguments[1];
  } else if (!space) {
    space = color.space;
  }
  space = ColorSpace.get(space);

  // 3 spaces:
  // color.space: current color space
  // space: space whose gamut we are mapping to
  // mapSpace: space with the coord we're reducing

  if (inGamut(color, space, {
    epsilon: 0
  })) {
    return /** @type {PlainColorObject} */color;
  }
  let spaceColor;
  if (method === "css") {
    spaceColor = toGamutCSS(color, {
      space
    });
  } else if (method === "raytrace") {
    spaceColor = toGamutRayTrace(color, {
      space
    });
  } else {
    if (method !== "clip") {
      if (Object.prototype.hasOwnProperty.call(GMAPPRESET, method)) {
        ({
          method,
          jnd,
          deltaEMethod,
          blackWhiteClamp
        } = GMAPPRESET[method]);
      }

      // Get the correct delta E method
      let de = deltaE2000;
      if (deltaEMethod !== "") {
        for (let m in deltaEMethods) {
          if ("deltae" + deltaEMethod.toLowerCase() === m.toLowerCase()) {
            de = deltaEMethods[m];
            break;
          }
        }
      }
      if (jnd === 0) {
        jnd = 1e-16;
      }
      let clipped = toGamut(to(color, space), {
        method: "clip",
        space
      });
      if (de(color, clipped) > jnd) {
        var _min;
        // Clamp to SDR white and black if required
        if (blackWhiteClamp && Object.keys(blackWhiteClamp).length === 3) {
          let channelMeta = ColorSpace.resolveCoord(blackWhiteClamp.channel);
          let channel = get(to(color, channelMeta.space), channelMeta.id);
          if (isNone(channel)) {
            channel = 0;
          }
          if (channel >= blackWhiteClamp.max) {
            return to({
              space: "xyz-d65",
              coords: WHITES["D65"]
            }, color.space);
          } else if (channel <= blackWhiteClamp.min) {
            return to({
              space: "xyz-d65",
              coords: [0, 0, 0]
            }, color.space);
          }
        }

        // Reduce a coordinate of a certain color space until the color is in gamut
        let coordMeta = ColorSpace.resolveCoord(method);
        let mapSpace = coordMeta.space;
        let coordId = coordMeta.id;
        let mappedColor = to(color, mapSpace);
        // If we were already in the mapped color space, we need to resolve undefined channels
        mappedColor.coords.forEach((c, i) => {
          if (isNone(c)) {
            mappedColor.coords[i] = 0;
          }
        });
        let bounds = coordMeta.range || coordMeta.refRange;
        (_min = min) !== null && _min !== void 0 ? _min : min = bounds[0];
        let ε = calcEpsilon(jnd);
        let low = min;
        let high = Math.min(get(mappedColor, coordId), max !== null && max !== void 0 ? max : Infinity);
        set(mappedColor, coordId, high);
        while (high - low > ε) {
          let clipped = clone(mappedColor);
          clipped = toGamut(clipped, {
            space,
            method: "clip"
          });
          let deltaE = de(mappedColor, clipped);
          if (deltaE - jnd < ε) {
            low = get(mappedColor, coordId);
          } else {
            high = get(mappedColor, coordId);
          }
          set(mappedColor, coordId, (low + high) / 2);
        }
        spaceColor = to(mappedColor, space);
      } else {
        spaceColor = clipped;
      }
    } else {
      spaceColor = to(color, space);
    }
    if (method === "clip" ||
    // Dumb coord clipping
    // finish off smarter gamut mapping with clip to get rid of ε, see #17
    !inGamut(spaceColor, space, {
      epsilon: 0
    })) {
      let bounds = Object.values(space.coords).map(c => c.range || []);
      spaceColor.coords = /** @type {[number, number, number]} */
      spaceColor.coords.map((c, i) => {
        let [min, max] = bounds[i];
        if (min !== undefined) {
          c = Math.max(min, c);
        }
        if (max !== undefined) {
          c = Math.min(c, max);
        }
        return c;
      });
    }
  }
  if (space !== color.space) {
    spaceColor = to(spaceColor, color.space);
  }
  color.coords = spaceColor.coords;
  return /** @type {PlainColorObject} */color;
}

/** @type {"color"} */
toGamut.returns = "color";

/**
 * The reference colors to be used if lightness is out of the range 0-1 in the
 * `Oklch` space. These are created in the `Oklab` space, as it is used by the
 * DeltaEOK calculation, so it is guaranteed to be imported.
 * @satisfies {Record<string, ColorTypes>}
 */
const COLORS = {
  WHITE: {
    space: Oklab,
    coords: [1, 0, 0],
    alpha: 1
  },
  BLACK: {
    space: Oklab,
    coords: [0, 0, 0],
    alpha: 1
  }
};

/**
 * Given a color `origin`, returns a new color that is in gamut using
 * the CSS Gamut Mapping Algorithm. If `space` is specified, it will be in gamut
 * in `space`, and returned in `space`. Otherwise, it will be in gamut and
 * returned in the color space of `origin`.
 * @param {ColorTypes} origin
 * @param {{ space?: string | ColorSpace | undefined }} options
 * @returns {PlainColorObject}
 */
function toGamutCSS(origin, {
  space
} = {}) {
  const JND = 0.02;
  const ε = 0.0001;
  origin = getColor(origin);
  if (!space) {
    space = origin.space;
  }
  space = ColorSpace.get(space);
  if (space.isUnbounded) {
    return to(origin, space);
  }
  const origin_OKLCH = to(origin, OKLCH);
  let L = origin_OKLCH.coords[0];

  // return media white or black, if lightness is out of range
  if (L >= 1) {
    const white = to(COLORS.WHITE, space);
    white.alpha = origin.alpha;
    return to(white, space);
  }
  if (L <= 0) {
    const black = to(COLORS.BLACK, space);
    black.alpha = origin.alpha;
    return to(black, space);
  }
  if (inGamut(origin_OKLCH, space, {
    epsilon: 0
  })) {
    return to(origin_OKLCH, space);
  }
  function clip(_color) {
    const destColor = to(_color, space);
    const spaceCoords = Object.values(/** @type {ColorSpace} */space.coords);
    destColor.coords = /** @type {[number, number, number]} */
    destColor.coords.map((coord, index) => {
      if ("range" in spaceCoords[index]) {
        const [min, max] = spaceCoords[index].range;
        return clamp(min, coord, max);
      }
      return coord;
    });
    return destColor;
  }
  let min = 0;
  let max = origin_OKLCH.coords[1];
  let min_inGamut = true;
  let current = clone(origin_OKLCH);
  let clipped = clip(current);
  let E = deltaEOK(clipped, current);
  if (E < JND) {
    return clipped;
  }
  while (max - min > ε) {
    const chroma = (min + max) / 2;
    current.coords[1] = chroma;
    if (min_inGamut && inGamut(current, space, {
      epsilon: 0
    })) {
      min = chroma;
    } else {
      clipped = clip(current);
      E = deltaEOK(clipped, current);
      if (E < JND) {
        if (JND - E < ε) {
          break;
        } else {
          min_inGamut = false;
          min = chroma;
        }
      } else {
        max = chroma;
      }
    }
  }
  return clipped;
}

/**
 * Given `start` and `end` coordinates of a 3D ray and a `bmin` and `bmax` bounding box,
 * find the intersection of the ray and box. Return an empty list if no intersect is found.`
 * @param {[number, number, number]} start
 * @param {[number, number, number]} end
 * @param {[number, number, number]} bmin
 * @param {[number, number, number]} bmax
 * @returns {[number, number, number] | []}
 */
function raytrace_box(start, end, bmin = [0, 0, 0], bmax = [1, 1, 1]) {
  // Use slab method to detect intersection of ray and box and return intersect.
  // https://en.wikipedia.org/wiki/Slab_method

  // Calculate whether there was a hit
  let tfar = Infinity;
  let tnear = -Infinity;
  let direction = [];
  for (let i = 0; i < 3; i++) {
    const a = start[i];
    const b = end[i];
    const d = b - a;
    const bn = bmin[i];
    const bx = bmax[i];
    direction.push(d);

    // Non parallel cases
    if (Math.abs(d) > 1e-12) {
      const inv_d = 1 / d;
      const t1 = (bn - a) * inv_d;
      const t2 = (bx - a) * inv_d;
      tnear = Math.max(Math.min(t1, t2), tnear);
      tfar = Math.min(Math.max(t1, t2), tfar);
    }

    // Impossible parallel case
    else if (a < bn || a > bx) {
      return [];
    }
  }

  // No hit
  if (tnear > tfar || tfar < 0) {
    return [];
  }

  // Favor the intersection first in the direction start -> end
  if (tnear < 0) {
    tnear = tfar;
  }

  // A point, or something approaching a single point where start and end are the same.
  if (!isFinite(tnear)) {
    return [];
  }

  // Calculate nearest intersection via interpolation
  return [start[0] + direction[0] * tnear, start[1] + direction[1] * tnear, start[2] + direction[2] * tnear];
}

/**
 * Given a color `origin`, returns a new color that is in gamut using
 * the CSS Ray Trace Gamut Mapping Algorithm. If `space` is specified,
 * it will be in gamut `space`, and returned in `space`. Otherwise,
 * it will be in gamut and returned in the color space of `origin`.
 * @param {ColorTypes} origin
 * @param {{ space?: string | ColorSpace | undefined }} options
 * @returns {PlainColorObject}
 */
function toGamutRayTrace(origin, {
  space
} = {}) {
  origin = getColor(origin);
  if (!space) {
    space = origin.space;
  }
  space = ColorSpace.get(space);

  // If the space is already in gamut, stop.
  if (space.isUnbounded) {
    return to(origin, space);
  }

  // Get the OkLCh coordinates.
  let oklchOrigin = to(origin, OKLCH);
  let [lightness, chroma, hue] = oklchOrigin.coords;

  // Return white or black if color's lightness exceeds the SDR range.
  if (lightness >= 1) {
    const white = to(COLORS.WHITE, space);
    white.alpha = origin.alpha;
    return to(white, space);
  } else if (lightness <= 0) {
    const black = to(COLORS.BLACK, space);
    black.alpha = origin.alpha;
    return to(black, space);
  }

  // Get a copy of the origin color as the RGB target space.
  const originSpace = space;
  const rGamut = space.rgbGamut;
  if (rGamut !== undefined) {
    space = rGamut;
  }
  if (!isInstance(space, RGBColorSpace)) {
    throw Error("An RGB gamut is required");
  }

  // Get SDR bounds. Some HDR spaces have headroom, so reduce max to SDR range.
  let [mn, mx] = Object.values(space.coords)[0].range;
  let max = /** @type {[number, number, number]} */[mx, mx, mx];

  // See if we have a linear version of the color space
  const lGamut = space.linearGamut;
  if (lGamut !== undefined) {
    // Recalculate minimum and maximum relative to the linear space
    let temp = to({
      space: space,
      coords: max,
      alpha: origin.alpha
    }, lGamut);
    mx = temp.coords[0];
    max = /** @type {[number, number, number]} */[mx, mx, mx];
    space = lGamut;
    mn = Object.values(space.coords)[0].range[0];
  }
  let min = /** @type {[number, number, number]} */[mn, mn, mn];
  let rgbOrigin = to(oklchOrigin, space);
  if (!rgbOrigin.coords.every(x => mn <= x && x <= mx)) {
    // If this were performed within a perceptual space like CAM16, which has achromatics that do not align
    // with the RGB achromatic line, projecting the color onto the RGB achromatic line may be preferable,
    // but since OkLCh's achromatics align with all CSS RGB spaces, just set chroma to zero.
    let anchor = to({
      space: OKLCH,
      coords: [lightness, 0, hue]
    }, space).coords;

    // Calculate bounds to adjust the anchor closer to the gamut surface.
    // We don't want to make the ray too short, so offset some amount from the low and high range.
    const low = mn + 1e-6;
    const high = mx - 1e-6;

    // Cast a ray from the zero chroma color to the target color.
    // Trace the line to the RGB cube edge and find where it intersects.
    // Correct L and h within the perceptual OkLCh after each attempt.
    let last = rgbOrigin.coords;
    for (let i = 0; i < 4; i++) {
      if (i) {
        // For constant luminance, we correct the color by simply setting lightness and hue to
        // match the original color. In a non constant luminance reduction, it is better to
        // project the color onto the reduction path vector.
        const oklchColor = to(rgbOrigin, OKLCH);
        oklchColor.coords[0] = lightness;
        oklchColor.coords[2] = hue;
        rgbOrigin = to(oklchColor, space);
      }
      // Cast a ray from the achromatic anchor to the RGB target and find the gamut intersection.
      const intersection = raytrace_box(anchor, rgbOrigin.coords, min, max);

      // If we cannot find an intersection, reset to last successful iteration of the color.
      // In OkLCh, this is only likely to happen if our ray gets too small, in that case, it is time to stop.
      if (intersection.length === 0) {
        rgbOrigin.coords = [...last];
        break;
      }

      // Adjust anchor point closer to surface, when possible, to improve results for some spaces.
      if (i && rgbOrigin.coords.every(x => low < x && x < high)) {
        anchor = [...rgbOrigin.coords];
      }

      // If we have an intersection, update the color.
      last = /** @type {[number, number, number]} */intersection;
      rgbOrigin.coords = [...intersection];
    }
  }

  // Convert to the original, specified gamut
  rgbOrigin = to(rgbOrigin, originSpace);
  const spaceCoords = Object.values(/** @type {ColorSpace} */originSpace.coords);

  // Remove noise from floating point math by clipping
  rgbOrigin.coords = /** @type {[number, number, number]} */
  rgbOrigin.coords.map((coord, index) => {
    if ("range" in spaceCoords[index]) {
      const [lower, upper] = spaceCoords[index].range;
      return clamp(lower, coord, upper);
    }
    return coord;
  });
  return rgbOrigin;
}

/** @import { ColorTypes, PlainColorObject, ToGamutOptions } from "./types.js" */

/**
 * Convert to color space and return a new color
 * @param {ColorTypes} color
 * @param {string | ColorSpace} space
 * @param {{ inGamut?: boolean | ToGamutOptions | undefined }} options
 * @returns {PlainColorObject}
 */
function to(color, space, {
  inGamut
} = {}) {
  color = getColor(color);
  space = ColorSpace.get(space);
  let coords = space.from(color);
  let ret = {
    space,
    coords,
    alpha: color.alpha
  };
  if (inGamut) {
    ret = toGamut(ret, inGamut === true ? undefined : inGamut);
  }
  return ret;
}

/** @type {"color"} */
to.returns = "color";

/** @import { ColorTypes, ParseOptions, PlainColorObject } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").SerializeOptions} SerializeOptions */

/**
 * Generic toString() method, outputs a color(spaceId ...coords) function, a functional syntax, or custom formats defined by the color space
 * @param {ColorTypes} color
 * @param {SerializeOptions & Record<string, any>} options
 * @returns {string}
 */
function serialize(color, options = {}) {
  let {
    precision = defaults.precision,
    format,
    inGamut: inGamut$1 = true,
    coords: coordFormat,
    alpha: alphaFormat,
    commas
  } = options;
  let ret;
  let colorWithMeta = /** @type {PlainColorObject & ParseOptions} */getColor(color);
  let formatId = format;
  let parseMeta = colorWithMeta.parseMeta;
  if (parseMeta && !format) {
    var _coordFormat, _alphaFormat, _commas;
    if (parseMeta.format.canSerialize()) {
      format = parseMeta.format;
      formatId = parseMeta.formatId;
    }
    (_coordFormat = coordFormat) !== null && _coordFormat !== void 0 ? _coordFormat : coordFormat = parseMeta.types;
    (_alphaFormat = alphaFormat) !== null && _alphaFormat !== void 0 ? _alphaFormat : alphaFormat = parseMeta.alphaType;
    (_commas = commas) !== null && _commas !== void 0 ? _commas : commas = parseMeta.commas;
  }
  if (formatId) {
    var _colorWithMeta$space$;
    // A format is explicitly specified
    format = (_colorWithMeta$space$ = colorWithMeta.space.getFormat(format)) !== null && _colorWithMeta$space$ !== void 0 ? _colorWithMeta$space$ : ColorSpace.findFormat(formatId);
  }
  if (!format) {
    var _colorWithMeta$space$2;
    // No format specified, or format not found
    format = (_colorWithMeta$space$2 = colorWithMeta.space.getFormat("default")) !== null && _colorWithMeta$space$2 !== void 0 ? _colorWithMeta$space$2 : ColorSpace.DEFAULT_FORMAT;
    formatId = format.name;
  }
  if (format && format.space && format.space !== colorWithMeta.space) {
    // Format specified belongs to a different color space,
    // need to convert to it first
    colorWithMeta = to(colorWithMeta, format.space);
  }

  // The assignment to coords and inGamut needs to stay in the order they are now
  // The order of the assignment was changed as a workaround for a bug in Next.js
  // See this issue for details: https://github.com/color-js/color.js/issues/260

  let coords = colorWithMeta.coords.slice(); // clone so we can manipulate it

  inGamut$1 || (inGamut$1 = format.toGamut);
  if (inGamut$1 && !inGamut(colorWithMeta)) {
    // FIXME what happens if the color contains none values?
    coords = toGamut(clone(colorWithMeta), inGamut$1 === true ? undefined : inGamut$1).coords;
  }
  if (format.type === "custom") {
    if (format.serialize) {
      ret = format.serialize(coords, colorWithMeta.alpha, options);
    } else {
      throw new TypeError(`format ${formatId} can only be used to parse colors, not for serialization`);
    }
  } else {
    var _alphaFormat$type, _alphaFormat2, _alphaFormat3, _alphaFormat4, _commas2;
    // Functional syntax
    let name = format.name || "color";
    let args = format.serializeCoords(coords, precision, coordFormat);
    if (name === "color") {
      var _format$ids;
      // If output is a color() function, add colorspace id as first argument
      let cssId = format.id || ((_format$ids = format.ids) === null || _format$ids === void 0 ? void 0 : _format$ids[0]) || colorWithMeta.space.cssId || colorWithMeta.space.id;
      args.unshift(cssId);
    }

    // Serialize alpha?
    /** @type {string | number} */
    let alpha = colorWithMeta.alpha;
    if (alphaFormat !== undefined && !(typeof alphaFormat === "object")) {
      alphaFormat = typeof alphaFormat === "string" ? {
        type: alphaFormat
      } : {
        include: alphaFormat
      };
    }
    let alphaType = (_alphaFormat$type = (_alphaFormat2 = alphaFormat) === null || _alphaFormat2 === void 0 ? void 0 : _alphaFormat2.type) !== null && _alphaFormat$type !== void 0 ? _alphaFormat$type : "<number>";
    let serializeAlpha = ((_alphaFormat3 = alphaFormat) === null || _alphaFormat3 === void 0 ? void 0 : _alphaFormat3.include) === true || format.alpha === true || ((_alphaFormat4 = alphaFormat) === null || _alphaFormat4 === void 0 ? void 0 : _alphaFormat4.include) !== false && format.alpha !== false && alpha < 1;
    let strAlpha = "";
    (_commas2 = commas) !== null && _commas2 !== void 0 ? _commas2 : commas = format.commas;
    if (serializeAlpha) {
      if (precision !== null) {
        let unit;
        if (alphaType === "<percentage>") {
          unit = "%";
          alpha *= 100;
        }
        alpha = serializeNumber(alpha, {
          precision,
          unit
        });
      }
      strAlpha = `${commas ? "," : " /"} ${alpha}`;
    }
    ret = `${name}(${args.join(commas ? ", " : " ")}${strAlpha})`;
  }
  return ret;
}

var esnext_iterator_filter = {};

var es_iterator_filter = {};

var hasRequiredEs_iterator_filter;

function requireEs_iterator_filter () {
	if (hasRequiredEs_iterator_filter) return es_iterator_filter;
	hasRequiredEs_iterator_filter = 1;
	var $ = require_export();
	var call = requireFunctionCall();
	var aCallable = requireACallable();
	var anObject = requireAnObject();
	var getIteratorDirect = requireGetIteratorDirect();
	var createIteratorProxy = requireIteratorCreateProxy();
	var callWithSafeIterationClosing = requireCallWithSafeIterationClosing();
	var IS_PURE = requireIsPure();

	var IteratorProxy = createIteratorProxy(function () {
	  var iterator = this.iterator;
	  var predicate = this.predicate;
	  var next = this.next;
	  var result, done, value;
	  while (true) {
	    result = anObject(call(next, iterator));
	    done = this.done = !!result.done;
	    if (done) return;
	    value = result.value;
	    if (callWithSafeIterationClosing(iterator, predicate, [value, this.counter++], true)) return value;
	  }
	});

	// `Iterator.prototype.filter` method
	// https://tc39.es/ecma262/#sec-iterator.prototype.filter
	$({ target: 'Iterator', proto: true, real: true, forced: IS_PURE }, {
	  filter: function filter(predicate) {
	    anObject(this);
	    aCallable(predicate);
	    return new IteratorProxy(getIteratorDirect(this), {
	      predicate: predicate
	    });
	  }
	});
	return es_iterator_filter;
}

var hasRequiredEsnext_iterator_filter;

function requireEsnext_iterator_filter () {
	if (hasRequiredEsnext_iterator_filter) return esnext_iterator_filter;
	hasRequiredEsnext_iterator_filter = 1;
	// TODO: Remove from `core-js@4`
	requireEs_iterator_filter();
	return esnext_iterator_filter;
}

requireEsnext_iterator_filter();

/** @import { Matrix3x3 } from "../types.js" */

// convert an array of linear-light rec2020 values to CIE XYZ
// using  D65 (no chromatic adaptation)
// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
// 0 is actually calculated as  4.994106574466076e-17
/** @type {Matrix3x3} */
// prettier-ignore
const toXYZ_M$5 = [[0.6369580483012914, 0.14461690358620832, 0.1688809751641721], [0.2627002120112671, 0.6779980715188708, 0.05930171646986196], [0.000000000000000, 0.028072693049087428, 1.060985057710791]];

// from ITU-R BT.2124-0 Annex 2 p.3
/** @type {Matrix3x3} */
// prettier-ignore
const fromXYZ_M$5 = [[1.716651187971268, -0.355670783776392, -0.253366281373660], [-0.666684351832489, 1.616481236634939, 0.0157685458139111], [0.017639857445311, -0.042770613257809, 0.942103121235474]];
var REC_2020_Linear = new RGBColorSpace({
  id: "rec2020-linear",
  cssId: "--rec2020-linear",
  name: "Linear REC.2020",
  white: "D65",
  toXYZ_M: toXYZ_M$5,
  fromXYZ_M: fromXYZ_M$5
});

// import sRGB from "./srgb.js";

var REC2020 = new RGBColorSpace({
  id: "rec2020",
  name: "REC.2020",
  base: REC_2020_Linear,
  linearGamut: REC_2020_Linear,
  //  Reference electro-optical transfer function from Rec. ITU-R BT.1886 Annex 1
  //  with b (black lift) = 0 and a (user gain) = 1
  //  defined over the extended range, not clamped
  toBase(RGB) {
    return RGB.map(function (val) {
      let sign = val < 0 ? -1 : 1;
      let abs = val * sign;
      return sign * Math.pow(abs, 2.4);
    });
  },
  fromBase(RGB) {
    return RGB.map(function (val) {
      let sign = val < 0 ? -1 : 1;
      let abs = val * sign;
      return sign * Math.pow(abs, 1 / 2.4);
    });
  }
});

/** @import { Matrix3x3 } from "../types.js" */

/** @type {Matrix3x3} */
// prettier-ignore
const toXYZ_M$4 = [[0.4865709486482162, 0.26566769316909306, 0.1982172852343625], [0.2289745640697488, 0.6917385218365064, 0.079286914093745], [0.0000000000000000, 0.04511338185890264, 1.043944368900976]];

/** @type {Matrix3x3} */
// prettier-ignore
const fromXYZ_M$4 = [[2.493496911941425, -0.9313836179191239, -0.40271078445071684], [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577], [0.03584583024378447, -0.07617238926804182, 0.9568845240076872]];
var P3Linear = new RGBColorSpace({
  id: "p3-linear",
  cssId: "display-p3-linear",
  name: "Linear P3",
  white: "D65",
  toXYZ_M: toXYZ_M$4,
  fromXYZ_M: fromXYZ_M$4
});

/** @import { Matrix3x3 } from "../types.js" */

// This is the linear-light version of sRGB
// as used for example in SVG filters
// or in Canvas

// This matrix was calculated directly from the RGB and white chromaticities
// when rounded to 8 decimal places, it agrees completely with the official matrix
// see https://github.com/w3c/csswg-drafts/issues/5922
/** @type {Matrix3x3} */
// prettier-ignore
const toXYZ_M$3 = [[0.41239079926595934, 0.357584339383878, 0.1804807884018343], [0.21263900587151027, 0.715168678767756, 0.07219231536073371], [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]];

// This matrix is the inverse of the above;
// again it agrees with the official definition when rounded to 8 decimal places
/** @type {Matrix3x3} */
// prettier-ignore
const fromXYZ_M$3 = [[3.2409699419045226, -1.537383177570094, -0.4986107602930034], [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559], [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]];
var sRGBLinear = new RGBColorSpace({
  id: "srgb-linear",
  name: "Linear sRGB",
  white: "D65",
  toXYZ_M: toXYZ_M$3,
  fromXYZ_M: fromXYZ_M$3
});

// To produce: Visit https://www.w3.org/TR/css-color-4/#named-colors
// and run in the console:
// copy($$("tr", $(".named-color-table tbody")).map(tr => `"${tr.cells[2].textContent.trim()}": [${tr.cells[4].textContent.trim().split(/\s+/).map(c => c === "0"? "0" : c === "255"? "1" : c + " / 255").join(", ")}]`).join(",\n"))

/** List of CSS color keywords
 *  Note that this does not include currentColor, transparent,
 *  or system colors
 *
 *  @type {Record<string, [number, number, number]>}
 */
var KEYWORDS = {
  aliceblue: [240 / 255, 248 / 255, 1],
  antiquewhite: [250 / 255, 235 / 255, 215 / 255],
  aqua: [0, 1, 1],
  aquamarine: [127 / 255, 1, 212 / 255],
  azure: [240 / 255, 1, 1],
  beige: [245 / 255, 245 / 255, 220 / 255],
  bisque: [1, 228 / 255, 196 / 255],
  black: [0, 0, 0],
  blanchedalmond: [1, 235 / 255, 205 / 255],
  blue: [0, 0, 1],
  blueviolet: [138 / 255, 43 / 255, 226 / 255],
  brown: [165 / 255, 42 / 255, 42 / 255],
  burlywood: [222 / 255, 184 / 255, 135 / 255],
  cadetblue: [95 / 255, 158 / 255, 160 / 255],
  chartreuse: [127 / 255, 1, 0],
  chocolate: [210 / 255, 105 / 255, 30 / 255],
  coral: [1, 127 / 255, 80 / 255],
  cornflowerblue: [100 / 255, 149 / 255, 237 / 255],
  cornsilk: [1, 248 / 255, 220 / 255],
  crimson: [220 / 255, 20 / 255, 60 / 255],
  cyan: [0, 1, 1],
  darkblue: [0, 0, 139 / 255],
  darkcyan: [0, 139 / 255, 139 / 255],
  darkgoldenrod: [184 / 255, 134 / 255, 11 / 255],
  darkgray: [169 / 255, 169 / 255, 169 / 255],
  darkgreen: [0, 100 / 255, 0],
  darkgrey: [169 / 255, 169 / 255, 169 / 255],
  darkkhaki: [189 / 255, 183 / 255, 107 / 255],
  darkmagenta: [139 / 255, 0, 139 / 255],
  darkolivegreen: [85 / 255, 107 / 255, 47 / 255],
  darkorange: [1, 140 / 255, 0],
  darkorchid: [153 / 255, 50 / 255, 204 / 255],
  darkred: [139 / 255, 0, 0],
  darksalmon: [233 / 255, 150 / 255, 122 / 255],
  darkseagreen: [143 / 255, 188 / 255, 143 / 255],
  darkslateblue: [72 / 255, 61 / 255, 139 / 255],
  darkslategray: [47 / 255, 79 / 255, 79 / 255],
  darkslategrey: [47 / 255, 79 / 255, 79 / 255],
  darkturquoise: [0, 206 / 255, 209 / 255],
  darkviolet: [148 / 255, 0, 211 / 255],
  deeppink: [1, 20 / 255, 147 / 255],
  deepskyblue: [0, 191 / 255, 1],
  dimgray: [105 / 255, 105 / 255, 105 / 255],
  dimgrey: [105 / 255, 105 / 255, 105 / 255],
  dodgerblue: [30 / 255, 144 / 255, 1],
  firebrick: [178 / 255, 34 / 255, 34 / 255],
  floralwhite: [1, 250 / 255, 240 / 255],
  forestgreen: [34 / 255, 139 / 255, 34 / 255],
  fuchsia: [1, 0, 1],
  gainsboro: [220 / 255, 220 / 255, 220 / 255],
  ghostwhite: [248 / 255, 248 / 255, 1],
  gold: [1, 215 / 255, 0],
  goldenrod: [218 / 255, 165 / 255, 32 / 255],
  gray: [128 / 255, 128 / 255, 128 / 255],
  green: [0, 128 / 255, 0],
  greenyellow: [173 / 255, 1, 47 / 255],
  grey: [128 / 255, 128 / 255, 128 / 255],
  honeydew: [240 / 255, 1, 240 / 255],
  hotpink: [1, 105 / 255, 180 / 255],
  indianred: [205 / 255, 92 / 255, 92 / 255],
  indigo: [75 / 255, 0, 130 / 255],
  ivory: [1, 1, 240 / 255],
  khaki: [240 / 255, 230 / 255, 140 / 255],
  lavender: [230 / 255, 230 / 255, 250 / 255],
  lavenderblush: [1, 240 / 255, 245 / 255],
  lawngreen: [124 / 255, 252 / 255, 0],
  lemonchiffon: [1, 250 / 255, 205 / 255],
  lightblue: [173 / 255, 216 / 255, 230 / 255],
  lightcoral: [240 / 255, 128 / 255, 128 / 255],
  lightcyan: [224 / 255, 1, 1],
  lightgoldenrodyellow: [250 / 255, 250 / 255, 210 / 255],
  lightgray: [211 / 255, 211 / 255, 211 / 255],
  lightgreen: [144 / 255, 238 / 255, 144 / 255],
  lightgrey: [211 / 255, 211 / 255, 211 / 255],
  lightpink: [1, 182 / 255, 193 / 255],
  lightsalmon: [1, 160 / 255, 122 / 255],
  lightseagreen: [32 / 255, 178 / 255, 170 / 255],
  lightskyblue: [135 / 255, 206 / 255, 250 / 255],
  lightslategray: [119 / 255, 136 / 255, 153 / 255],
  lightslategrey: [119 / 255, 136 / 255, 153 / 255],
  lightsteelblue: [176 / 255, 196 / 255, 222 / 255],
  lightyellow: [1, 1, 224 / 255],
  lime: [0, 1, 0],
  limegreen: [50 / 255, 205 / 255, 50 / 255],
  linen: [250 / 255, 240 / 255, 230 / 255],
  magenta: [1, 0, 1],
  maroon: [128 / 255, 0, 0],
  mediumaquamarine: [102 / 255, 205 / 255, 170 / 255],
  mediumblue: [0, 0, 205 / 255],
  mediumorchid: [186 / 255, 85 / 255, 211 / 255],
  mediumpurple: [147 / 255, 112 / 255, 219 / 255],
  mediumseagreen: [60 / 255, 179 / 255, 113 / 255],
  mediumslateblue: [123 / 255, 104 / 255, 238 / 255],
  mediumspringgreen: [0, 250 / 255, 154 / 255],
  mediumturquoise: [72 / 255, 209 / 255, 204 / 255],
  mediumvioletred: [199 / 255, 21 / 255, 133 / 255],
  midnightblue: [25 / 255, 25 / 255, 112 / 255],
  mintcream: [245 / 255, 1, 250 / 255],
  mistyrose: [1, 228 / 255, 225 / 255],
  moccasin: [1, 228 / 255, 181 / 255],
  navajowhite: [1, 222 / 255, 173 / 255],
  navy: [0, 0, 128 / 255],
  oldlace: [253 / 255, 245 / 255, 230 / 255],
  olive: [128 / 255, 128 / 255, 0],
  olivedrab: [107 / 255, 142 / 255, 35 / 255],
  orange: [1, 165 / 255, 0],
  orangered: [1, 69 / 255, 0],
  orchid: [218 / 255, 112 / 255, 214 / 255],
  palegoldenrod: [238 / 255, 232 / 255, 170 / 255],
  palegreen: [152 / 255, 251 / 255, 152 / 255],
  paleturquoise: [175 / 255, 238 / 255, 238 / 255],
  palevioletred: [219 / 255, 112 / 255, 147 / 255],
  papayawhip: [1, 239 / 255, 213 / 255],
  peachpuff: [1, 218 / 255, 185 / 255],
  peru: [205 / 255, 133 / 255, 63 / 255],
  pink: [1, 192 / 255, 203 / 255],
  plum: [221 / 255, 160 / 255, 221 / 255],
  powderblue: [176 / 255, 224 / 255, 230 / 255],
  purple: [128 / 255, 0, 128 / 255],
  rebeccapurple: [102 / 255, 51 / 255, 153 / 255],
  red: [1, 0, 0],
  rosybrown: [188 / 255, 143 / 255, 143 / 255],
  royalblue: [65 / 255, 105 / 255, 225 / 255],
  saddlebrown: [139 / 255, 69 / 255, 19 / 255],
  salmon: [250 / 255, 128 / 255, 114 / 255],
  sandybrown: [244 / 255, 164 / 255, 96 / 255],
  seagreen: [46 / 255, 139 / 255, 87 / 255],
  seashell: [1, 245 / 255, 238 / 255],
  sienna: [160 / 255, 82 / 255, 45 / 255],
  silver: [192 / 255, 192 / 255, 192 / 255],
  skyblue: [135 / 255, 206 / 255, 235 / 255],
  slateblue: [106 / 255, 90 / 255, 205 / 255],
  slategray: [112 / 255, 128 / 255, 144 / 255],
  slategrey: [112 / 255, 128 / 255, 144 / 255],
  snow: [1, 250 / 255, 250 / 255],
  springgreen: [0, 1, 127 / 255],
  steelblue: [70 / 255, 130 / 255, 180 / 255],
  tan: [210 / 255, 180 / 255, 140 / 255],
  teal: [0, 128 / 255, 128 / 255],
  thistle: [216 / 255, 191 / 255, 216 / 255],
  tomato: [1, 99 / 255, 71 / 255],
  turquoise: [64 / 255, 224 / 255, 208 / 255],
  violet: [238 / 255, 130 / 255, 238 / 255],
  wheat: [245 / 255, 222 / 255, 179 / 255],
  white: [1, 1, 1],
  whitesmoke: [245 / 255, 245 / 255, 245 / 255],
  yellow: [1, 1, 0],
  yellowgreen: [154 / 255, 205 / 255, 50 / 255]
};

/** @import { Coords } from "../types.js" */

let coordGrammar = Array(3).fill("<percentage> | <number>[0, 255]");
let coordGrammarNumber = Array(3).fill("<number>[0, 255]");
var sRGB = new RGBColorSpace({
  id: "srgb",
  name: "sRGB",
  base: sRGBLinear,
  linearGamut: sRGBLinear,
  fromBase: rgb => {
    // convert an array of linear-light sRGB values in the range 0.0-1.0
    // to gamma corrected form
    // https://en.wikipedia.org/wiki/SRGB
    return rgb.map(val => {
      let sign = val < 0 ? -1 : 1;
      let abs = val * sign;
      if (abs > 0.0031308) {
        return sign * (1.055 * abs ** (1 / 2.4) - 0.055);
      }
      return 12.92 * val;
    });
  },
  toBase: rgb => {
    // convert an array of sRGB values in the range 0.0 - 1.0
    // to linear light (un-companded) form.
    // https://en.wikipedia.org/wiki/SRGB
    return rgb.map(val => {
      let sign = val < 0 ? -1 : 1;
      let abs = val * sign;
      if (abs <= 0.04045) {
        return val / 12.92;
      }
      return sign * ((abs + 0.055) / 1.055) ** 2.4;
    });
  },
  formats: {
    rgb: {
      coords: coordGrammar
    },
    rgb_number: {
      name: "rgb",
      commas: true,
      coords: coordGrammarNumber,
      alpha: false
    },
    color: {
      /* use defaults */
    },
    rgba: {
      coords: coordGrammar,
      commas: true,
      alpha: true
    },
    rgba_number: {
      name: "rgba",
      commas: true,
      coords: coordGrammarNumber
    },
    hex: {
      type: "custom",
      toGamut: true,
      test: str => /^#(([a-f0-9]{2}){3,4}|[a-f0-9]{3,4})$/i.test(str),
      parse(str) {
        if (str.length <= 5) {
          // #rgb or #rgba, duplicate digits
          str = str.replace(/[a-f0-9]/gi, "$&$&");
        }

        /** @type {number[]} */
        let rgba = [];
        // @ts-expect-error Type 'void' is not assignable to type 'string'
        str.replace(/[a-f0-9]{2}/gi, component => {
          rgba.push(parseInt(component, 16) / 255);
        });
        return {
          spaceId: "srgb",
          coords: (/** @type {Coords} */rgba.slice(0, 3)),
          alpha: (/** @type {number} */rgba.slice(3)[0])
        };
      },
      serialize: (coords, alpha, {
        collapse = true,
        // collapse to 3-4 digit hex when possible?
        alpha: alphaFormat
      } = {}) => {
        if (alphaFormat !== false && alpha < 1 || alphaFormat === true) {
          coords.push(alpha);
        }
        coords = /** @type {[number, number, number]} */
        coords.map(c => Math.round(c * 255));
        let collapsible = collapse && coords.every(c => c % 17 === 0);
        let hex = coords.map(c => {
          if (collapsible) {
            return (c / 17).toString(16);
          }
          return c.toString(16).padStart(2, "0");
        }).join("");
        return "#" + hex;
      }
    },
    keyword: {
      type: "custom",
      test: str => /^[a-z]+$/i.test(str),
      parse(str) {
        str = str.toLowerCase();
        let ret = {
          spaceId: "srgb",
          coords: null,
          alpha: 1
        };
        if (str === "transparent") {
          ret.coords = KEYWORDS.black;
          ret.alpha = 0;
        } else {
          ret.coords = KEYWORDS[str];
        }
        if (ret.coords) {
          return ret;
        }
      }
    }
  }
});

var P3 = new RGBColorSpace({
  id: "p3",
  cssId: "display-p3",
  name: "P3",
  base: P3Linear,
  linearGamut: P3Linear,
  // Gamma encoding/decoding is the same as sRGB
  fromBase: sRGB.fromBase,
  toBase: sRGB.toBase
});

/** @import ColorSpace from "./ColorSpace.js" */
/** @import { ColorTypes, PlainColorObject, DisplayOptions } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").Display} Display */

// Default space for CSS output. Code in Color.js makes this wider if there's a DOM available
defaults.display_space = sRGB;
let supportsNone;
if (typeof CSS !== "undefined" && CSS.supports) {
  // Find widest supported color space for CSS
  for (let space of [lab, REC2020, P3]) {
    let coords = space.getMinCoords();
    let color = {
      space,
      coords,
      alpha: 1
    };
    let str = serialize(color);
    if (CSS.supports("color", str)) {
      defaults.display_space = space;
      break;
    }
  }
}

/**
 * Returns a serialization of the color that can actually be displayed in the browser.
 * If the default serialization can be displayed, it is returned.
 * Otherwise, if a `space` is given, the color is converted directly to it.
 * If not, the color is converted to the first supported of its space's `displaySpaces` (if any),
 * else the closest supported space in its base color space chain (which preserves its gamut),
 * else the default fallback space (Lab, REC2020, or P3, whichever is the widest supported).
 * In Node.js, this is basically equivalent to `serialize()` but returns a `String` object instead.
 * @param {ColorTypes} color
 * @param {DisplayOptions} [options] Options. Any properties beyond `space` and `supports` are passed to `serialize()`.
 * @returns {Display} String object containing the serialized color
 * with a color property containing the converted color (or the original, if no conversion was necessary)
 */
function display(color, {
  space,
  supports = (_globalThis$CSS => (_globalThis$CSS = globalThis.CSS) === null || _globalThis$CSS === void 0 ? void 0 : _globalThis$CSS.supports)(),
  ...options
} = {}) {
  color = getColor(color);
  let ret = /** @type {Display} */serialize(color, options);
  if (!supports || supports("color", /** @type {string} */ret) || !defaults.display_space) {
    ret = /** @type {Display} */new String(ret);
    ret.color = /** @type {PlainColorObject} */color;
  } else {
    // If we're here, what we were about to output is not supported
    let fallbackColor = /** @type {PlainColorObject} */color;

    // First, check if the culprit is none values
    let hasNone = color.coords.some(isNone) || isNone(color.alpha);
    if (hasNone) {
      var _supportsNone;
      // Does the browser support none values?
      if (!((_supportsNone = supportsNone) !== null && _supportsNone !== void 0 ? _supportsNone : supportsNone = supports("color", "hsl(none 50% 50%)"))) {
        // Nope, try again without none
        fallbackColor = clone(/** @type {PlainColorObject} */color);
        fallbackColor.coords = /** @type {[number, number, number]} */
        fallbackColor.coords.map(skipNone);
        fallbackColor.alpha = skipNone(fallbackColor.alpha);

        // @ts-expect-error This is set to the correct type later
        ret = serialize(fallbackColor, options);
        if (supports("color", /** @type {string} */ret)) {
          // We're done, now it's supported
          ret = /** @type {Display} */new String(ret);
          ret.color = fallbackColor;
          return ret;
        }
      }
    }

    // If we're here, the color function is not supported.
    // With no explicit space, try the color's own `displaySpaces`, or else walk up its base
    // color space chain (closest first, skipping XYZ connection spaces), and use the first
    // space the browser supports, before falling back to the default space.
    if (space === undefined) {
      var _space$displaySpaces;
      space = fallbackColor.space;
      let candidates = (_space$displaySpaces = space.displaySpaces) !== null && _space$displaySpaces !== void 0 ? _space$displaySpaces : space.bases;

      // Skip XYZ connection spaces (unless the space itself is one, so it still has a fallback).
      if (!space.displaySpaces && !space.id.startsWith("xyz-")) {
        candidates = candidates.filter(space => !space.id.startsWith("xyz-"));
      }
      for (let candidate of candidates) {
        let candidateColor = to(fallbackColor, candidate);
        let str = serialize(candidateColor, options);
        if (supports("color", /** @type {string} */str)) {
          ret = /** @type {Display} */new String(str);
          ret.color = candidateColor;
          return ret;
        }
      }
      space = defaults.display_space;
    }

    // Fall back to fallback space
    fallbackColor = to(fallbackColor, /** @type {string | ColorSpace} */space);
    ret = /** @type {Display} */new String(serialize(fallbackColor, options));
    ret.color = fallbackColor;
  }
  return ret;
}

/** @import { ColorSpace as ColorSpaceType } from "./types.js" */

// Cell count per coordinate: each keyed coordinate's range is divided into this many cells.
// Calibrated so a cell spans < 1e-4 of chroma for OKLCh + P3 (slopes measured by
// scripts/oklch-gamut-bounds.js); finer precision would not change the result.
const STEPS = 1e6;

// A specialized, memoized maxChroma function per (reduce space, gamut), built lazily on first use
// and keyed by their ids. Each closes over a two-layer digit trie of cached results: the lightness
// key descends the outer trie to a node whose `.h` holds a hue trie, descended in turn to a
// `.value` holding the max chroma. Each key drops its trailing zeros, so a round l or h costs no levels.
/** @typedef {Array<any> & { value?: number }} HueTrie A digit indexes into the next level; `.value` is the max chroma */
/** @typedef {Array<any> & { h?: HueTrie }} LightnessTrie A digit indexes into the next level; `.h` is the hue trie at this lightness */
/** @type {Record<string, Record<string, (l: number, h: number) => number>>} */
const cache = {};

// Significant digits of a ≤ 6-digit integer key (trailing zeros omitted, so round numbers stay shallow)
function digitsOf(n) {
  let digits = [];
  for (let div = STEPS / 10; n; div /= 10) {
    digits.push(Math.floor(n / div));
    n %= div;
  }
  return digits;
}

/**
 * Maximum chroma within an RGB gamut for a given lightness and hue, in a polar space's chroma units.
 * @param {number} l Lightness, in the reduce space's units
 * @param {number} h Hue angle, in degrees
 * @param {{ space: string | ColorSpaceType, gamut: string | ColorSpaceType }} options
 *        `space` is the polar space whose chroma is reduced; `gamut` is the RGB gamut to fit.
 * @returns {number}
 */
function maxChroma(l, h, {
  space,
  gamut
}) {
  var _cache$space$id, _gamut$id, _cache$space$id$_gamu, _space$id, _cache$_space$id;
  space = ColorSpace.get(space);
  gamut = ColorSpace.get(gamut);
  let fn = (_cache$space$id$_gamu = (_cache$space$id = (_cache$_space$id = cache[_space$id = space.id]) !== null && _cache$_space$id !== void 0 ? _cache$_space$id : cache[_space$id] = {})[_gamut$id = gamut.id]) !== null && _cache$space$id$_gamu !== void 0 ? _cache$space$id$_gamu : _cache$space$id[_gamut$id] = makeMaxChroma(space, gamut);
  return fn(l, h);
}

/**
 * Build the specialized maxChroma function for one (space, gamut) pair, doing the per-pair setup
 * (validation, role identification, ranges) once and capturing it in the returned closure.
 * @param {ColorSpaceType} space Resolved polar space whose chroma is reduced
 * @param {ColorSpaceType} gamut Resolved RGB gamut to fit
 * @returns {(l: number, h: number) => number}
 */
function makeMaxChroma(space, gamut) {
  if (!space.isPolar || !("c" in space.coords)) {
    throw new TypeError(`maxChroma() needs a polar space with a "c" coordinate, got ${space.id}`);
  }

  // Identify coordinates by role
  let ids = Object.keys(space.coords);
  let hueId = ids.find(id => space.coords[id].type === "angle");
  let lightnessId = ids.find(id => id !== "c" && id !== hueId);
  let range = id => {
    var _space$coords$id$rang;
    return (_space$coords$id$rang = space.coords[id].range) !== null && _space$coords$id$rang !== void 0 ? _space$coords$id$rang : space.coords[id].refRange;
  };
  let [lMin, lMax] = range(lightnessId);
  let [hMin, hMax] = range(hueId);
  let cMax = range("c")[1];
  let cIndex = ids.indexOf("c");
  let method = `${space.id}.c`;
  let root = /** @type {LightnessTrie} */[];
  return function (l, h) {
    var _lNode2, _lNode2$h, _hNode2, _hNode2$value;
    if (l <= lMin || l >= lMax) {
      return 0;
    }
    let lNode = root;
    for (let d of digitsOf(Math.floor((l - lMin) / (lMax - lMin) * STEPS))) {
      var _lNode, _lNode$d;
      lNode = (_lNode$d = (_lNode = lNode)[d]) !== null && _lNode$d !== void 0 ? _lNode$d : _lNode[d] = [];
    }
    let hNode = (_lNode2$h = (_lNode2 = lNode).h) !== null && _lNode2$h !== void 0 ? _lNode2$h : _lNode2.h = [];
    for (let d of digitsOf(Math.floor((constrain(h) - hMin) / (hMax - hMin) * STEPS))) {
      var _hNode, _hNode$d;
      hNode = (_hNode$d = (_hNode = hNode)[d]) !== null && _hNode$d !== void 0 ? _hNode$d : _hNode[d] = [];
    }
    let coords = /** @type {[number, number, number]} */
    ids.map(id => id === "c" ? cMax : id === hueId ? h : l);
    return (_hNode2$value = (_hNode2 = hNode).value) !== null && _hNode2$value !== void 0 ? _hNode2$value : _hNode2.value = toGamut({
      space,
      coords
    },
    // deltaE OK stays sensitive near black, where deltaE 2000 is too forgiving of excess chroma
    {
      space: gamut,
      method,
      deltaEMethod: "OK",
      jnd: 0
    }).coords[cIndex];
  };
}

/** @import { ColorTypes } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").DeltasReturn} DeltasReturn */

/**
 * Get color differences per-component, on any color space
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {object} options
 * @param {string | ColorSpace} [options.space=c1.space] - The color space to use for the delta calculation. Defaults to the color space of the first color.
 * @param {Parameters<typeof adjust>[0]} [options.hue="shorter"] - How to handle hue differences. Same as hue interpolation option.
 * @returns {DeltasReturn}
 */
function deltas(c1, c2, {
  space,
  hue = "shorter"
} = {}) {
  c1 = getColor(c1);
  space || (space = c1.space);
  space = ColorSpace.get(space);
  let spaceCoords = Object.values(space.coords);
  [c1, c2] = [c1, c2].map(c => to(c, space));
  let [coords1, coords2] = [c1, c2].map(c => c.coords);
  let coords = /** @type {[number, number, number]} */
  coords1.map((coord1, i) => {
    let coordMeta = spaceCoords[i];
    let coord2 = coords2[i];
    if (coordMeta.type === "angle") {
      [coord1, coord2] = adjust(hue, [coord1, coord2]);
    }
    return subtractCoords(coord1, coord2);
  });
  let alpha = subtractCoords(c1.alpha, c2.alpha);
  return {
    space: (/** @type {ColorSpace} */space),
    coords,
    alpha
  };
}
function subtractCoords(c1, c2) {
  if (isNone(c1) || isNone(c2)) {
    return c1 === c2 ? null : 0;
  }
  return c1 - c2;
}

/** @import { ColorTypes } from "./types.js" */

/**
 * @param {ColorTypes} color1
 * @param {ColorTypes} color2
 * @returns {boolean}
 */
function equals(color1, color2) {
  color1 = getColor(color1);
  color2 = getColor(color2);
  return color1.space === color2.space && color1.alpha === color2.alpha && color1.coords.every((c, i) => c === color2.coords[i]);
}

/**
 * Relative luminance
 */

/** @import { ColorTypes } from "./types.js" */

/**
 *
 * @param {ColorTypes} color
 * @returns {number}
 */
function getLuminance(color) {
  // Assume getColor() is called on color in get()
  return get(color, [XYZ_D65, "y"]);
}

/**
 * @param {ColorTypes} color
 * @param {number | ((coord: number) => number)} value
 */
function setLuminance(color, value) {
  // Assume getColor() is called on color in set()
  set(color, [XYZ_D65, "y"], value);
}

// WCAG 2.0 contrast https://www.w3.org/TR/WCAG20-TECHS/G18.html
// Simple contrast, with fixed 5% viewing flare contribution
// Symmetric, does not matter which is foreground and which is background


/**
 * @param {import("../types.js").ColorTypes} color1
 * @param {import("../types.js").ColorTypes} color2
 * @returns {number}
 */
function contrastWCAG21(color1, color2) {
  color1 = getColor(color1);
  color2 = getColor(color2);
  let Y1 = Math.max(getLuminance(color1), 0);
  let Y2 = Math.max(getLuminance(color2), 0);
  if (Y2 > Y1) {
    [Y1, Y2] = [Y2, Y1];
  }
  return (Y1 + 0.05) / (Y2 + 0.05);
}

// exponents
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62;
const revBG = 0.65;

// clamps
const blkThrs = 0.022;
const blkClmp = 1.414;
const loClip = 0.1;
const deltaYmin = 0.0005;

// scalers
// see https://github.com/w3c/silver/issues/645
const scaleBoW = 1.14;
const loBoWoffset = 0.027;
const scaleWoB = 1.14;
function fclamp(Y) {
  if (Y >= blkThrs) {
    return Y;
  }
  return Y + (blkThrs - Y) ** blkClmp;
}
function linearize(val) {
  let sign = val < 0 ? -1 : 1;
  let abs = Math.abs(val);
  return sign * Math.pow(abs, 2.4);
}

/**
 * Not symmetric, requires a foreground (text) color, and a background color
 * @param {import("../types.js").ColorTypes} background
 * @param {import("../types.js").ColorTypes} foreground
 * @returns {number}
 */
function contrastAPCA(background, foreground) {
  foreground = getColor(foreground);
  background = getColor(background);
  let S;
  let C;
  let Sapc;

  // Myndex as-published, assumes sRGB inputs
  let R, G, B;
  foreground = to(foreground, "srgb");
  // Should these be clamped to in-gamut values?

  // Calculates "screen luminance" with non-standard simple gamma EOTF
  // weights should be from CSS Color 4, not the ones here which are via Myndex and copied from Lindbloom
  [R, G, B] = foreground.coords.map(c => {
    return isNone(c) ? 0 : c;
  });
  let lumTxt = linearize(R) * 0.2126729 + linearize(G) * 0.7151522 + linearize(B) * 0.072175;
  background = to(background, "srgb");
  [R, G, B] = background.coords.map(c => {
    return isNone(c) ? 0 : c;
  });
  let lumBg = linearize(R) * 0.2126729 + linearize(G) * 0.7151522 + linearize(B) * 0.072175;

  // toe clamping of very dark values to account for flare
  let Ytxt = fclamp(lumTxt);
  let Ybg = fclamp(lumBg);

  // are we "Black on White" (dark on light), or light on dark?
  let BoW = Ybg > Ytxt;

  // why is this a delta, when Y is not perceptually uniform?
  // Answer: it is a noise gate, see
  // https://github.com/LeaVerou/color.js/issues/208
  if (Math.abs(Ybg - Ytxt) < deltaYmin) {
    C = 0;
  } else {
    if (BoW) {
      // dark text on light background
      S = Ybg ** normBG - Ytxt ** normTXT;
      C = S * scaleBoW;
    } else {
      // light text on dark background
      S = Ybg ** revBG - Ytxt ** revTXT;
      C = S * scaleWoB;
    }
  }
  if (Math.abs(C) < loClip) {
    Sapc = 0;
  } else if (C > 0) {
    // not clear whether Woffset is loBoWoffset or loWoBoffset
    // but they have the same value
    Sapc = C - loBoWoffset;
  } else {
    Sapc = C + loBoWoffset;
  }
  return Sapc * 100;
}

// Michelson  luminance contrast
// the relation between the spread and the sum of the two luminances
// Symmetric, does not matter which is foreground and which is background
// No black level compensation for flare.


/**
 * @param {import("../types.js").ColorTypes} color1
 * @param {import("../types.js").ColorTypes} color2
 * @returns {number}
 */
function contrastMichelson(color1, color2) {
  color1 = getColor(color1);
  color2 = getColor(color2);
  let Y1 = Math.max(getLuminance(color1), 0);
  let Y2 = Math.max(getLuminance(color2), 0);
  if (Y2 > Y1) {
    [Y1, Y2] = [Y2, Y1];
  }
  let denom = Y1 + Y2;
  return denom === 0 ? 0 : (Y1 - Y2) / denom;
}

// Weber luminance contrast
// The difference between the two luminances divided by the lower luminance
// Symmetric, does not matter which is foreground and which is background
// No black level compensation for flare.


// the darkest sRGB color above black is #000001 and this produces
// a plain Weber contrast of ~45647.
// So, setting the divide-by-zero result at 50000 is a reasonable
// max clamp for the plain Weber
const max = 50000;

/**
 * @param {import("../types.js").ColorTypes} color1
 * @param {import("../types.js").ColorTypes} color2
 * @returns {number}
 */
function contrastWeber(color1, color2) {
  color1 = getColor(color1);
  color2 = getColor(color2);
  let Y1 = Math.max(getLuminance(color1), 0);
  let Y2 = Math.max(getLuminance(color2), 0);
  if (Y2 > Y1) {
    [Y1, Y2] = [Y2, Y1];
  }
  return Y2 === 0 ? max : (Y1 - Y2) / Y2;
}

// CIE Lightness difference, as used by Google Material Design
// Google HCT Tone is the same as CIE Lightness
// https://material.io/blog/science-of-color-design


/**
 * @param {import("../types.js").ColorTypes} color1
 * @param {import("../types.js").ColorTypes} color2
 * @returns {number}
 */
function contrastLstar(color1, color2) {
  color1 = getColor(color1);
  color2 = getColor(color2);
  let L1 = get(color1, [lab, "l"]);
  let L2 = get(color2, [lab, "l"]);
  return Math.abs(L1 - L2);
}

// κ * ε  = 2^3 = 8
const ε$3 = 216 / 24389; // 6^3/29^3 == (24/116)^3
const ε3 = 24 / 116;
const κ$2 = 24389 / 27; // 29^3/3^3

let white$1 = WHITES.D65;
var lab_d65 = new ColorSpace({
  id: "lab-d65",
  name: "Lab D65",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    a: {
      refRange: [-125, 125]
    },
    b: {
      refRange: [-125, 125]
    }
  },
  // Assuming XYZ is relative to D65, convert to CIE Lab
  // from CIE standard, which now defines these as a rational fraction
  white: white$1,
  base: XYZ_D65,
  // Convert D65-adapted XYZ to Lab
  //  CIE 15.3:2004 section 8.2.1.1
  fromBase(XYZ) {
    // compute xyz, which is XYZ scaled relative to reference white
    let xyz = XYZ.map((value, i) => value / white$1[i]);

    // now compute f
    let f = xyz.map(value => value > ε$3 ? Math.cbrt(value) : (κ$2 * value + 16) / 116);
    return [116 * f[1] - 16,
    // L
    500 * (f[0] - f[1]),
    // a
    200 * (f[1] - f[2]) // b
    ];
  },
  // Convert Lab to D65-adapted XYZ
  // Same result as CIE 15.3:2004 Appendix D although the derivation is different
  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
  toBase(Lab) {
    // compute f, starting with the luminance-related term
    let f = [];
    f[1] = (Lab[0] + 16) / 116;
    f[0] = Lab[1] / 500 + f[1];
    f[2] = f[1] - Lab[2] / 200;

    // compute xyz
    let xyz = [f[0] > ε3 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ$2, Lab[0] > 8 ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / κ$2, f[2] > ε3 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ$2];

    // Compute XYZ by scaling xyz by reference white
    return xyz.map((value, i) => value * white$1[i]);
  },
  formats: {
    "lab-d65": {
      coords: ["<number> | <percentage>", "<number> | <percentage>", "<number> | <percentage>"]
    }
  }
});

// Delta Phi Star perceptual lightness contrast
// See https://github.com/Myndex/deltaphistar
// The (difference between two Lstars each raised to phi) raised to (1/phi)
// Symmetric, does not matter which is foreground and which is background

const phi = Math.pow(5, 0.5) * 0.5 + 0.5; // Math.phi can be used if Math.js

/**
 * @param {import("../types.js").ColorTypes} color1
 * @param {import("../types.js").ColorTypes} color2
 * @returns {number}
 */
function contrastDeltaPhi(color1, color2) {
  color1 = getColor(color1);
  color2 = getColor(color2);
  let Lstr1 = get(color1, [lab_d65, "l"]);
  let Lstr2 = get(color2, [lab_d65, "l"]);
  let deltaPhiStar = Math.abs(Math.pow(Lstr1, phi) - Math.pow(Lstr2, phi));
  let contrast = Math.pow(deltaPhiStar, 1 / phi) * Math.SQRT2 - 40;
  return contrast < 7.5 ? 0.0 : contrast;
}

/** @typedef {keyof typeof import("./index.js") extends `contrast${infer Alg}` ? Alg : string} Algorithms */

var contrastAlgorithms = /*#__PURE__*/Object.freeze({
	__proto__: null,
	contrastAPCA: contrastAPCA,
	contrastDeltaPhi: contrastDeltaPhi,
	contrastLstar: contrastLstar,
	contrastMichelson: contrastMichelson,
	contrastWCAG21: contrastWCAG21,
	contrastWeber: contrastWeber
});

/** @import { ColorTypes } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").Algorithms} Algorithms */

/**
 *
 * @param {ColorTypes} background
 * @param {ColorTypes} foreground
 * @param {Algorithms | ({ algorithm: Algorithms } & Record<string, any>)} o
 * Algorithm to use as well as any other options to pass to the contrast function
 * @returns {number}
 * @throws {TypeError} Unknown or unspecified algorithm
 */
function contrast(background, foreground, o) {
  if (isString(o)) {
    o = {
      algorithm: o
    };
  }
  let {
    algorithm,
    ...rest
  } = o || {};
  if (!algorithm) {
    let algorithms = Object.keys(contrastAlgorithms).map(a => a.replace(/^contrast/, "")).join(", ");
    throw new TypeError(`contrast() function needs a contrast algorithm. Please specify one of: ${algorithms}`);
  }
  background = getColor(background);
  foreground = getColor(foreground);
  for (let a in contrastAlgorithms) {
    if ("contrast" + algorithm.toLowerCase() === a.toLowerCase()) {
      return contrastAlgorithms[a](background, foreground, rest);
    }
  }
  throw new TypeError(`Unknown contrast algorithm: ${algorithm}`);
}

/** @import Color, { ColorTypes } from "./color.js" */

// Chromaticity coordinates
/**
 * @param {ColorTypes} color
 * @returns {[number, number]}
 */
function uv(color) {
  // Assumes getAll() calls getColor() on color
  let [X, Y, Z] = getAll(color, XYZ_D65);
  let denom = X + 15 * Y + 3 * Z;
  return [4 * X / denom, 9 * Y / denom];
}

/**
 * @param {ColorTypes} color
 * @returns {[number, number]}
 */
function xy(color) {
  // Assumes getAll() calls getColor() on color
  let [X, Y, Z] = getAll(color, XYZ_D65);
  let sum = X + Y + Z;
  return [X / sum, Y / sum];
}

/** @import { ColorTypes } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").Methods} Methods */

/**
 *
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {Methods | ({ method?: Methods | undefined } & Record<string, any>)} [o]
 * deltaE method to use as well as any other options to pass to the deltaE function
 * @returns {number}
 * @throws {TypeError} Unknown or unspecified method
 */
function deltaE(c1, c2, o = {}) {
  if (isString(o)) {
    o = {
      method: o
    };
  }
  let {
    method = defaults.deltaE,
    ...rest
  } = o;
  for (let m in deltaEMethods) {
    if ("deltae" + method.toLowerCase() === m.toLowerCase()) {
      return deltaEMethods[m](c1, c2, rest);
    }
  }
  throw new TypeError(`Unknown deltaE method: ${method}`);
}

/** @import { ColorTypes, PlainColorObject, Ref } from "./types.js" */

/**
 * @param {ColorTypes} color
 * @param {number} amount
 * @returns {PlainColorObject}
 */
function lighten(color, amount = 0.25) {
  let space = ColorSpace.get("oklch", "lch");
  let /** @type {Ref} */lightness = [space, "l"];
  return set(color, lightness, l => l * (1 + amount));
}

/**
 * @param {ColorTypes} color
 * @param {number} amount
 * @returns {PlainColorObject}
 */
function darken(color, amount = 0.25) {
  let space = ColorSpace.get("oklch", "lch");
  let /** @type {Ref} */lightness = [space, "l"];
  return set(color, lightness, l => l * (1 - amount));
}

/** @type {"color"} */
lighten.returns = "color";

/** @type {"color"} */
darken.returns = "color";

/** @import { ColorTypes, PlainColorObject, Ref } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").MixOptions} MixOptions */
/** @typedef {import("./types.js").Range} Range */
/** @typedef {import("./types.js").RangeOptions} RangeOptions */
/** @typedef {import("./types.js").StepsOptions} StepsOptions */

/**
 * Return an intermediate color between two colors
 * @overload
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {MixOptions} [options]
 * @returns {PlainColorObject}
 */
/**
 * @overload
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {number} [p=0.5]
 * @param {MixOptions} [options]
 * @returns {PlainColorObject}
 */
function mix(c1, c2, p, o = {}) {
  var _p;
  [c1, c2] = [getColor(c1), getColor(c2)];
  if (type(p) === "object") {
    [p, o] = [0.5, p];
  }
  let r = range(c1, c2, o);
  return r((_p = p) !== null && _p !== void 0 ? _p : 0.5); // why not give p a default value like we do for options? Overloading doesn't work, and TS complains
}

/**
 * Get an array of discrete steps
 * @overload
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {StepsOptions} [options]
 * @returns {PlainColorObject[]}
 */
/**
 * @overload
 * @param {Range} range
 * @param {StepsOptions} [options]
 * @returns {PlainColorObject[]}
 */
function steps(c1, c2, options = {}) {
  let colorRange;
  if (isRange(c1)) {
    // Tweaking existing range
    [colorRange, options] = [c1, c2];
    [c1, c2] = colorRange.rangeArgs.colors;
  }
  let {
    maxDeltaE,
    deltaEMethod,
    steps = 2,
    maxSteps = 1000,
    ...rangeOptions
  } = options;
  if (!colorRange) {
    [c1, c2] = [getColor(c1), getColor(c2)];
    colorRange = range(c1, c2, rangeOptions);
  }
  let totalDelta = deltaE(c1, c2);
  let actualSteps = maxDeltaE > 0 ? Math.max(steps, Math.ceil(totalDelta / maxDeltaE) + 1) : steps;
  let ret = [];
  if (maxSteps !== undefined) {
    actualSteps = Math.min(actualSteps, maxSteps);
  }
  if (actualSteps === 1) {
    ret = [{
      p: 0.5,
      color: colorRange(0.5)
    }];
  } else {
    let step = 1 / (actualSteps - 1);
    ret = Array.from({
      length: actualSteps
    }, (_, i) => {
      let p = i * step;
      return {
        p,
        color: colorRange(p)
      };
    });
  }
  if (maxDeltaE > 0) {
    // Iterate over all stops and find max deltaE
    let maxDelta = ret.reduce((acc, cur, i) => {
      if (i === 0) {
        return 0;
      }
      let ΔΕ = deltaE(cur.color, ret[i - 1].color, deltaEMethod);
      return Math.max(acc, ΔΕ);
    }, 0);
    while (maxDelta > maxDeltaE) {
      // Insert intermediate stops and measure maxDelta again
      // We need to do this for all pairs, otherwise the midpoint shifts
      maxDelta = 0;
      for (let i = 1; i < ret.length && ret.length < maxSteps; i++) {
        let prev = ret[i - 1];
        let cur = ret[i];
        let p = (cur.p + prev.p) / 2;
        let color = colorRange(p);
        maxDelta = Math.max(maxDelta, deltaE(color, prev.color), deltaE(color, cur.color));
        ret.splice(i, 0, {
          p,
          color: colorRange(p)
        });
        i++;
      }
    }
  }
  ret = ret.map(a => a.color);
  return ret;
}

/**
 * Creates a function that accepts a number and returns a color.
 * For numbers in the range 0 to 1, the function interpolates;
 * for numbers outside that range, the function extrapolates
 * (and thus may not return the results you expect)
 * @overload
 * @param {Range} range
 * @param {RangeOptions} [options]
 * @returns {Range}
 */
/**
 * @overload
 * @param {ColorTypes} color1
 * @param {ColorTypes} color2
 * @param {RangeOptions & Record<string, any>} [options]
 * @returns {Range}
 */
function range(color1, color2, options = {}) {
  if (isRange(color1)) {
    // Tweaking existing range
    let [r, options] = [color1, color2];
    return range(...r.rangeArgs.colors, {
      ...r.rangeArgs.options,
      ...options
    });
  }
  let {
    space,
    outputSpace,
    progression,
    premultiplied
  } = options;
  color1 = getColor(color1);
  color2 = getColor(color2);

  // Make sure we're working on copies of these colors
  color1 = clone(color1);
  color2 = clone(color2);
  let rangeArgs = {
    colors: [color1, color2],
    options
  };
  if (space) {
    space = ColorSpace.get(space);
  } else {
    space = ColorSpace.registry[defaults.interpolationSpace] || color1.space;
  }
  outputSpace = outputSpace ? ColorSpace.get(outputSpace) : space;
  color1 = to(color1, space);
  color2 = to(color2, space);

  // Gamut map to avoid areas of flat color
  color1 = toGamut(color1);
  color2 = toGamut(color2);

  // Handle hue interpolation
  // See https://github.com/w3c/csswg-drafts/issues/4735#issuecomment-635741840
  if (space.coords.h && space.coords.h.type === "angle") {
    let arc = options.hue = options.hue || "shorter";
    let /** @type {Ref} */hue = [space, "h"];
    let [θ1, θ2] = [get(color1, hue), get(color2, hue)];
    // Undefined hues must be evaluated before hue fix-up to properly
    // calculate hue arcs between undefined and defined hues.
    // See https://github.com/w3c/csswg-drafts/issues/9436#issuecomment-1746957545
    if (isNone(θ1) && !isNone(θ2)) {
      θ1 = θ2;
    } else if (isNone(θ2) && !isNone(θ1)) {
      θ2 = θ1;
    }
    [θ1, θ2] = adjust(arc, [θ1, θ2]);
    set(color1, hue, θ1);
    set(color2, hue, θ2);
  }
  if (premultiplied) {
    // not coping with polar spaces yet
    color1.coords = /** @type {[number, number, number]} */
    color1.coords.map(c => c * color1.alpha);
    color2.coords = /** @type {[number, number, number]} */
    color2.coords.map(c => c * color2.alpha);
  }
  return Object.assign(p => {
    p = progression ? progression(p) : p;
    let coords = color1.coords.map((start, i) => {
      let end = color2.coords[i];
      return interpolate(start, end, p);
    });
    let alpha = interpolate(color1.alpha, color2.alpha, p);
    let ret = {
      space,
      coords,
      alpha
    };
    if (premultiplied) {
      // undo premultiplication
      ret.coords = ret.coords.map(c => c / alpha);
    }
    if (outputSpace !== space) {
      ret = to(ret, outputSpace);
    }
    return ret;
  }, {
    rangeArgs
  });
}

/**
 * @param {any} val
 * @returns {val is Range}
 */
function isRange(val) {
  return type(val) === "function" && !!val.rangeArgs;
}
defaults.interpolationSpace = "lab";

var HSL = new ColorSpace({
  id: "hsl",
  name: "HSL",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: sRGB,
  rgbGamut: sRGB,
  // Adapted from https://drafts.csswg.org/css-color-4/better-rgbToHsl.js
  fromBase: rgb => {
    let max = Math.max(...rgb);
    let min = Math.min(...rgb);
    let [r, g, b] = rgb;
    let [h, s, l] = [null, 0, (min + max) / 2];
    let d = max - min;
    if (d !== 0) {
      s = l === 0 || l === 1 ? 0 : (max - l) / Math.min(l, 1 - l);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
      }
      h = h * 60;
    }

    // Very out of gamut colors can produce negative saturation
    // If so, just rotate the hue by 180 and use a positive saturation
    // see https://github.com/w3c/csswg-drafts/issues/9222
    if (s < 0) {
      h += 180;
      s = Math.abs(s);
    }
    if (h >= 360) {
      h -= 360;
    }
    return [h, s * 100, l * 100];
  },
  // Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
  toBase: hsl => {
    let [h, s, l] = hsl;
    h = h % 360;
    if (h < 0) {
      h += 360;
    }
    s /= 100;
    l /= 100;
    function f(n) {
      let k = (n + h / 30) % 12;
      let a = s * Math.min(l, 1 - l);
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }
    return [f(0), f(8), f(4)];
  },
  formats: {
    hsl: {
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    },
    hsla: {
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"],
      commas: true,
      alpha: true
    }
  }
});

var hslP3 = new ColorSpace({
  id: "hsl-p3",
  cssId: "--hsl-p3",
  name: "HSL P3",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: P3,
  rgbGamut: P3,
  fromBase: HSL.fromBase,
  toBase: HSL.toBase
});

var hslRec2020 = new ColorSpace({
  id: "hsl-rec2020",
  cssId: "--hsl-rec2020",
  name: "HSL Rec.2020",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: REC2020,
  rgbGamut: REC2020,
  fromBase: HSL.fromBase,
  toBase: HSL.toBase
});

// Note that, like HSL, calculations are done directly on
// gamma-corrected sRGB values rather than linearising them first.

var HSV = new ColorSpace({
  id: "hsv",
  name: "HSV",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    v: {
      range: [0, 100],
      name: "Value"
    }
  },
  base: sRGB,
  rgbGamut: sRGB,
  // https://en.wikipedia.org/wiki/HSL_and_HSV#Formal_derivation
  fromBase(rgb) {
    let max = Math.max(...rgb);
    let min = Math.min(...rgb);
    let [r, g, b] = rgb;
    let [h, s, v] = [null, 0, max];
    let d = max - min;
    if (d !== 0) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
      }
      h = h * 60;
    }
    if (v) {
      s = d / v;
    }
    if (h >= 360) {
      h -= 360;
    }
    return [h, s * 100, v * 100];
  },
  // Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative
  toBase(hsv) {
    let [h, s, v] = hsv;
    h = h % 360;
    if (h < 0) {
      h += 360;
    }
    s /= 100;
    v /= 100;
    function f(n) {
      let k = (n + h / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    }
    return [f(5), f(3), f(1)];
  },
  formats: {
    color: {
      id: "--hsv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});

// The Hue, Whiteness Blackness (HWB) colorspace
// See https://drafts.csswg.org/css-color-4/#the-hwb-notation
// Note that, like HSL, calculations are done directly on
// gamma-corrected sRGB values rather than linearising them first.

var hwb = new ColorSpace({
  id: "hwb",
  name: "HWB",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    w: {
      range: [0, 100],
      name: "Whiteness"
    },
    b: {
      range: [0, 100],
      name: "Blackness"
    }
  },
  base: HSV,
  rgbGamut: sRGB,
  fromBase(hsv) {
    let [h, s, v] = hsv;
    return [h, v * (100 - s) / 100, 100 - v];
  },
  toBase(hwb) {
    let [h, w, b] = hwb;

    // Now convert percentages to [0..1]
    w /= 100;
    b /= 100;

    // Achromatic check (white plus black >= 1)
    let sum = w + b;
    if (sum >= 1) {
      let gray = w / sum;
      return [h, 0, gray * 100];
    }
    let v = 1 - b;
    let s = v === 0 ? 0 : 1 - w / v;
    return [h, s * 100, v * 100];
  },
  formats: {
    hwb: {
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});

/** @import { Matrix3x3 } from "../types.js" */

// convert an array of linear-light a98-rgb values to CIE XYZ
// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
// has greater numerical precision than section 4.3.5.3 of
// https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf
// but the values below were calculated from first principles
// from the chromaticity coordinates of R G B W

/** @type {Matrix3x3} */
// prettier-ignore
const toXYZ_M$2 = [[0.5766690429101305, 0.1855582379065463, 0.1882286462349947], [0.29734497525053605, 0.6273635662554661, 0.07529145849399788], [0.02703136138641234, 0.07068885253582723, 0.9913375368376388]];

/** @type {Matrix3x3} */
// prettier-ignore
const fromXYZ_M$2 = [[2.0415879038107465, -0.5650069742788596, -0.34473135077832956], [-0.9692436362808795, 1.8759675015077202, 0.04155505740717557], [0.013444280632031142, -0.11836239223101838, 1.0151749943912054]];
var A98Linear = new RGBColorSpace({
  id: "a98rgb-linear",
  cssId: "--a98-rgb-linear",
  name: "Linear Adobe® 98 RGB compatible",
  white: "D65",
  toXYZ_M: toXYZ_M$2,
  fromXYZ_M: fromXYZ_M$2
});

var a98rgb = new RGBColorSpace({
  id: "a98rgb",
  cssId: "a98-rgb",
  name: "Adobe® 98 RGB compatible",
  base: A98Linear,
  linearGamut: A98Linear,
  toBase: RGB => RGB.map(val => Math.pow(Math.abs(val), 563 / 256) * Math.sign(val)),
  fromBase: RGB => RGB.map(val => Math.pow(Math.abs(val), 256 / 563) * Math.sign(val))
});

/** @import { Matrix3x3 } from "../types.js" */

// convert an array of  prophoto-rgb values to CIE XYZ
// using  D50 (so no chromatic adaptation needed afterwards)
// matrix cannot be expressed in rational form, but is calculated to 64 bit accuracy
// see https://github.com/w3c/csswg-drafts/issues/7675
/** @type {Matrix3x3} */
// prettier-ignore
const toXYZ_M$1 = [[0.79776664490064230, 0.13518129740053308, 0.03134773412839220], [0.28807482881940130, 0.71183523424187300, 0.00008993693872564], [0.00000000000000000, 0.00000000000000000, 0.82510460251046020]];

/** @type {Matrix3x3} */
// prettier-ignore
const fromXYZ_M$1 = [[1.34578688164715830, -0.25557208737979464, -0.05110186497554526], [-0.54463070512490190, 1.50824774284514680, 0.02052744743642139], [0.00000000000000000, 0.00000000000000000, 1.21196754563894520]];
var ProPhotoLinear = new RGBColorSpace({
  id: "prophoto-linear",
  cssId: "--prophoto-rgb-linear",
  name: "Linear ProPhoto",
  white: "D50",
  base: XYZ_D50,
  toXYZ_M: toXYZ_M$1,
  fromXYZ_M: fromXYZ_M$1
});

const Et = 1 / 512;
const Et2 = 16 / 512;
var prophoto = new RGBColorSpace({
  id: "prophoto",
  cssId: "prophoto-rgb",
  name: "ProPhoto",
  base: ProPhotoLinear,
  linearGamut: ProPhotoLinear,
  toBase(RGB) {
    // Transfer curve is gamma 1.8 with a small linear portion
    return RGB.map(v => {
      let sign = v < 0 ? -1 : 1;
      let abs = v * sign;
      if (abs < Et2) {
        return v / 16;
      }
      return sign * abs ** 1.8;
    });
  },
  fromBase(RGB) {
    return RGB.map(v => {
      let sign = v < 0 ? -1 : 1;
      let abs = v * sign;
      if (abs >= Et) {
        return sign * abs ** (1 / 1.8);
      }
      return 16 * v;
    });
  }
});

// import sRGB from "./srgb.js";

const α = 1.09929682680944;
const β = 0.018053968510807;
var rec2020Oetf = new RGBColorSpace({
  id: "--rec2020-oetf",
  name: "REC.2020_Scene_Referred",
  base: REC_2020_Linear,
  linearGamut: REC_2020_Linear,
  referred: "scene",
  // Non-linear transfer function from Rec. ITU-R BT.2020-2 table 4
  toBase(RGB) {
    return RGB.map(function (val) {
      let sign = val < 0 ? -1 : 1;
      let abs = val * sign;
      if (abs < β * 4.5) {
        return val / 4.5;
      }
      return sign * Math.pow((abs + α - 1) / α, 1 / 0.45);
    });
  },
  fromBase(RGB) {
    return RGB.map(function (val) {
      let sign = val < 0 ? -1 : 1;
      let abs = val * sign;
      if (abs >= β) {
        return sign * (α * Math.pow(abs, 0.45) - (α - 1));
      }
      return 4.5 * val;
    });
  }
});

var oklchP3 = new ColorSpace({
  id: "oklch-p3",
  name: "OKLCh P3",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    c: {
      range: [0, 1],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  white: "D65",
  base: OKLCH,
  toBase([l, c, h]) {
    if (![l, c, h].some(isNone)) {
      c *= maxChroma(l, h, {
        space: OKLCH,
        gamut: "p3"
      });
    }
    return [l, c, h];
  },
  fromBase([l, c, h]) {
    if (![l, c, h].some(isNone)) {
      let cMax = maxChroma(l, h, {
        space: OKLCH,
        gamut: "p3"
      });
      c = cMax ? c / cMax : 0;
    }
    return [l, c, h];
  },
  formats: {
    color: {
      id: "--oklch-p3",
      coords: ["<percentage> | <number>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});

/** @import { Matrix3x3, Vector3 } from "../types.js" */

// Type re-exports
/** @typedef {import("../types.js").OKCoeff} OKCoeff */

const tau = 2 * Math.PI;

/** @type {Matrix3x3} */
// prettier-ignore
const toSRGBLinear = [[4.0767416360759583, -3.3077115392580629, 0.2309699031821043], [-1.2684379732850315, 2.6097573492876882, -0.3413193760026570], [-0.0041960761386756, -0.7034186179359362, 1.7076146940746117]];

/** @type {OKCoeff} */
const RGBCoeff = [
// Red
[
// Limit
[-1.8817031, -0.80936501],
// `Kn` coefficients
[1.19086277, 1.76576728, 0.59662641, 0.75515197, 0.56771245]],
// Green
[
// Limit
[1.8144408, -1.19445267],
// `Kn` coefficients
[0.73956515, -0.45954404, 0.08285427, 0.12541073, -0.14503204]],
// Blue
[
// Limit
[0.13110758, 1.81333971],
// `Kn` coefficients
[1.35733652, -0.00915799, -1.1513021, -0.50559606, 0.00692167]]];
const floatMax = Number.MAX_VALUE;
const K1 = 0.206;
const K2 = 0.03;
const K3 = (1.0 + K1) / (1.0 + K2);
function vdot(a, b) {
  // Dot two vectors

  let l = a.length;
  if (l !== b.length) {
    throw new Error(`Vectors of size ${l} and ${b.length} are not aligned`);
  }
  let s = 0.0;
  a.forEach((c, i) => {
    s += c * b[i];
  });
  return s;
}

/**
 * Toe function for L_r
 * @param {number} x
 */
function toe(x) {
  return 0.5 * (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));
}

/**
 * Inverse toe function for L_r
 * @param {number} x
 */
function toeInv(x) {
  return (x ** 2 + K1 * x) / (K3 * (x + K2));
}

/**
 * @param {readonly [number, number]} cusp
 * @returns {[number, number]}
 */
function toSt(cusp) {
  // To ST.

  let [l, c] = cusp;
  return [c / l, c / (1 - l)];
}
function getStMid(a, b) {
  // Returns a smooth approximation of the location of the cusp.
  //
  // This polynomial was created by an optimization process.
  // It has been designed so that S_mid < S_max and T_mid < T_max.

  // prettier-ignore
  let s = 0.11516993 + 1.0 / (7.44778970 + 4.15901240 * b + a * (-2.19557347 + 1.75198401 * b + a * (-2.13704948 - 10.02301043 * b + a * (-4.24894561 + 5.38770819 * b + 4.69891013 * a))));

  // prettier-ignore
  let t = 0.11239642 + 1.0 / (1.61320320 - 0.68124379 * b + a * (0.40370612 + 0.90148123 * b + a * (-0.27087943 + 0.61223990 * b + a * (0.00299215 - 0.45399568 * b - 0.14661872 * a))));
  return [s, t];
}

/**
 * @param {Vector3} lab
 * @param {Matrix3x3} lmsToRgb
 */
function oklabToLinearRGB(lab, lmsToRgb) {
  // Convert from Oklab to linear RGB.
  //
  // Can be any gamut as long as `lmsToRgb` is a matrix
  // that transform the LMS values to the linear RGB space.

  let lms = multiply_v3_m3x3(lab, LabtoLMS_M);
  lms[0] = lms[0] ** 3;
  lms[1] = lms[1] ** 3;
  lms[2] = lms[2] ** 3;
  return multiply_v3_m3x3(lms, lmsToRgb, lms);
}

/**
 * @param {number} a
 * @param {number} b
 * @param {Matrix3x3} lmsToRgb
 * @param {OKCoeff} okCoeff
 * @returns {[number, number]}
 * @todo Could probably make these types more specific/better-documented if desired
 */
function findCusp(a, b, lmsToRgb, okCoeff) {
  // Finds L_cusp and C_cusp for a given hue.
  //
  // `a` and `b` must be normalized so `a^2 + b^2 == 1`.

  // First, find the maximum saturation (saturation `S = C/L`)
  let sCusp = computeMaxSaturation(a, b, lmsToRgb, okCoeff);

  // Convert to linear RGB to find the first point where at least one of r, g or b >= 1:
  let rgb = oklabToLinearRGB([1, sCusp * a, sCusp * b], lmsToRgb);
  let lCusp = spow(1.0 / Math.max(...rgb), 1 / 3);
  let cCusp = lCusp * sCusp;
  return [lCusp, cCusp];
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} l1
 * @param {number} c1
 * @param {number} l0
 * @param {Matrix3x3} lmsToRgb
 * @param {OKCoeff} okCoeff
 * @param {[number, number]} cusp
 * @returns {Number}
 * @todo Could probably make these types more specific/better-documented if desired
 */
function findGamutIntersection(a, b, l1, c1, l0, lmsToRgb, okCoeff, cusp) {
  // Finds intersection of the line.
  //
  // Defined by the following:
  //
  // ```
  // L = L0 * (1 - t) + t * L1
  // C = t * C1
  // ```
  //
  // `a` and `b` must be normalized so `a^2 + b^2 == 1`.

  let t;
  if (cusp === undefined) {
    cusp = findCusp(a, b, lmsToRgb, okCoeff);
  }

  // Find the intersection for upper and lower half separately
  if ((l1 - l0) * cusp[1] - (cusp[0] - l0) * c1 <= 0.0) {
    // Lower half
    t = cusp[1] * l0 / (c1 * cusp[0] + cusp[1] * (l0 - l1));
  } else {
    // Upper half

    // First intersect with triangle
    t = cusp[1] * (l0 - 1.0) / (c1 * (cusp[0] - 1.0) + cusp[1] * (l0 - l1));

    // Then one step Halley's method
    let dl = l1 - l0;
    let dc = c1;
    let kl = vdot(LabtoLMS_M[0].slice(1), [a, b]);
    let km = vdot(LabtoLMS_M[1].slice(1), [a, b]);
    let ks = vdot(LabtoLMS_M[2].slice(1), [a, b]);
    let ldt_ = dl + dc * kl;
    let mdt_ = dl + dc * km;
    let sdt_ = dl + dc * ks;

    // If higher accuracy is required, 2 or 3 iterations of the following block can be used:
    let L = l0 * (1.0 - t) + t * l1;
    let C = t * c1;
    let l_ = L + C * kl;
    let m_ = L + C * km;
    let s_ = L + C * ks;
    let l = l_ ** 3;
    let m = m_ ** 3;
    let s = s_ ** 3;
    let ldt = 3 * ldt_ * l_ ** 2;
    let mdt = 3 * mdt_ * m_ ** 2;
    let sdt = 3 * sdt_ * s_ ** 2;
    let ldt2 = 6 * ldt_ ** 2 * l_;
    let mdt2 = 6 * mdt_ ** 2 * m_;
    let sdt2 = 6 * sdt_ ** 2 * s_;
    let r_ = vdot(lmsToRgb[0], [l, m, s]) - 1;
    let r1 = vdot(lmsToRgb[0], [ldt, mdt, sdt]);
    let r2 = vdot(lmsToRgb[0], [ldt2, mdt2, sdt2]);
    let ur = r1 / (r1 * r1 - 0.5 * r_ * r2);
    let tr = -r_ * ur;
    let g_ = vdot(lmsToRgb[1], [l, m, s]) - 1;
    let g1 = vdot(lmsToRgb[1], [ldt, mdt, sdt]);
    let g2 = vdot(lmsToRgb[1], [ldt2, mdt2, sdt2]);
    let ug = g1 / (g1 * g1 - 0.5 * g_ * g2);
    let tg = -g_ * ug;
    let b_ = vdot(lmsToRgb[2], [l, m, s]) - 1;
    let b1 = vdot(lmsToRgb[2], [ldt, mdt, sdt]);
    let b2 = vdot(lmsToRgb[2], [ldt2, mdt2, sdt2]);
    let ub = b1 / (b1 * b1 - 0.5 * b_ * b2);
    let tb = -b_ * ub;
    tr = ur >= 0.0 ? tr : floatMax;
    tg = ug >= 0.0 ? tg : floatMax;
    tb = ub >= 0.0 ? tb : floatMax;
    t += Math.min(tr, Math.min(tg, tb));
  }
  return t;
}
function getCs(lab, lmsToRgb, okCoeff) {
  // Get Cs

  let [l, a, b] = lab;
  let cusp = findCusp(a, b, lmsToRgb, okCoeff);
  let cMax = findGamutIntersection(a, b, l, 1, l, lmsToRgb, okCoeff, cusp);
  let stMax = toSt(cusp);

  // Scale factor to compensate for the curved part of gamut shape:
  let k = cMax / Math.min(l * stMax[0], (1 - l) * stMax[1]);
  let stMid = getStMid(a, b);

  // Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
  let ca = l * stMid[0];
  let cb = (1.0 - l) * stMid[1];
  let cMid = 0.9 * k * Math.sqrt(Math.sqrt(1.0 / (1.0 / ca ** 4 + 1.0 / cb ** 4)));

  // For `C_0`, the shape is independent of hue, so `ST` are constant.
  // Values picked to roughly be the average values of `ST`.
  ca = l * 0.4;
  cb = (1.0 - l) * 0.8;

  // Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
  let c0 = Math.sqrt(1.0 / (1.0 / ca ** 2 + 1.0 / cb ** 2));
  return [c0, cMid, cMax];
}
function computeMaxSaturation(a, b, lmsToRgb, okCoeff) {
  // Finds the maximum saturation possible for a given hue that fits in RGB.
  //
  // Saturation here is defined as `S = C/L`.
  // `a` and `b` must be normalized so `a^2 + b^2 == 1`.

  // Max saturation will be when one of r, g or b goes below zero.

  // Select different coefficients depending on which component goes below zero first.

  let k0, k1, k2, k3, k4, wl, wm, ws;
  if (vdot(okCoeff[0][0], [a, b]) > 1) {
    // Red component
    [k0, k1, k2, k3, k4] = okCoeff[0][1];
    [wl, wm, ws] = lmsToRgb[0];
  } else if (vdot(okCoeff[1][0], [a, b]) > 1) {
    // Green component
    [k0, k1, k2, k3, k4] = okCoeff[1][1];
    [wl, wm, ws] = lmsToRgb[1];
  } else {
    // Blue component
    [k0, k1, k2, k3, k4] = okCoeff[2][1];
    [wl, wm, ws] = lmsToRgb[2];
  }

  // Approximate max saturation using a polynomial:
  let sat = k0 + k1 * a + k2 * b + k3 * a ** 2 + k4 * a * b;

  // Do one step Halley's method to get closer.
  // This gives an error less than 10e6, except for some blue hues where the `dS/dh` is close to infinite.
  // This should be sufficient for most applications, otherwise do two/three steps.

  let kl = vdot(LabtoLMS_M[0].slice(1), [a, b]);
  let km = vdot(LabtoLMS_M[1].slice(1), [a, b]);
  let ks = vdot(LabtoLMS_M[2].slice(1), [a, b]);
  let l_ = 1.0 + sat * kl;
  let m_ = 1.0 + sat * km;
  let s_ = 1.0 + sat * ks;
  let l = l_ ** 3;
  let m = m_ ** 3;
  let s = s_ ** 3;
  let lds = 3.0 * kl * l_ ** 2;
  let mds = 3.0 * km * m_ ** 2;
  let sds = 3.0 * ks * s_ ** 2;
  let lds2 = 6.0 * kl ** 2 * l_;
  let mds2 = 6.0 * km ** 2 * m_;
  let sds2 = 6.0 * ks ** 2 * s_;
  let f = wl * l + wm * m + ws * s;
  let f1 = wl * lds + wm * mds + ws * sds;
  let f2 = wl * lds2 + wm * mds2 + ws * sds2;
  sat = sat - f * f1 / (f1 ** 2 - 0.5 * f * f2);
  return sat;
}
function okhslToOklab(hsl, lmsToRgb, okCoeff) {
  // Convert Okhsl to Oklab.

  let [h, s, l] = hsl;
  let L = toeInv(l);
  let a = null;
  let b = null;
  h = constrain(h) / 360.0;
  if (L !== 0.0 && L !== 1.0 && s !== 0) {
    let a_ = Math.cos(tau * h);
    let b_ = Math.sin(tau * h);
    let [c0, cMid, cMax] = getCs([L, a_, b_], lmsToRgb, okCoeff);

    // Interpolate the three values for C so that:
    // ```
    // At s=0: dC/ds = C_0, C=0
    // At s=0.8: C=C_mid
    // At s=1.0: C=C_max
    // ```

    let mid = 0.8;
    let midInv = 1.25;
    let t, k0, k1, k2;
    if (s < mid) {
      t = midInv * s;
      k0 = 0.0;
      k1 = mid * c0;
      k2 = 1.0 - k1 / cMid;
    } else {
      t = 5 * (s - 0.8);
      k0 = cMid;
      k1 = 0.2 * cMid ** 2 * 1.25 ** 2 / c0;
      k2 = 1.0 - k1 / (cMax - cMid);
    }
    let c = k0 + t * k1 / (1.0 - k2 * t);
    a = c * a_;
    b = c * b_;
  }
  return [L, a, b];
}
function oklabToOkhsl(lab, lmsToRgb, okCoeff) {
  // Oklab to Okhsl.

  // Epsilon for lightness should approach close to 32 bit lightness
  // Epsilon for saturation just needs to be sufficiently close when denoting achromatic
  let εL = 1e-7;
  let εS = 1e-4;
  let L = lab[0];
  let s = 0.0;
  let l = toe(L);
  let c = Math.sqrt(lab[1] ** 2 + lab[2] ** 2);
  let h = 0.5 + Math.atan2(-lab[2], -lab[1]) / tau;
  if (l !== 0.0 && l !== 1.0 && c !== 0) {
    let a_ = lab[1] / c;
    let b_ = lab[2] / c;
    let [c0, cMid, cMax] = getCs([L, a_, b_], lmsToRgb, okCoeff);
    let mid = 0.8;
    let midInv = 1.25;
    let k0, k1, k2, t;
    if (c < cMid) {
      k1 = mid * c0;
      k2 = 1.0 - k1 / cMid;
      t = c / (k1 + k2 * c);
      s = t * mid;
    } else {
      k0 = cMid;
      k1 = 0.2 * cMid ** 2 * midInv ** 2 / c0;
      k2 = 1.0 - k1 / (cMax - cMid);
      t = (c - k0) / (k1 + k2 * (c - k0));
      s = mid + 0.2 * t;
    }
  }
  const achromatic = Math.abs(s) < εS;
  if (achromatic || l === 0.0 || Math.abs(1 - l) < εL) {
    h = null;
    // Due to floating point imprecision near lightness of 1, we can end up
    // with really high around white, this is to provide consistency as
    // saturation can be really high for white due this imprecision.
    if (!achromatic) {
      s = 0.0;
    }
  } else {
    h = constrain(h * 360);
  }
  return [h, s, l];
}
const Okhsl = new ColorSpace({
  id: "okhsl",
  name: "Okhsl",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 1],
      name: "Saturation"
    },
    l: {
      range: [0, 1],
      name: "Lightness"
    }
  },
  base: Oklab,
  gamutSpace: "self",
  // Convert Oklab to Okhsl
  fromBase(lab) {
    return oklabToOkhsl(lab, toSRGBLinear, RGBCoeff);
  },
  // Convert Okhsl to Oklab
  toBase(hsl) {
    return okhslToOklab(hsl, toSRGBLinear, RGBCoeff);
  },
  formats: {
    color: {
      id: "--okhsl",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
Okhsl.rgbGamut = new RGBColorSpace({
  id: "okhsl-prism",
  cssId: "--okhsl-prism",
  name: "Okhsl Prism",
  base: Okhsl,
  fromBase(hsl) {
    return HSL.toBase([hsl[0], hsl[1] * 100, hsl[2] * 100]);
  },
  toBase(rgb) {
    const hsl = HSL.fromBase(rgb);
    hsl[1] /= 100;
    hsl[2] /= 100;
    return hsl;
  }
});

var OKLrab = new ColorSpace({
  id: "oklrab",
  name: "Oklrab",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    a: {
      refRange: [-0.4, 0.4]
    },
    b: {
      refRange: [-0.4, 0.4]
    }
  },
  // Note that XYZ is relative to D65
  white: "D65",
  base: Oklab,
  fromBase(oklab) {
    return [toe(oklab[0]), oklab[1], oklab[2]];
  },
  toBase(oklrab) {
    return [toeInv(oklrab[0]), oklrab[1], oklrab[2]];
  },
  formats: {
    color: {
      coords: ["<percentage> | <number>", "<number> | <percentage>[-1,1]", "<number> | <percentage>[-1,1]"]
    }
  }
});

var oklrch = new ColorSpace({
  id: "oklrch",
  name: "Oklrch",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    c: {
      refRange: [0, 0.4],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  white: "D65",
  base: OKLrab,
  fromBase: lch.fromBase,
  toBase: lch.toBase,
  formats: {
    color: {
      coords: ["<percentage> | <number>", "<number> | <percentage>[0,1]", "<number> | <angle>"]
    }
  }
});

// Okhsv class.
//
// ---- License ----
//
// Copyright (c) 2021 Björn Ottosson
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/** @import { Coords, Matrix3x3, OKCoeff, Vector3 } from "../types.js" */

/**
 *
 * @param {Vector3} hsv
 * @param {Matrix3x3} lmsToRgb
 * @param {OKCoeff} okCoeff
 * @returns {Coords}
 */
function okhsvToOklab(hsv, lmsToRgb, okCoeff) {
  // Convert from Okhsv to Oklab."""

  let [h, s, v] = hsv;
  h = constrain(h) / 360.0;
  let l = toeInv(v);
  let a = null;
  let b = null;

  // Avoid processing gray or colors with undefined hues
  if (l !== 0.0 && s !== 0.0) {
    let a_ = Math.cos(tau * h);
    let b_ = Math.sin(tau * h);
    let cusp = findCusp(a_, b_, lmsToRgb, okCoeff);
    let [sMax, tMax] = toSt(cusp);
    let s0 = 0.5;
    let k = 1 - s0 / sMax;

    // first we compute L and V as if the gamut is a perfect triangle:

    // L, C when v==1:
    let lv = 1 - s * s0 / (s0 + tMax - tMax * k * s);
    let cv = s * tMax * s0 / (s0 + tMax - tMax * k * s);
    l = v * lv;
    let c = v * cv;

    // then we compensate for both toe and the curved top part of the triangle:
    let lvt = toeInv(lv);
    let cvt = cv * lvt / lv;
    let lNew = toeInv(l);
    c = c * lNew / l;
    l = lNew;

    // RGB scale
    let [rs, gs, bs] = oklabToLinearRGB([lvt, a_ * cvt, b_ * cvt], lmsToRgb);
    let scaleL = spow(1.0 / Math.max(Math.max(rs, gs), Math.max(bs, 0.0)), 1 / 3);
    l = l * scaleL;
    c = c * scaleL;
    a = c * a_;
    b = c * b_;
  }
  return [l, a, b];
}

/**
 *
 * @param {Vector3} lab
 * @param {Matrix3x3} lmsToRgb
 * @param {OKCoeff} okCoeff
 * @returns {Coords}
 */
function oklabToOkhsv(lab, lmsToRgb, okCoeff) {
  // Oklab to Okhsv.

  // Epsilon for saturation just needs to be sufficiently close when denoting achromatic
  let ε = 1e-4;
  let l = lab[0];
  let s = 0.0;
  let v = toe(l);
  let c = Math.sqrt(lab[1] ** 2 + lab[2] ** 2);
  let h = 0.5 + Math.atan2(-lab[2], -lab[1]) / tau;
  if (l !== 0.0 && l !== 1 && c !== 0.0) {
    let a_ = lab[1] / c;
    let b_ = lab[2] / c;
    let cusp = findCusp(a_, b_, lmsToRgb, okCoeff);
    let [sMax, tMax] = toSt(cusp);
    let s0 = 0.5;
    let k = 1 - s0 / sMax;

    // first we find `L_v`, `C_v`, `L_vt` and `C_vt`
    let t = tMax / (c + l * tMax);
    let lv = t * l;
    let cv = t * c;
    let lvt = toeInv(lv);
    let cvt = cv * lvt / lv;

    // we can then use these to invert the step that compensates
    // for the toe and the curved top part of the triangle:
    let [rs, gs, bs] = oklabToLinearRGB([lvt, a_ * cvt, b_ * cvt], lmsToRgb);
    let scaleL = spow(1.0 / Math.max(Math.max(rs, gs), Math.max(bs, 0.0)), 1 / 3);
    l = l / scaleL;
    c = c / scaleL;
    c = c * toe(l) / l;
    l = toe(l);

    // we can now compute v and s:
    v = l / lv;
    s = (s0 + tMax) * cv / (tMax * s0 + tMax * k * cv);
  }
  if (Math.abs(s) < ε || v === 0.0) {
    h = null;
  } else {
    h = constrain(h * 360);
  }
  return [h, s, v];
}
const Okhsv = new ColorSpace({
  id: "okhsv",
  name: "Okhsv",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 1],
      name: "Saturation"
    },
    v: {
      range: [0, 1],
      name: "Value"
    }
  },
  base: Oklab,
  gamutSpace: "self",
  // Convert Oklab to Okhsl
  fromBase(lab) {
    return oklabToOkhsv(lab, toSRGBLinear, RGBCoeff);
  },
  // Convert Okhsl to Oklab
  toBase(hsl) {
    return okhsvToOklab(hsl, toSRGBLinear, RGBCoeff);
  },
  formats: {
    color: {
      id: "--okhsv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
Okhsv.rgbGamut = new RGBColorSpace({
  id: "okhsv-prism",
  cssId: "--okhsv-prism",
  name: "Okhsv Prism",
  base: Okhsv,
  fromBase(hsl) {
    return HSL.toBase([hsl[0], hsl[1] * 100, hsl[2] * 100]);
  },
  toBase(rgb) {
    const hsl = HSL.fromBase(rgb);
    hsl[1] /= 100;
    hsl[2] /= 100;
    return hsl;
  }
});

let white = WHITES.D65;
const ε$2 = 216 / 24389; // 6^3/29^3 == (24/116)^3
const κ$1 = 24389 / 27; // 29^3/3^3
const [U_PRIME_WHITE, V_PRIME_WHITE] = uv({
  space: XYZ_D65,
  coords: white
});
var Luv = new ColorSpace({
  id: "luv",
  name: "Luv",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    // Reference ranges from https://facelessuser.github.io/coloraide/colors/luv/
    u: {
      refRange: [-215, 215]
    },
    v: {
      refRange: [-215, 215]
    }
  },
  white: white,
  base: XYZ_D65,
  // Convert D65-adapted XYZ to Luv
  // https://en.wikipedia.org/wiki/CIELUV#The_forward_transformation
  fromBase(XYZ) {
    let xyz = /** @type {[number, number, number]} */[skipNone(XYZ[0]), skipNone(XYZ[1]), skipNone(XYZ[2])];
    let y = xyz[1];
    let [up, vp] = uv({
      space: XYZ_D65,
      coords: xyz
    });

    // Protect against XYZ of [0, 0, 0]
    if (!Number.isFinite(up) || !Number.isFinite(vp)) {
      return [0, 0, 0];
    }
    let L = y <= ε$2 ? κ$1 * y : 116 * Math.cbrt(y) - 16;
    return [L, 13 * L * (up - U_PRIME_WHITE), 13 * L * (vp - V_PRIME_WHITE)];
  },
  // Convert Luv to D65-adapted XYZ
  // https://en.wikipedia.org/wiki/CIELUV#The_reverse_transformation
  toBase(Luv) {
    let [L, u, v] = Luv;

    // Protect against division by zero and none Lightness
    if (L === 0 || isNone(L)) {
      return [0, 0, 0];
    }
    u = skipNone(u);
    v = skipNone(v);
    let up = u / (13 * L) + U_PRIME_WHITE;
    let vp = v / (13 * L) + V_PRIME_WHITE;
    let y = L <= 8 ? L / κ$1 : Math.pow((L + 16) / 116, 3);
    return [y * (9 * up / (4 * vp)), y, y * ((12 - 3 * up - 20 * vp) / (4 * vp))];
  },
  formats: {
    color: {
      id: "--luv",
      coords: ["<number> | <percentage>", "<number> | <percentage>", "<number> | <percentage>"]
    }
  }
});

var LCHuv = new ColorSpace({
  id: "lchuv",
  name: "LChuv",
  coords: {
    l: {
      refRange: [0, 100],
      name: "Lightness"
    },
    c: {
      refRange: [0, 220],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  base: Luv,
  fromBase: lch.fromBase,
  toBase: lch.toBase,
  formats: {
    color: {
      id: "--lchuv",
      coords: ["<number> | <percentage>", "<number> | <percentage>", "<number> | <angle>"]
    }
  }
});

/*
Adapted from: https://github.com/hsluv/hsluv-javascript/blob/14b49e6cf9a9137916096b8487a5372626b57ba4/src/hsluv.ts

Copyright (c) 2012-2022 Alexei Boronine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const ε$1 = 216 / 24389; // 6^3/29^3 == (24/116)^3
const κ = 24389 / 27; // 29^3/3^3

const m_r0 = fromXYZ_M$3[0][0];
const m_r1 = fromXYZ_M$3[0][1];
const m_r2 = fromXYZ_M$3[0][2];
const m_g0 = fromXYZ_M$3[1][0];
const m_g1 = fromXYZ_M$3[1][1];
const m_g2 = fromXYZ_M$3[1][2];
const m_b0 = fromXYZ_M$3[2][0];
const m_b1 = fromXYZ_M$3[2][1];
const m_b2 = fromXYZ_M$3[2][2];
function distanceFromOriginAngle(slope, intercept, angle) {
  const d = intercept / (Math.sin(angle) - slope * Math.cos(angle));
  return d < 0 ? Infinity : d;
}

/**
 * @param {number} l
 */
function calculateBoundingLines(l) {
  const sub1 = Math.pow(l + 16, 3) / 1560896;
  const sub2 = sub1 > ε$1 ? sub1 : l / κ;
  const s1r = sub2 * (284517 * m_r0 - 94839 * m_r2);
  const s2r = sub2 * (838422 * m_r2 + 769860 * m_r1 + 731718 * m_r0);
  const s3r = sub2 * (632260 * m_r2 - 126452 * m_r1);
  const s1g = sub2 * (284517 * m_g0 - 94839 * m_g2);
  const s2g = sub2 * (838422 * m_g2 + 769860 * m_g1 + 731718 * m_g0);
  const s3g = sub2 * (632260 * m_g2 - 126452 * m_g1);
  const s1b = sub2 * (284517 * m_b0 - 94839 * m_b2);
  const s2b = sub2 * (838422 * m_b2 + 769860 * m_b1 + 731718 * m_b0);
  const s3b = sub2 * (632260 * m_b2 - 126452 * m_b1);
  return {
    r0s: s1r / s3r,
    r0i: s2r * l / s3r,
    r1s: s1r / (s3r + 126452),
    r1i: (s2r - 769860) * l / (s3r + 126452),
    g0s: s1g / s3g,
    g0i: s2g * l / s3g,
    g1s: s1g / (s3g + 126452),
    g1i: (s2g - 769860) * l / (s3g + 126452),
    b0s: s1b / s3b,
    b0i: s2b * l / s3b,
    b1s: s1b / (s3b + 126452),
    b1i: (s2b - 769860) * l / (s3b + 126452)
  };
}
function calcMaxChromaHsluv(lines, h) {
  const hueRad = h / 360 * Math.PI * 2;
  const r0 = distanceFromOriginAngle(lines.r0s, lines.r0i, hueRad);
  const r1 = distanceFromOriginAngle(lines.r1s, lines.r1i, hueRad);
  const g0 = distanceFromOriginAngle(lines.g0s, lines.g0i, hueRad);
  const g1 = distanceFromOriginAngle(lines.g1s, lines.g1i, hueRad);
  const b0 = distanceFromOriginAngle(lines.b0s, lines.b0i, hueRad);
  const b1 = distanceFromOriginAngle(lines.b1s, lines.b1i, hueRad);
  return Math.min(r0, r1, g0, g1, b0, b1);
}
var hsluv = new ColorSpace({
  id: "hsluv",
  name: "HSLuv",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: LCHuv,
  gamutSpace: sRGB,
  rgbGamut: sRGB,
  // Convert LCHuv to HSLuv
  fromBase(lch) {
    let [l, c, h] = [skipNone(lch[0]), skipNone(lch[1]), skipNone(lch[2])];
    let s;
    if (l > 99.9999999) {
      s = 0;
      l = 100;
    } else if (l < 0.00000001) {
      s = 0;
      l = 0;
    } else {
      let lines = calculateBoundingLines(l);
      let max = calcMaxChromaHsluv(lines, h);
      s = c / max * 100;
    }
    return [h, s, l];
  },
  // Convert HSLuv to LCHuv
  toBase(hsl) {
    let [h, s, l] = [skipNone(hsl[0]), skipNone(hsl[1]), skipNone(hsl[2])];
    let c;
    if (l > 99.9999999) {
      l = 100;
      c = 0;
    } else if (l < 0.00000001) {
      l = 0;
      c = 0;
    } else {
      let lines = calculateBoundingLines(l);
      let max = calcMaxChromaHsluv(lines, h);
      c = max / 100 * s;
    }
    return [l, c, h];
  },
  formats: {
    color: {
      id: "--hsluv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});

/*
Adapted from: https://github.com/hsluv/hsluv-javascript/blob/14b49e6cf9a9137916096b8487a5372626b57ba4/src/hsluv.ts

Copyright (c) 2012-2022 Alexei Boronine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


fromXYZ_M$3[0][0];
fromXYZ_M$3[0][1];
fromXYZ_M$3[0][2];
fromXYZ_M$3[1][0];
fromXYZ_M$3[1][1];
fromXYZ_M$3[1][2];
fromXYZ_M$3[2][0];
fromXYZ_M$3[2][1];
fromXYZ_M$3[2][2];
function distanceFromOrigin(slope, intercept) {
  return Math.abs(intercept) / Math.sqrt(Math.pow(slope, 2) + 1);
}
function calcMaxChromaHpluv(lines) {
  let r0 = distanceFromOrigin(lines.r0s, lines.r0i);
  let r1 = distanceFromOrigin(lines.r1s, lines.r1i);
  let g0 = distanceFromOrigin(lines.g0s, lines.g0i);
  let g1 = distanceFromOrigin(lines.g1s, lines.g1i);
  let b0 = distanceFromOrigin(lines.b0s, lines.b0i);
  let b1 = distanceFromOrigin(lines.b1s, lines.b1i);
  return Math.min(r0, r1, g0, g1, b0, b1);
}
const HPLuv = new ColorSpace({
  id: "hpluv",
  name: "HPLuv",
  coords: {
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    },
    s: {
      range: [0, 100],
      name: "Saturation"
    },
    l: {
      range: [0, 100],
      name: "Lightness"
    }
  },
  base: LCHuv,
  gamutSpace: "self",
  // Convert LCHuv to HPLuv
  fromBase(lch) {
    let [l, c, h] = [skipNone(lch[0]), skipNone(lch[1]), skipNone(lch[2])];
    let s;
    if (l > 99.9999999) {
      s = 0;
      l = 100;
    } else if (l < 0.00000001) {
      s = 0;
      l = 0;
    } else {
      let lines = calculateBoundingLines(l);
      let max = calcMaxChromaHpluv(lines);
      s = c / max * 100;
    }
    return [h, s, l];
  },
  // Convert HPLuv to LCHuv
  toBase(hsl) {
    let [h, s, l] = [skipNone(hsl[0]), skipNone(hsl[1]), skipNone(hsl[2])];
    let c;
    if (l > 99.9999999) {
      l = 100;
      c = 0;
    } else if (l < 0.00000001) {
      l = 0;
      c = 0;
    } else {
      let lines = calculateBoundingLines(l);
      let max = calcMaxChromaHpluv(lines);
      c = max / 100 * s;
    }
    return [l, c, h];
  },
  formats: {
    color: {
      id: "--hpluv",
      coords: ["<number> | <angle>", "<percentage> | <number>", "<percentage> | <number>"]
    }
  }
});
HPLuv.rgbGamut = new RGBColorSpace({
  id: "hpluv-prism",
  cssId: "--hpluv-prism",
  name: "HPLuv Prism",
  base: HPLuv,
  fromBase(hsl) {
    return HSL.toBase(hsl);
  },
  toBase(rgb) {
    return HSL.fromBase(rgb);
  }
});

/**
 * Helmlab GenSpace — generation-optimized color space for interpolation.
 *
 * Pipeline (v0.11.1, depressed cubic + chroma power + L-gated enrichment):
 *   XYZ → M1 → depcubic(α=0.021) → M2 → chroma_power(0.978) →
 *   PW_L → L-gated hue enrichment → Lab
 *
 * Optimized for perceptually uniform gradients, palette generation,
 * and color-mix. 59-8 vs OKLab in head-to-head benchmarks (83 metrics,
 * 3038 gradient pairs, sRGB/P3/Rec.2020). 360/360/360 cusps.
 *
 * Key properties:
 *   - Depressed cubic: y³ + αy = x, finite derivative at zero
 *   - Chroma power (0.978): improves gradient CV uniformity
 *   - L-gated hue enrichment: fixes blue→white purple shift
 *   - Structurally achromatic: a=b≈0 for all grays
 *
 * Note on blue-region gamut fold:
 *   All M1→f→M2 spaces (OKLab, IPT, HelmGen) exhibit a tiny non-contiguous
 *   gamut region near h≈260° in sRGB. This is a mathematical consequence of
 *   mixing LMS channels before applying a power-like transfer: the inverse
 *   creates a cubic polynomial that can have two positive roots in the blue
 *   region. OKLab has 46 such holes; HelmGen has 5, each ~0.001 chroma wide
 *   (sub-pixel, invisible). See: color.js#81, csswg-drafts#7071.
 *
 * Reference: arXiv:2602.23010
 * @see https://github.com/Grkmyldz148/helmlab
 */

/** @import { Matrix3x3 } from "../types.js" */

// ── Depressed cubic parameter ──────────────────────────────────────
const ALPHA = 0.021;
const S = Math.sqrt(ALPHA / 3);
const S3 = S * S * S;

// ── Chroma power ───────────────────────────────────────────────────
const CP = 0.978;

// ── L-gated hue enrichment parameters ──────────────────────────────
const ENR_AMP = 0.058;
const ENR_CENTER = 264.5 * Math.PI / 180; // radians
const ENR_SIGMA = 0.7;
const ENR_LLO = 0.37;
const ENR_LHI = 1.0;

// ── Core matrices (v0.11.1) ────────────────────────────────────────

/** @type {Matrix3x3} */
// prettier-ignore
// M1 = M1_orig @ CAT_TO_HELM (Bradford CAT baked in: Color.js D65 → Helmlab D65 → LMS)
const M1 = [[8.1548321559412884e-01, 3.6033406153856506e-01, -1.2434135574228214e-01], [3.3010083527450780e-02, 9.2928650570661686e-01, 3.6121927165754429e-02], [4.8188273564568611e-02, 2.6428415753384238e-01, 6.3349717841955344e-01]];
/** @type {Matrix3x3} */
// prettier-ignore
const M1_INV = [[1.2325947975032656e+00, -5.5575902392875232e-01, 2.7362015347715829e-01], [-4.0801327874216024e-02, 1.1122288637386530e+00, -7.1427535864437813e-02], [-7.6738259283377658e-02, -4.2172784577108585e-01, 1.5875238558143416e+00]];

/** @type {Matrix3x3} */
// prettier-ignore
const M2 = [[0.21193779684470104, 0.7992121834263127, -0.00410075161564345], [2.4672018828033475, -2.9877348024830788, 0.520532919679731], [-0.11390787868068575, 1.3932982808117473, -1.279390402131062]];
/** @type {Matrix3x3} */
// prettier-ignore
const M2_INV = [[0.9930001151336143, 0.32599327253052285, 0.12945085631713921], [0.9930001151336139, -0.08708353111074627, -0.03861361743004929], [0.9930001151336136, -0.12386097008215022, -0.8351991365871061]];

// ── Piecewise-linear L correction (21 breakpoints, v0.11.1) ───────
// prettier-ignore
const PW_L_IN = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
// prettier-ignore
const PW_L_OUT = [0, 0.009494013522189627, 0.02564569838030986, 0.055259661658689105, 0.10574901531227408, 0.16055853320726027, 0.21405964892993756, 0.26786230508811226, 0.3220435246104499, 0.3739052098520243, 0.43020997780918835, 0.4835465162128873, 0.5399824670411353, 0.5956710081330342, 0.6542161666450478, 0.7115380216519989, 0.7702762412711669, 0.8293313467712837, 0.889406386197059, 0.9462829573474728, 1.0];
const PW_N = PW_L_IN.length;

// ── Depressed cubic: y³ + αy = x ──────────────────────────────────

function depcubicFwd(x) {
  let t = x / (2 * S3);
  let y = 2 * S * Math.sinh(Math.asinh(t) / 3);
  // Halley refinement
  let f = y * y * y + ALPHA * y - x;
  let fp = 3 * y * y + ALPHA;
  let fpp = 6 * y;
  let denom = 2 * fp * fp - f * fpp;
  if (Math.abs(denom) > 1e-30) {
    y -= 2 * f * fp / denom;
  }
  return y;
}
function depcubicInv(y) {
  return y * y * y + ALPHA * y;
}

// ── L-gated hue enrichment ─────────────────────────────────────────

function enrichGate(L) {
  let t = Math.max(0, Math.min(1, (L - ENR_LLO) / (ENR_LHI - ENR_LLO)));
  return Math.sin(Math.PI * t) ** 2;
}
function enrichFwd(L, a, b) {
  let C = Math.sqrt(a * a + b * b);
  if (C < 1e-12) {
    return [a, b];
  }
  let gate = enrichGate(L);
  if (gate < 1e-12) {
    return [a, b];
  }
  let h = Math.atan2(b, a);
  let dh = h - ENR_CENTER;
  dh = dh - Math.round(dh / (2 * Math.PI)) * 2 * Math.PI;
  let gauss = Math.exp(-0.5 * (dh / ENR_SIGMA) ** 2);
  let hNew = h + ENR_AMP * gate * gauss;
  return [C * Math.cos(hNew), C * Math.sin(hNew)];
}
function enrichInv(L, a, b) {
  let C = Math.sqrt(a * a + b * b);
  if (C < 1e-12) {
    return [a, b];
  }
  let gate = enrichGate(L);
  if (gate < 1e-12) {
    return [a, b];
  }
  let hTarget = Math.atan2(b, a);
  let sig2 = ENR_SIGMA * ENR_SIGMA;
  let ag = ENR_AMP * gate;
  let h = hTarget;
  for (let i = 0; i < 8; i++) {
    let dh = h - ENR_CENTER;
    dh = dh - Math.round(dh / (2 * Math.PI)) * 2 * Math.PI;
    let gauss = Math.exp(-0.5 * dh * dh / sig2);
    let F = h + ag * gauss - hTarget;
    let Fp = 1 + ag * gauss * (-dh / sig2);
    let Fpp = ag * gauss * (-1 / sig2 + dh * dh / (sig2 * sig2));
    let den = 2 * Fp * Fp - F * Fpp;
    if (Math.abs(den) > 1e-30) {
      h -= 2 * F * Fp / den;
    }
  }
  return [C * Math.cos(h), C * Math.sin(h)];
}

// ── PW L correction ───────────────────────────────────────────────

function pwLForward(L) {
  if (L <= 0 || L >= 1) {
    return L;
  }
  let lo = 0,
    hi = PW_N - 1;
  while (hi - lo > 1) {
    let mid = lo + hi >> 1;
    if (PW_L_IN[mid] <= L) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  let t = (L - PW_L_IN[lo]) / (PW_L_IN[hi] - PW_L_IN[lo]);
  return PW_L_OUT[lo] + t * (PW_L_OUT[hi] - PW_L_OUT[lo]);
}
function pwLInverse(L) {
  if (L <= PW_L_OUT[0] || L >= PW_L_OUT[PW_N - 1]) {
    return L;
  }
  let lo = 0,
    hi = PW_N - 1;
  while (hi - lo > 1) {
    let mid = lo + hi >> 1;
    if (PW_L_OUT[mid] <= L) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  let t = (L - PW_L_OUT[lo]) / (PW_L_OUT[hi] - PW_L_OUT[lo]);
  return PW_L_IN[lo] + t * (PW_L_IN[hi] - PW_L_IN[lo]);
}

// ── Color space definition ─────────────────────────────────────────

var HelmGen = new ColorSpace({
  id: "helmgen",
  name: "HelmGen",
  cssId: "--helmgen",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    a: {
      refRange: [-0.6, 0.6]
    },
    b: {
      refRange: [-0.6, 0.6]
    }
  },
  white: "D65",
  base: XYZ_D65,
  fromBase(xyz) {
    // Stage 1: XYZ → LMS (M1)
    let lms = multiply_v3_m3x3(xyz, M1);

    // Stage 2: Depressed cubic transfer (y³ + αy = x)
    let c0 = depcubicFwd(Math.max(lms[0], 0));
    let c1 = depcubicFwd(Math.max(lms[1], 0));
    let c2 = depcubicFwd(Math.max(lms[2], 0));

    // Stage 2.5: Smooth neutral blend (C∞ correction for achromatic precision)
    {
      let mean = (c0 + c1 + c2) / 3;
      let mx = Math.max(c0, c1, c2);
      let mn = Math.min(c0, c1, c2);
      let spread = (mx - mn) / Math.max(Math.abs(mean), 1e-30);
      let w = Math.exp(-((spread / 1e-5) ** 2));
      c0 += w * (mean - c0);
      c1 += w * (mean - c1);
      c2 += w * (mean - c2);
    }

    // Stage 3: LMS_c → Lab (M2)
    let [L, a, b] = multiply_v3_m3x3([c0, c1, c2], M2);

    // Stage 3.5: Chroma power (cp=0.978)
    {
      let C = Math.sqrt(a * a + b * b);
      if (C > 1e-12) {
        let Cnew = Math.pow(C, CP);
        let s = Cnew / C;
        a *= s;
        b *= s;
      }
    }

    // Stage 4: Piecewise-linear L correction
    L = pwLForward(L);

    // Stage 5: L-gated hue enrichment
    [a, b] = enrichFwd(L, a, b);
    return [L, a, b];
  },
  toBase(lab) {
    let [L, a, b] = lab;

    // Undo Stage 5: L-gated hue enrichment
    [a, b] = enrichInv(L, a, b);

    // Undo Stage 4: PW L correction
    L = pwLInverse(L);

    // Undo Stage 3.5: Chroma power inverse (C^(1/cp))
    {
      let C = Math.sqrt(a * a + b * b);
      if (C > 1e-12) {
        let Corig = Math.pow(C, 1 / CP);
        let s = Corig / C;
        a *= s;
        b *= s;
      }
    }

    // Undo Stage 3: Lab → LMS_c (M2_inv)
    let [lc0, lc1, lc2] = multiply_v3_m3x3([L, a, b], M2_INV);

    // Undo Stage 2.5: Smooth neutral blend
    {
      let mean = (lc0 + lc1 + lc2) / 3;
      let mx = Math.max(lc0, lc1, lc2);
      let mn = Math.min(lc0, lc1, lc2);
      let spread = (mx - mn) / Math.max(Math.abs(mean), 1e-30);
      let w = Math.exp(-((spread / 1e-5) ** 2));
      lc0 += w * (mean - lc0);
      lc1 += w * (mean - lc1);
      lc2 += w * (mean - lc2);
    }

    // Undo Stage 2: Inverse depressed cubic (x = y³ + αy)
    let l0 = depcubicInv(lc0);
    let l1 = depcubicInv(lc1);
    let l2 = depcubicInv(lc2);

    // Undo Stage 1: LMS → XYZ (M1_inv)
    return multiply_v3_m3x3([l0, l1, l2], M1_INV);
  }
});

/**
 * HelmGenLCh — cylindrical form of Helmlab GenSpace.
 *
 * Converts GenSpace's rectangular (L, a, b) coordinates to
 * cylindrical (L, C, h). Ideal for CSS interpolation contexts
 * like gradients and color-mix where hue angle matters.
 *
 * @see https://github.com/Grkmyldz148/helmlab
 */
var helmgenlch = new ColorSpace({
  id: "helmgenlch",
  name: "HelmGenLCh",
  coords: {
    l: {
      refRange: [0, 1],
      name: "Lightness"
    },
    c: {
      refRange: [0, 0.65],
      name: "Chroma"
    },
    h: {
      refRange: [0, 360],
      type: "angle",
      name: "Hue"
    }
  },
  white: "D65",
  base: HelmGen,
  fromBase: lch.fromBase,
  toBase: lch.toBase
});

var REC_2100_Linear = new RGBColorSpace({
  id: "rec2100-linear",
  name: "Linear REC.2100",
  white: "D65",
  toBase: REC_2020_Linear.toBase,
  fromBase: REC_2020_Linear.fromBase
});

const Yw = 203; // absolute luminance of media white, cd/m²
const n = 2610 / 2 ** 14;
const ninv = 2 ** 14 / 2610;
const m = 2523 / 2 ** 5;
const minv = 2 ** 5 / 2523;
const c1 = 3424 / 2 ** 12;
const c2 = 2413 / 2 ** 7;
const c3 = 2392 / 2 ** 7;
var rec2100Pq = new RGBColorSpace({
  id: "rec2100pq",
  cssId: "rec2100-pq",
  name: "REC.2100-PQ",
  base: REC_2100_Linear,
  linearGamut: REC_2100_Linear,
  toBase(RGB) {
    // given PQ encoded component in range [0, 1]
    // return media-white relative linear-light
    return RGB.map(function (val) {
      let x = (Math.max(val ** minv - c1, 0) / (c2 - c3 * val ** minv)) ** ninv;
      return x * 10000 / Yw; // luminance relative to diffuse white, [0, 70 or so].
    });
  },
  fromBase(RGB) {
    // given media-white relative linear-light
    // returnPQ encoded component in range [0, 1]
    return RGB.map(function (val) {
      let x = Math.max(val * Yw / 10000, 0); // absolute luminance of peak white is 10,000 cd/m².
      let num = c1 + c2 * x ** n;
      let denom = 1 + c3 * x ** n;
      return (num / denom) ** m;
    });
  }
});

const a = 0.17883277;
const b = 0.28466892; // 1 - (4 * a)
const c = 0.55991073; // 0.5 - a * Math.log(4 *a)

const scale = 3.7743; // Place 18% grey at HLG 0.38, so media white at 0.75

var rec2100Hlg = new RGBColorSpace({
  id: "rec2100hlg",
  cssId: "rec2100-hlg",
  name: "REC.2100-HLG",
  referred: "scene",
  base: REC_2100_Linear,
  linearGamut: REC_2100_Linear,
  toBase(RGB) {
    // given HLG encoded component in range [0, 1]
    // return media-white relative linear-light
    return RGB.map(function (val) {
      // first the HLG EOTF
      // ITU-R BT.2390-10 p.30 section
      // 6.3 The hybrid log-gamma electro-optical transfer function (EOTF)
      // Then scale by 3 so media white is 1.0
      if (val <= 0.5) {
        return val ** 2 / 3 * scale;
      }
      return (Math.exp((val - c) / a) + b) / 12 * scale;
    });
  },
  fromBase(RGB) {
    // given media-white relative linear-light
    // where diffuse white is 1.0,
    // return HLG encoded component in range [0, 1]
    return RGB.map(function (val) {
      // first scale to put linear-light media white at 1/3
      val /= scale;
      // now the HLG OETF
      // ITU-R BT.2390-10 p.23
      // 6.1 The hybrid log-gamma opto-electronic transfer function (OETF)
      if (val <= 1 / 12) {
        return spow(3 * val, 0.5);
      }
      return a * Math.log(12 * val - b) + c;
    });
  }
});

/** @import { White } from "./types.js" */

// Type re-exports
/** @typedef {import("./types.js").CAT} CAT */

/** @type {Record<string, CAT>} */
const CATs = {};
hooks.add("chromatic-adaptation-start", env => {
  if (env.options.method) {
    env.M = adapt(env.W1, env.W2, env.options.method);
  }
});
hooks.add("chromatic-adaptation-end", env => {
  if (!env.M) {
    env.M = adapt(env.W1, env.W2, env.options.method);
  }
});
function defineCAT(/** @type {CAT} */{
  id,
  toCone_M,
  fromCone_M
}) {
  // Use id, toCone_M, fromCone_M like variables
  CATs[id] = arguments[0];
}

/**
 *
 * @param {White} W1
 * @param {White} W2
 * @param {string} id
 * @returns {number[][]}
 */
function adapt(W1, W2, id = "Bradford") {
  // adapt from a source whitepoint or illuminant W1
  // to a destination whitepoint or illuminant W2,
  // using the given chromatic adaptation transform (CAT)
  // debugger;
  let method = CATs[id];
  let [ρs, γs, βs] = multiplyMatrices(method.toCone_M, W1);
  let [ρd, γd, βd] = multiplyMatrices(method.toCone_M, W2);

  // all practical illuminants have non-zero XYZ so no division by zero can occur below
  // prettier-ignore
  let scale = [[ρd / ρs, 0, 0], [0, γd / γs, 0], [0, 0, βd / βs]];
  // console.log({scale});

  let scaled_cone_M = multiplyMatrices(scale, method.toCone_M);
  let adapt_M = multiplyMatrices(method.fromCone_M, scaled_cone_M);
  // console.log({scaled_cone_M, adapt_M});
  return adapt_M;
}

// prettier-ignore
defineCAT({
  id: "von Kries",
  toCone_M: [[0.4002400, 0.7076000, -0.0808100], [-0.2263000, 1.1653200, 0.0457000], [0.0000000, 0.0000000, 0.9182200]],
  fromCone_M: [[1.8599363874558397, -1.1293816185800916, 0.21989740959619328], [0.3611914362417676, 0.6388124632850422, -0.000006370596838649899], [0, 0, 1.0890636230968613]]
});

// prettier-ignore
defineCAT({
  id: "Bradford",
  // Convert an array of XYZ values in the range 0.0 - 1.0
  // to cone fundamentals
  toCone_M: [[0.8951000, 0.2664000, -0.1614000], [-0.7502000, 1.7135000, 0.0367000], [0.0389000, -0.0685000, 1.0296000]],
  // and back
  fromCone_M: [[0.9869929054667121, -0.14705425642099013, 0.15996265166373122], [0.4323052697233945, 0.5183602715367774, 0.049291228212855594], [-0.00852866457517732, 0.04004282165408486, 0.96848669578755]]
});

// prettier-ignore
defineCAT({
  id: "CAT02",
  // with complete chromatic adaptation to W2, so D = 1.0
  toCone_M: [[0.7328000, 0.4296000, -0.1624000], [-0.7036000, 1.6975000, 0.0061000], [0.0030000, 0.0136000, 0.9834000]],
  fromCone_M: [[1.0961238208355142, -0.27886900021828726, 0.18274517938277307], [0.4543690419753592, 0.4735331543074117, 0.07209780371722911], [-0.009627608738429355, -0.00569803121611342, 1.0153256399545427]]
});

// prettier-ignore
defineCAT({
  id: "CAT16",
  toCone_M: [[0.401288, 0.650173, -0.051461], [-0.250268, 1.204414, 0.045854], [-0.002079, 0.048952, 0.953127]],
  // the extra precision is needed to avoid roundtripping errors
  fromCone_M: [[1.862067855087233, -1.0112546305316845, 0.14918677544445172], [0.3875265432361372, 0.6214474419314753, -0.008973985167612521], [-0.01584149884933386, -0.03412293802851557, 1.0499644368778496]]
});

// prettier-ignore
Object.assign(WHITES, {
  // whitepoint values from ASTM E308-01 with 10nm spacing, 1931 2 degree observer
  // all normalized to Y (luminance) = 1.00000
  // Illuminant A is a tungsten electric light, giving a very warm, orange light.
  A: [1.09850, 1.00000, 0.35585],
  // Illuminant C was an early approximation to daylight: illuminant A with a blue filter.
  C: [0.98074, 1.000000, 1.18232],
  // The daylight series of illuminants simulate natural daylight.
  // The color temperature (in degrees Kelvin/100) ranges from
  // cool, overcast daylight (D50) to bright, direct sunlight (D65).
  D55: [0.95682, 1.00000, 0.92149],
  D75: [0.94972, 1.00000, 1.22638],
  // Equal-energy illuminant, used in two-stage CAT16
  E: [1.00000, 1.00000, 1.00000],
  // The F series of illuminants represent fluorescent lights
  F2: [0.99186, 1.00000, 0.67393],
  F7: [0.95041, 1.00000, 1.08747],
  F11: [1.00962, 1.00000, 0.64350]
});

/** @import { Matrix3x3 } from "../types.js" */

// The ACES whitepoint
// see TB-2018-001 Derivation of the ACES White Point CIE Chromaticity Coordinates
// also https://github.com/ampas/aces-dev/blob/master/documents/python/TB-2018-001/aces_wp.py
// Similar to D60
WHITES.ACES = [0.32168 / 0.33767, 1.0, (1.0 - 0.32168 - 0.33767) / 0.33767];

// convert an array of linear-light ACEScc values to CIE XYZ
/** @type {Matrix3x3} */
// prettier-ignore
const toXYZ_M = [[0.6624541811085053, 0.13400420645643313, 0.1561876870049078], [0.27222871678091454, 0.6740817658111484, 0.05368951740793705], [-0.005574649490394108, 0.004060733528982826, 1.0103391003129971]];
/** @type {Matrix3x3} */
// prettier-ignore
const fromXYZ_M = [[1.6410233796943257, -0.32480329418479, -0.23642469523761225], [-0.6636628587229829, 1.6153315916573379, 0.016756347685530137], [0.011721894328375376, -0.008284441996237409, 0.9883948585390215]];
var ACEScg = new RGBColorSpace({
  id: "acescg",
  cssId: "--acescg",
  name: "ACEScg",
  // ACEScg – A scene-referred, linear-light encoding of ACES Data
  // https://docs.acescentral.com/specifications/acescg/
  // uses the AP1 primaries, see section 4.3.1 Color primaries
  coords: {
    r: {
      range: [0, 65504],
      name: "Red"
    },
    g: {
      range: [0, 65504],
      name: "Green"
    },
    b: {
      range: [0, 65504],
      name: "Blue"
    }
  },
  referred: "scene",
  white: WHITES.ACES,
  toXYZ_M,
  fromXYZ_M
});

// export default Color;

const ε = 2 ** -16;

// the smallest value which, in the 32bit IEEE 754 float encoding,
// decodes as a non-negative value
const ACES_min_nonzero = -0.35828683;

// brightest encoded value, decodes to 65504
const ACES_cc_max = (Math.log2(65504) + 9.72) / 17.52; // 1.468

var acescc = new RGBColorSpace({
  id: "acescc",
  cssId: "--acescc",
  name: "ACEScc",
  // see S-2014-003 ACEScc – A Logarithmic Encoding of ACES Data
  // https://docs.acescentral.com/specifications/acescc/
  // uses the AP1 primaries, see section 4.3.1 Color primaries

  // Appendix A: "Very small ACES scene referred values below 7 1/4 stops
  // below 18% middle gray are encoded as negative ACEScc values.
  // These values should be preserved per the encoding in Section 4.4
  // so that all positive ACES values are maintained."
  coords: {
    r: {
      range: [ACES_min_nonzero, ACES_cc_max],
      name: "Red"
    },
    g: {
      range: [ACES_min_nonzero, ACES_cc_max],
      name: "Green"
    },
    b: {
      range: [ACES_min_nonzero, ACES_cc_max],
      name: "Blue"
    }
  },
  referred: "scene",
  base: ACEScg,
  linearGamut: ACEScg,
  // from section 4.4.2 Decoding Function
  toBase(RGB) {
    const low = (9.72 - 15) / 17.52; // -0.3014

    return RGB.map(function (val) {
      if (val <= low) {
        return (2 ** (val * 17.52 - 9.72) - ε) * 2; // very low values, below -0.3014
      } else if (val < ACES_cc_max) {
        return 2 ** (val * 17.52 - 9.72);
      } else {
        // val >= ACES_cc_max
        return 65504;
      }
    });
  },
  // Non-linear encoding function from S-2014-003, section 4.4.1 Encoding Function
  fromBase(RGB) {
    return RGB.map(function (val) {
      if (val <= 0) {
        return (Math.log2(ε) + 9.72) / 17.52; // -0.3584
      } else if (val < ε) {
        return (Math.log2(ε + val * 0.5) + 9.72) / 17.52;
      } else {
        // val >= ε
        return (Math.log2(val) + 9.72) / 17.52;
      }
    });
  }
  // encoded media white (rgb 1,1,1) => linear  [ 222.861, 222.861, 222.861 ]
  // encoded media black (rgb 0,0,0) => linear [ 0.0011857, 0.0011857, 0.0011857]
});

/**
 * @packageDocumentation
 * Re-exports all the spaces built into Color.js.
 */

var indexFn = /*#__PURE__*/Object.freeze({
	__proto__: null,
	A98RGB: a98rgb,
	A98RGB_Linear: A98Linear,
	ACEScc: acescc,
	ACEScg: ACEScg,
	CAM16_JMh: cam16,
	HCT: hct,
	HPLuv: HPLuv,
	HSL: HSL,
	HSL_P3: hslP3,
	HSL_REC2020: hslRec2020,
	HSLuv: hsluv,
	HSV: HSV,
	HWB: hwb,
	HelmGen: HelmGen,
	HelmGenLCh: helmgenlch,
	Helmlab: helmlab,
	ICTCP: ictcp,
	JzCzHz: jzczhz,
	Jzazbz: Jzazbz,
	LCH: lch,
	LCHuv: LCHuv,
	Lab: lab,
	Lab_D65: lab_d65,
	Luv: Luv,
	OKLCH: OKLCH,
	OKLCH_P3: oklchP3,
	OKLab: Oklab,
	OKLrCH: oklrch,
	OKLrab: OKLrab,
	Okhsl: Okhsl,
	Okhsv: Okhsv,
	P3: P3,
	P3_Linear: P3Linear,
	ProPhoto: prophoto,
	ProPhoto_Linear: ProPhotoLinear,
	REC_2020: REC2020,
	REC_2020_Linear: REC_2020_Linear,
	REC_2020_Scene_Referred: rec2020Oetf,
	REC_2100_HLG: rec2100Hlg,
	REC_2100_Linear: REC_2100_Linear,
	REC_2100_PQ: rec2100Pq,
	XYZ_ABS_D65: XYZ_Abs_D65,
	XYZ_D50: XYZ_D50,
	XYZ_D65: XYZ_D65,
	sRGB: sRGB,
	sRGB_Linear: sRGBLinear
});

export { a98rgb as A98RGB, A98Linear as A98RGB_Linear, acescc as ACEScc, ACEScg, cam16 as CAM16_JMh, ColorSpace, hct as HCT, HPLuv, HSL, hslP3 as HSL_P3, hslRec2020 as HSL_REC2020, hsluv as HSLuv, HSV, hwb as HWB, HelmGen, helmgenlch as HelmGenLCh, helmlab as Helmlab, Hooks, ictcp as ICTCP, jzczhz as JzCzHz, Jzazbz, lch as LCH, LCHuv, lab as Lab, lab_d65 as Lab_D65, Luv, OKLCH, oklchP3 as OKLCH_P3, Oklab as OKLab, oklrch as OKLrCH, OKLrab, Okhsl, Okhsv, P3, P3Linear as P3_Linear, prophoto as ProPhoto, ProPhotoLinear as ProPhoto_Linear, REC2020 as REC_2020, REC_2020_Linear, rec2020Oetf as REC_2020_Scene_Referred, rec2100Hlg as REC_2100_HLG, REC_2100_Linear, rec2100Pq as REC_2100_PQ, RGBColorSpace, XYZ_Abs_D65 as XYZ_ABS_D65, XYZ_D50, XYZ_D65, clone, contrast, contrastAPCA, contrastDeltaPhi, contrastLstar, contrastMichelson, contrastWCAG21, contrastWeber, darken, defaults, deltaE, deltaE2000, deltaE76, deltaECMC, deltaEHCT, deltaEHelmlab, deltaEITP, deltaEJz, deltaEMethods, deltaEOK, deltaEOK2, deltas, display, distance, equals, get, getAll, getColor, getLuminance, hooks, inGamut, isRange, lighten, maxChroma, mix, parse, range, sRGB, sRGBLinear as sRGB_Linear, serialize, set, setAll, setLuminance, indexFn as spaces, steps, to, toGamut, toGamutCSS, tryColor, uv, xy };
//# sourceMappingURL=color-fn.legacy.js.map
