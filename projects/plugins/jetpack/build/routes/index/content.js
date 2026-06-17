var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../js-packages/config/src/index.js
var require_src = __commonJS({
  "../../js-packages/config/src/index.js"(exports, module) {
    var jetpackConfig = {};
    try {
      jetpackConfig = __require("jetpackConfig");
    } catch {
      console.error(
        "jetpackConfig is missing in your webpack config file. See @automattic/jetpack-config"
      );
      jetpackConfig = { missingConfig: true };
    }
    var jetpackConfigHas2 = (key) => {
      return Object.hasOwn(jetpackConfig, key);
    };
    var jetpackConfigGet2 = (key) => {
      if (!jetpackConfigHas2(key)) {
        throw 'This app requires the "' + key + '" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.';
      }
      return jetpackConfig[key];
    };
    module.exports = {
      jetpackConfigHas: jetpackConfigHas2,
      jetpackConfigGet: jetpackConfigGet2
    };
  }
});

// package-external:@wordpress/url
var require_url = __commonJS({
  "package-external:@wordpress/url"(exports, module) {
    module.exports = window.wp.url;
  }
});

// package-external:@wordpress/api-fetch
var require_api_fetch = __commonJS({
  "package-external:@wordpress/api-fetch"(exports, module) {
    module.exports = window.wp.apiFetch;
  }
});

// package-external:@wordpress/element
var require_element = __commonJS({
  "package-external:@wordpress/element"(exports, module) {
    module.exports = window.wp.element;
  }
});

// vendor-external:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "vendor-external:react/jsx-runtime"(exports, module) {
    module.exports = window.ReactJSXRuntime;
  }
});

// package-external:@wordpress/i18n
var require_i18n = __commonJS({
  "package-external:@wordpress/i18n"(exports, module) {
    module.exports = window.wp.i18n;
  }
});

// package-external:@wordpress/components
var require_components = __commonJS({
  "package-external:@wordpress/components"(exports, module) {
    module.exports = window.wp.components;
  }
});

// vendor-external:react
var require_react = __commonJS({
  "vendor-external:react"(exports, module) {
    module.exports = window.React;
  }
});

// ../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/cjs/react-is.development.js
var require_react_is_development = __commonJS({
  "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/cjs/react-is.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        var hasSymbol = typeof Symbol === "function" && Symbol.for;
        var REACT_ELEMENT_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.element") : 60103;
        var REACT_PORTAL_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.portal") : 60106;
        var REACT_FRAGMENT_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.fragment") : 60107;
        var REACT_STRICT_MODE_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.strict_mode") : 60108;
        var REACT_PROFILER_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.profiler") : 60114;
        var REACT_PROVIDER_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.provider") : 60109;
        var REACT_CONTEXT_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.context") : 60110;
        var REACT_ASYNC_MODE_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.async_mode") : 60111;
        var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.concurrent_mode") : 60111;
        var REACT_FORWARD_REF_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.forward_ref") : 60112;
        var REACT_SUSPENSE_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.suspense") : 60113;
        var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.suspense_list") : 60120;
        var REACT_MEMO_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.memo") : 60115;
        var REACT_LAZY_TYPE2 = hasSymbol ? /* @__PURE__ */ Symbol.for("react.lazy") : 60116;
        var REACT_BLOCK_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.block") : 60121;
        var REACT_FUNDAMENTAL_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.fundamental") : 60117;
        var REACT_RESPONDER_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.responder") : 60118;
        var REACT_SCOPE_TYPE = hasSymbol ? /* @__PURE__ */ Symbol.for("react.scope") : 60119;
        function isValidElementType(type) {
          return typeof type === "string" || typeof type === "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
          type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === "object" && type !== null && (type.$$typeof === REACT_LAZY_TYPE2 || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
        }
        function typeOf(object) {
          if (typeof object === "object" && object !== null) {
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
                      case REACT_LAZY_TYPE2:
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
          return void 0;
        }
        var AsyncMode = REACT_ASYNC_MODE_TYPE;
        var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
        var ContextConsumer = REACT_CONTEXT_TYPE;
        var ContextProvider = REACT_PROVIDER_TYPE;
        var Element = REACT_ELEMENT_TYPE;
        var ForwardRef = REACT_FORWARD_REF_TYPE;
        var Fragment3 = REACT_FRAGMENT_TYPE;
        var Lazy = REACT_LAZY_TYPE2;
        var Memo = REACT_MEMO_TYPE;
        var Portal = REACT_PORTAL_TYPE;
        var Profiler = REACT_PROFILER_TYPE;
        var StrictMode = REACT_STRICT_MODE_TYPE;
        var Suspense = REACT_SUSPENSE_TYPE;
        var hasWarnedAboutDeprecatedIsAsyncMode = false;
        function isAsyncMode(object) {
          {
            if (!hasWarnedAboutDeprecatedIsAsyncMode) {
              hasWarnedAboutDeprecatedIsAsyncMode = true;
              console["warn"]("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.");
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
          return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        function isForwardRef(object) {
          return typeOf(object) === REACT_FORWARD_REF_TYPE;
        }
        function isFragment(object) {
          return typeOf(object) === REACT_FRAGMENT_TYPE;
        }
        function isLazy(object) {
          return typeOf(object) === REACT_LAZY_TYPE2;
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
        exports.Fragment = Fragment3;
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
  }
});

// ../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js
var require_react_is = __commonJS({
  "../../../node_modules/.pnpm/react-is@16.13.1/node_modules/react-is/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_is_development();
    }
  }
});

// ../../../node_modules/.pnpm/object-assign@4.1.1/node_modules/object-assign/index.js
var require_object_assign = __commonJS({
  "../../../node_modules/.pnpm/object-assign@4.1.1/node_modules/object-assign/index.js"(exports, module) {
    "use strict";
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
      if (val === null || val === void 0) {
        throw new TypeError("Object.assign cannot be called with null or undefined");
      }
      return Object(val);
    }
    function shouldUseNative() {
      try {
        if (!Object.assign) {
          return false;
        }
        var test1 = new String("abc");
        test1[5] = "de";
        if (Object.getOwnPropertyNames(test1)[0] === "5") {
          return false;
        }
        var test2 = {};
        for (var i = 0; i < 10; i++) {
          test2["_" + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
          return test2[n];
        });
        if (order2.join("") !== "0123456789") {
          return false;
        }
        var test3 = {};
        "abcdefghijklmnopqrst".split("").forEach(function(letter) {
          test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    module.exports = shouldUseNative() ? Object.assign : function(target, source) {
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
  }
});

// ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js
var require_ReactPropTypesSecret = __commonJS({
  "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js"(exports, module) {
    "use strict";
    var ReactPropTypesSecret = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
    module.exports = ReactPropTypesSecret;
  }
});

// ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/has.js
var require_has = __commonJS({
  "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/has.js"(exports, module) {
    module.exports = Function.call.bind(Object.prototype.hasOwnProperty);
  }
});

// ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/checkPropTypes.js
var require_checkPropTypes = __commonJS({
  "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/checkPropTypes.js"(exports, module) {
    "use strict";
    var printWarning = function() {
    };
    if (true) {
      ReactPropTypesSecret = require_ReactPropTypesSecret();
      loggedTypeFailures = {};
      has = require_has();
      printWarning = function(text) {
        var message = "Warning: " + text;
        if (typeof console !== "undefined") {
          console.error(message);
        }
        try {
          throw new Error(message);
        } catch (x) {
        }
      };
    }
    var ReactPropTypesSecret;
    var loggedTypeFailures;
    var has;
    function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
      if (true) {
        for (var typeSpecName in typeSpecs) {
          if (has(typeSpecs, typeSpecName)) {
            var error;
            try {
              if (typeof typeSpecs[typeSpecName] !== "function") {
                var err = Error(
                  (componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
                );
                err.name = "Invariant Violation";
                throw err;
              }
              error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
            } catch (ex) {
              error = ex;
            }
            if (error && !(error instanceof Error)) {
              printWarning(
                (componentName || "React class") + ": type specification of " + location + " `" + typeSpecName + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof error + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
              );
            }
            if (error instanceof Error && !(error.message in loggedTypeFailures)) {
              loggedTypeFailures[error.message] = true;
              var stack = getStack ? getStack() : "";
              printWarning(
                "Failed " + location + " type: " + error.message + (stack != null ? stack : "")
              );
            }
          }
        }
      }
    }
    checkPropTypes.resetWarningCache = function() {
      if (true) {
        loggedTypeFailures = {};
      }
    };
    module.exports = checkPropTypes;
  }
});

// ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/factoryWithTypeCheckers.js
var require_factoryWithTypeCheckers = __commonJS({
  "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/factoryWithTypeCheckers.js"(exports, module) {
    "use strict";
    var ReactIs = require_react_is();
    var assign = require_object_assign();
    var ReactPropTypesSecret = require_ReactPropTypesSecret();
    var has = require_has();
    var checkPropTypes = require_checkPropTypes();
    var printWarning = function() {
    };
    if (true) {
      printWarning = function(text) {
        var message = "Warning: " + text;
        if (typeof console !== "undefined") {
          console.error(message);
        }
        try {
          throw new Error(message);
        } catch (x) {
        }
      };
    }
    function emptyFunctionThatReturnsNull() {
      return null;
    }
    module.exports = function(isValidElement3, throwOnDirectAccess) {
      var ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = "@@iterator";
      function getIteratorFn(maybeIterable) {
        var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
        if (typeof iteratorFn === "function") {
          return iteratorFn;
        }
      }
      var ANONYMOUS = "<<anonymous>>";
      var ReactPropTypes = {
        array: createPrimitiveTypeChecker("array"),
        bigint: createPrimitiveTypeChecker("bigint"),
        bool: createPrimitiveTypeChecker("boolean"),
        func: createPrimitiveTypeChecker("function"),
        number: createPrimitiveTypeChecker("number"),
        object: createPrimitiveTypeChecker("object"),
        string: createPrimitiveTypeChecker("string"),
        symbol: createPrimitiveTypeChecker("symbol"),
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
        exact: createStrictShapeTypeChecker
      };
      function is(x, y) {
        if (x === y) {
          return x !== 0 || 1 / x === 1 / y;
        } else {
          return x !== x && y !== y;
        }
      }
      function PropTypeError(message, data) {
        this.message = message;
        this.data = data && typeof data === "object" ? data : {};
        this.stack = "";
      }
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
              var err = new Error(
                "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
              );
              err.name = "Invariant Violation";
              throw err;
            } else if (typeof console !== "undefined") {
              var cacheKey = componentName + ":" + propName;
              if (!manualPropTypeCallCache[cacheKey] && // Avoid spamming the console because they are often not actionable except for lib authors
              manualPropTypeWarningCount < 3) {
                printWarning(
                  "You are manually calling a React.PropTypes validation function for the `" + propFullName + "` prop on `" + componentName + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
                );
                manualPropTypeCallCache[cacheKey] = true;
                manualPropTypeWarningCount++;
              }
            }
          }
          if (props[propName] == null) {
            if (isRequired) {
              if (props[propName] === null) {
                return new PropTypeError("The " + location + " `" + propFullName + "` is marked as required " + ("in `" + componentName + "`, but its value is `null`."));
              }
              return new PropTypeError("The " + location + " `" + propFullName + "` is marked as required in " + ("`" + componentName + "`, but its value is `undefined`."));
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
            var preciseType = getPreciseType(propValue);
            return new PropTypeError(
              "Invalid " + location + " `" + propFullName + "` of type " + ("`" + preciseType + "` supplied to `" + componentName + "`, expected ") + ("`" + expectedType + "`."),
              { expectedType }
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
          if (typeof typeChecker !== "function") {
            return new PropTypeError("Property `" + propFullName + "` of component `" + componentName + "` has invalid PropType notation inside arrayOf.");
          }
          var propValue = props[propName];
          if (!Array.isArray(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected an array."));
          }
          for (var i = 0; i < propValue.length; i++) {
            var error = typeChecker(propValue, i, componentName, location, propFullName + "[" + i + "]", ReactPropTypesSecret);
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
          if (!isValidElement3(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected a single ReactElement."));
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
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected a single ReactElement type."));
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
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + actualClassName + "` supplied to `" + componentName + "`, expected ") + ("instance of `" + expectedClassName + "`."));
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
                "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
              );
            } else {
              printWarning("Invalid argument supplied to oneOf, expected an array.");
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
            if (type === "symbol") {
              return String(value);
            }
            return value;
          });
          return new PropTypeError("Invalid " + location + " `" + propFullName + "` of value `" + String(propValue) + "` " + ("supplied to `" + componentName + "`, expected one of " + valuesString + "."));
        }
        return createChainableTypeChecker(validate);
      }
      function createObjectOfTypeChecker(typeChecker) {
        function validate(props, propName, componentName, location, propFullName) {
          if (typeof typeChecker !== "function") {
            return new PropTypeError("Property `" + propFullName + "` of component `" + componentName + "` has invalid PropType notation inside objectOf.");
          }
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== "object") {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected an object."));
          }
          for (var key in propValue) {
            if (has(propValue, key)) {
              var error = typeChecker(propValue, key, componentName, location, propFullName + "." + key, ReactPropTypesSecret);
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
          true ? printWarning("Invalid argument supplied to oneOfType, expected an instance of array.") : void 0;
          return emptyFunctionThatReturnsNull;
        }
        for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
          var checker = arrayOfTypeCheckers[i];
          if (typeof checker !== "function") {
            printWarning(
              "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + getPostfixForTypeWarning(checker) + " at index " + i + "."
            );
            return emptyFunctionThatReturnsNull;
          }
        }
        function validate(props, propName, componentName, location, propFullName) {
          var expectedTypes = [];
          for (var i2 = 0; i2 < arrayOfTypeCheckers.length; i2++) {
            var checker2 = arrayOfTypeCheckers[i2];
            var checkerResult = checker2(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
            if (checkerResult == null) {
              return null;
            }
            if (checkerResult.data && has(checkerResult.data, "expectedType")) {
              expectedTypes.push(checkerResult.data.expectedType);
            }
          }
          var expectedTypesMessage = expectedTypes.length > 0 ? ", expected one of type [" + expectedTypes.join(", ") + "]" : "";
          return new PropTypeError("Invalid " + location + " `" + propFullName + "` supplied to " + ("`" + componentName + "`" + expectedTypesMessage + "."));
        }
        return createChainableTypeChecker(validate);
      }
      function createNodeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          if (!isNode(props[propName])) {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` supplied to " + ("`" + componentName + "`, expected a ReactNode."));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function invalidValidatorError(componentName, location, propFullName, key, type) {
        return new PropTypeError(
          (componentName || "React class") + ": " + location + " type `" + propFullName + "." + key + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + type + "`."
        );
      }
      function createShapeTypeChecker(shapeTypes) {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== "object") {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type `" + propType + "` " + ("supplied to `" + componentName + "`, expected `object`."));
          }
          for (var key in shapeTypes) {
            var checker = shapeTypes[key];
            if (typeof checker !== "function") {
              return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
            }
            var error = checker(propValue, key, componentName, location, propFullName + "." + key, ReactPropTypesSecret);
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
          if (propType !== "object") {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type `" + propType + "` " + ("supplied to `" + componentName + "`, expected `object`."));
          }
          var allKeys = assign({}, props[propName], shapeTypes);
          for (var key in allKeys) {
            var checker = shapeTypes[key];
            if (has(shapeTypes, key) && typeof checker !== "function") {
              return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
            }
            if (!checker) {
              return new PropTypeError(
                "Invalid " + location + " `" + propFullName + "` key `" + key + "` supplied to `" + componentName + "`.\nBad object: " + JSON.stringify(props[propName], null, "  ") + "\nValid keys: " + JSON.stringify(Object.keys(shapeTypes), null, "  ")
              );
            }
            var error = checker(propValue, key, componentName, location, propFullName + "." + key, ReactPropTypesSecret);
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
          case "number":
          case "string":
          case "undefined":
            return true;
          case "boolean":
            return !propValue;
          case "object":
            if (Array.isArray(propValue)) {
              return propValue.every(isNode);
            }
            if (propValue === null || isValidElement3(propValue)) {
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
        if (propType === "symbol") {
          return true;
        }
        if (!propValue) {
          return false;
        }
        if (propValue["@@toStringTag"] === "Symbol") {
          return true;
        }
        if (typeof Symbol === "function" && propValue instanceof Symbol) {
          return true;
        }
        return false;
      }
      function getPropType(propValue) {
        var propType = typeof propValue;
        if (Array.isArray(propValue)) {
          return "array";
        }
        if (propValue instanceof RegExp) {
          return "object";
        }
        if (isSymbol(propType, propValue)) {
          return "symbol";
        }
        return propType;
      }
      function getPreciseType(propValue) {
        if (typeof propValue === "undefined" || propValue === null) {
          return "" + propValue;
        }
        var propType = getPropType(propValue);
        if (propType === "object") {
          if (propValue instanceof Date) {
            return "date";
          } else if (propValue instanceof RegExp) {
            return "regexp";
          }
        }
        return propType;
      }
      function getPostfixForTypeWarning(value) {
        var type = getPreciseType(value);
        switch (type) {
          case "array":
          case "object":
            return "an " + type;
          case "boolean":
          case "date":
          case "regexp":
            return "a " + type;
          default:
            return type;
        }
      }
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
  }
});

// ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js
var require_prop_types = __commonJS({
  "../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/index.js"(exports, module) {
    if (true) {
      ReactIs = require_react_is();
      throwOnDirectAccess = true;
      module.exports = require_factoryWithTypeCheckers()(ReactIs.isElement, throwOnDirectAccess);
    } else {
      module.exports = null();
    }
    var ReactIs;
    var throwOnDirectAccess;
  }
});

// ../../js-packages/api/index.jsx
var import_jetpack_config = __toESM(require_src(), 1);
var import_url = __toESM(require_url(), 1);
function createCustomError(name) {
  class CustomError extends Error {
    constructor(...args) {
      super(...args);
      this.name = name;
    }
  }
  return CustomError;
}
var JsonParseError = createCustomError("JsonParseError");
var JsonParseAfterRedirectError = createCustomError("JsonParseAfterRedirectError");
var Api404Error = createCustomError("Api404Error");
var Api404AfterRedirectError = createCustomError("Api404AfterRedirectError");
var FetchNetworkError = createCustomError("FetchNetworkError");
function JetpackRestApiClient(root, nonce) {
  let apiRoot = root, wpcomOriginApiUrl = root, headers = {
    "X-WP-Nonce": nonce
  }, getParams = {
    credentials: "same-origin",
    headers
  }, postParams = {
    method: "post",
    credentials: "same-origin",
    headers: Object.assign({}, headers, {
      "Content-type": "application/json"
    })
  }, cacheBusterCallback = addCacheBuster;
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
        "X-WP-Nonce": newNonce
      };
      getParams = {
        credentials: "same-origin",
        headers
      };
      postParams = {
        method: "post",
        credentials: "same-origin",
        headers: Object.assign({}, headers, {
          "Content-type": "application/json"
        })
      };
    },
    setCacheBusterCallback: (callback) => {
      cacheBusterCallback = callback;
    },
    registerSite: (deprecated, redirectUri, from) => {
      const params = {};
      if ((0, import_jetpack_config.jetpackConfigHas)("consumer_slug")) {
        params.plugin_slug = (0, import_jetpack_config.jetpackConfigGet)("consumer_slug");
      }
      if (null !== redirectUri) {
        params.redirect_uri = redirectUri;
      }
      if (from) {
        params.from = from;
      }
      return postRequest(`${apiRoot}jetpack/v4/connection/register`, postParams, {
        body: JSON.stringify(params)
      }).then(checkStatus).then(parseJsonResponse);
    },
    fetchAuthorizationUrl: (redirectUri) => getRequest(
      (0, import_url.addQueryArgs)(`${apiRoot}jetpack/v4/connection/authorize_url`, {
        no_iframe: "1",
        redirect_uri: redirectUri
      }),
      getParams
    ).then(checkStatus).then(parseJsonResponse),
    fetchSiteConnectionData: () => getRequest(`${apiRoot}jetpack/v4/connection/data`, getParams).then(parseJsonResponse),
    fetchSiteConnectionStatus: () => getRequest(`${apiRoot}jetpack/v4/connection`, getParams).then(parseJsonResponse),
    fetchSiteConnectionTest: () => getRequest(`${apiRoot}jetpack/v4/connection/test`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchUserConnectionData: () => getRequest(`${apiRoot}jetpack/v4/connection/data`, getParams).then(parseJsonResponse),
    fetchUserTrackingSettings: () => getRequest(`${apiRoot}jetpack/v4/tracking/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateUserTrackingSettings: (newSettings) => postRequest(`${apiRoot}jetpack/v4/tracking/settings`, postParams, {
      body: JSON.stringify(newSettings)
    }).then(checkStatus).then(parseJsonResponse),
    disconnectSite: () => postRequest(`${apiRoot}jetpack/v4/connection`, postParams, {
      body: JSON.stringify({ isActive: false })
    }).then(checkStatus).then(parseJsonResponse),
    fetchConnectUrl: () => getRequest(`${apiRoot}jetpack/v4/connection/url`, getParams).then(checkStatus).then(parseJsonResponse),
    unlinkUser: (force = false, options = {}) => {
      const params = {
        linked: false,
        force: !!force
      };
      if (options.disconnectAllUsers) {
        params["disconnect-all-users"] = true;
      }
      return postRequest(`${apiRoot}jetpack/v4/connection/user`, postParams, {
        body: JSON.stringify(params)
      }).then(checkStatus).then(parseJsonResponse);
    },
    reconnect: () => postRequest(`${apiRoot}jetpack/v4/connection/reconnect`, postParams).then(checkStatus).then(parseJsonResponse),
    fetchConnectedPlugins: () => getRequest(`${apiRoot}jetpack/v4/connection/plugins`, getParams).then(checkStatus).then(parseJsonResponse),
    setHasSeenWCConnectionModal: () => postRequest(`${apiRoot}jetpack/v4/seen-wc-connection-modal`, postParams).then(checkStatus).then(parseJsonResponse),
    fetchModules: () => getRequest(`${apiRoot}jetpack/v4/module/all`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchModule: (slug) => getRequest(`${apiRoot}jetpack/v4/module/${slug}`, getParams).then(checkStatus).then(parseJsonResponse),
    activateModule: (slug) => postRequest(`${apiRoot}jetpack/v4/module/${slug}/active`, postParams, {
      body: JSON.stringify({ active: true })
    }).then(checkStatus).then(parseJsonResponse),
    deactivateModule: (slug) => postRequest(`${apiRoot}jetpack/v4/module/${slug}/active`, postParams, {
      body: JSON.stringify({ active: false })
    }),
    updateModuleOptions: (slug, newOptionValues) => postRequest(`${apiRoot}jetpack/v4/module/${slug}`, postParams, {
      body: JSON.stringify(newOptionValues)
    }).then(checkStatus).then(parseJsonResponse),
    updateSettings: (newOptionValues) => postRequest(`${apiRoot}jetpack/v4/settings`, postParams, {
      body: JSON.stringify(newOptionValues)
    }).then(checkStatus).then(parseJsonResponse),
    getProtectCount: () => getRequest(`${apiRoot}jetpack/v4/module/protect/data`, getParams).then(checkStatus).then(parseJsonResponse),
    resetOptions: (options) => postRequest(`${apiRoot}jetpack/v4/options/${options}`, postParams, {
      body: JSON.stringify({ reset: true })
    }).then(checkStatus).then(parseJsonResponse),
    activateVaultPress: () => postRequest(`${apiRoot}jetpack/v4/plugins`, postParams, {
      body: JSON.stringify({ slug: "vaultpress", status: "active" })
    }).then(checkStatus).then(parseJsonResponse),
    getVaultPressData: () => getRequest(`${apiRoot}jetpack/v4/module/vaultpress/data`, getParams).then(checkStatus).then(parseJsonResponse),
    installPlugin: (slug, source) => {
      const props = { slug, status: "active" };
      if (source) {
        props.source = source;
      }
      return postRequest(`${apiRoot}jetpack/v4/plugins`, postParams, {
        body: JSON.stringify(props)
      }).then(checkStatus).then(parseJsonResponse);
    },
    activateAkismet: () => postRequest(`${apiRoot}jetpack/v4/plugins`, postParams, {
      body: JSON.stringify({ slug: "akismet", status: "active" })
    }).then(checkStatus).then(parseJsonResponse),
    getAkismetData: () => getRequest(`${apiRoot}jetpack/v4/module/akismet/data`, getParams).then(checkStatus).then(parseJsonResponse),
    checkAkismetKey: () => getRequest(`${apiRoot}jetpack/v4/module/akismet/key/check`, getParams).then(checkStatus).then(parseJsonResponse),
    checkAkismetKeyTyped: (apiKey) => postRequest(`${apiRoot}jetpack/v4/module/akismet/key/check`, postParams, {
      body: JSON.stringify({ api_key: apiKey })
    }).then(checkStatus).then(parseJsonResponse),
    getFeatureTypeStatus: (customContentType) => getRequest(`${apiRoot}jetpack/v4/feature/${customContentType}`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchStatsData: (range) => getRequest(statsDataUrl(range), getParams).then(checkStatus).then(parseJsonResponse).then(handleStatsResponseError),
    getPluginUpdates: () => getRequest(`${apiRoot}jetpack/v4/updates/plugins`, getParams).then(checkStatus).then(parseJsonResponse),
    getPlans: () => getRequest(`${apiRoot}jetpack/v4/plans`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchSettings: () => getRequest(`${apiRoot}jetpack/v4/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateSetting: (updatedSetting) => postRequest(`${apiRoot}jetpack/v4/settings`, postParams, {
      body: JSON.stringify(updatedSetting)
    }).then(checkStatus).then(parseJsonResponse),
    fetchSiteData: () => getRequest(`${apiRoot}jetpack/v4/site`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => JSON.parse(body.data)),
    fetchSiteFeatures: () => getRequest(`${apiRoot}jetpack/v4/site/features`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => JSON.parse(body.data)),
    fetchSiteProducts: () => getRequest(`${apiRoot}jetpack/v4/site/products`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchSitePurchases: () => getRequest(`${apiRoot}jetpack/v4/site/purchases`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => JSON.parse(body.data)),
    fetchSiteBenefits: () => getRequest(`${apiRoot}jetpack/v4/site/benefits`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => JSON.parse(body.data)),
    fetchSiteDiscount: () => getRequest(`${apiRoot}jetpack/v4/site/discount`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => body.data),
    fetchSetupQuestionnaire: () => getRequest(`${apiRoot}jetpack/v4/setup/questionnaire`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsData: () => getRequest(`${apiRoot}jetpack/v4/recommendations/data`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsProductSuggestions: () => getRequest(`${apiRoot}jetpack/v4/recommendations/product-suggestions`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsUpsell: () => getRequest(`${apiRoot}jetpack/v4/recommendations/upsell`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRecommendationsConditional: () => getRequest(`${apiRoot}jetpack/v4/recommendations/conditional`, getParams).then(checkStatus).then(parseJsonResponse),
    saveRecommendationsData: (data) => postRequest(`${apiRoot}jetpack/v4/recommendations/data`, postParams, {
      body: JSON.stringify({ data })
    }).then(checkStatus),
    fetchProducts: () => getRequest(`${apiRoot}jetpack/v4/products`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchRewindStatus: () => getRequest(`${apiRoot}jetpack/v4/rewind`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => JSON.parse(body.data)),
    fetchScanStatus: () => getRequest(`${apiRoot}jetpack/v4/scan`, getParams).then(checkStatus).then(parseJsonResponse).then((body) => JSON.parse(body.data)),
    dismissJetpackNotice: (notice) => postRequest(`${apiRoot}jetpack/v4/notice/${notice}`, postParams, {
      body: JSON.stringify({ dismissed: true })
    }).then(checkStatus).then(parseJsonResponse),
    fetchPluginsData: () => getRequest(`${apiRoot}jetpack/v4/plugins`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchIntroOffers: () => getRequest(`${apiRoot}jetpack/v4/intro-offers`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchVerifySiteGoogleStatus: (keyringId) => {
      const request = keyringId !== null ? getRequest(`${apiRoot}jetpack/v4/verify-site/google/${keyringId}`, getParams) : getRequest(`${apiRoot}jetpack/v4/verify-site/google`, getParams);
      return request.then(checkStatus).then(parseJsonResponse);
    },
    verifySiteGoogle: (keyringId) => postRequest(`${apiRoot}jetpack/v4/verify-site/google`, postParams, {
      body: JSON.stringify({ keyring_id: keyringId })
    }).then(checkStatus).then(parseJsonResponse),
    submitSurvey: (surveyResponse) => postRequest(`${apiRoot}jetpack/v4/marketing/survey`, postParams, {
      body: JSON.stringify(surveyResponse)
    }).then(checkStatus).then(parseJsonResponse),
    saveSetupQuestionnaire: (props) => postRequest(`${apiRoot}jetpack/v4/setup/questionnaire`, postParams, {
      body: JSON.stringify(props)
    }).then(checkStatus).then(parseJsonResponse),
    updateLicensingError: (props) => postRequest(`${apiRoot}jetpack/v4/licensing/error`, postParams, {
      body: JSON.stringify(props)
    }).then(checkStatus).then(parseJsonResponse),
    updateLicenseKey: (license) => postRequest(`${apiRoot}jetpack/v4/licensing/set-license`, postParams, {
      body: JSON.stringify({ license })
    }).then(checkStatus).then(parseJsonResponse),
    getUserLicensesCounts: () => getRequest(`${apiRoot}jetpack/v4/licensing/user/counts`, getParams).then(checkStatus).then(parseJsonResponse),
    getUserLicenses: () => getRequest(`${apiRoot}jetpack/v4/licensing/user/licenses`, getParams).then(checkStatus).then(parseJsonResponse),
    updateLicensingActivationNoticeDismiss: (lastDetachedCount) => postRequest(`${apiRoot}jetpack/v4/licensing/user/activation-notice-dismiss`, postParams, {
      body: JSON.stringify({ last_detached_count: lastDetachedCount })
    }).then(checkStatus).then(parseJsonResponse),
    updateRecommendationsStep: (step) => postRequest(`${apiRoot}jetpack/v4/recommendations/step`, postParams, {
      body: JSON.stringify({ step })
    }).then(checkStatus),
    confirmIDCSafeMode: () => postRequest(`${apiRoot}jetpack/v4/identity-crisis/confirm-safe-mode`, postParams).then(
      checkStatus
    ),
    startIDCFresh: (redirectUri) => postRequest(`${apiRoot}jetpack/v4/identity-crisis/start-fresh`, postParams, {
      body: JSON.stringify({ redirect_uri: redirectUri })
    }).then(checkStatus).then(parseJsonResponse),
    migrateIDC: () => postRequest(`${apiRoot}jetpack/v4/identity-crisis/migrate`, postParams).then(
      checkStatus
    ),
    attachLicenses: (licenses) => postRequest(`${apiRoot}jetpack/v4/licensing/attach-licenses`, postParams, {
      body: JSON.stringify({ licenses })
    }).then(checkStatus).then(parseJsonResponse),
    fetchSearchPlanInfo: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/plan`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchSearchSettings: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateSearchSettings: (newSettings) => postRequest(`${wpcomOriginApiUrl}jetpack/v4/search/settings`, postParams, {
      body: JSON.stringify(newSettings)
    }).then(checkStatus).then(parseJsonResponse),
    fetchSearchStats: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/stats`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchWafSettings: () => getRequest(`${apiRoot}jetpack/v4/waf`, getParams).then(checkStatus).then(parseJsonResponse),
    updateWafSettings: (newSettings) => postRequest(`${apiRoot}jetpack/v4/waf`, postParams, {
      body: JSON.stringify(newSettings)
    }).then(checkStatus).then(parseJsonResponse),
    fetchWordAdsSettings: () => getRequest(`${apiRoot}jetpack/v4/wordads/settings`, getParams).then(checkStatus).then(parseJsonResponse),
    updateWordAdsSettings: (newSettings) => postRequest(`${apiRoot}jetpack/v4/wordads/settings`, postParams, {
      body: JSON.stringify(newSettings)
    }),
    fetchSearchPricing: () => getRequest(`${wpcomOriginApiUrl}jetpack/v4/search/pricing`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchMigrationStatus: () => getRequest(`${apiRoot}jetpack/v4/migration/status`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchBackupUndoEvent: () => getRequest(`${apiRoot}jetpack/v4/site/backup/undo-event`, getParams).then(checkStatus).then(parseJsonResponse),
    fetchBackupPreflightStatus: () => getRequest(`${apiRoot}jetpack/v4/site/backup/preflight`, getParams).then(checkStatus).then(parseJsonResponse)
  };
  function addCacheBuster(route) {
    const parts = route.split("?"), query = parts.length > 1 ? parts[1] : "", args = query.length ? query.split("&") : [];
    args.push("_cacheBuster=" + (/* @__PURE__ */ new Date()).getTime());
    return parts[0] + "?" + args.join("&");
  }
  function getRequest(route, params) {
    return fetch(cacheBusterCallback(route), params);
  }
  function postRequest(route, params, body) {
    return fetch(route, Object.assign({}, params, body)).catch(catchNetworkErrors);
  }
  function statsDataUrl(range) {
    let url = `${apiRoot}jetpack/v4/module/stats/data`;
    if (url.indexOf("?") !== -1) {
      url = url + `&range=${encodeURIComponent(range)}`;
    } else {
      url = url + `?range=${encodeURIComponent(range)}`;
    }
    return url;
  }
  function handleStatsResponseError(statsData) {
    const responseOk = statsData.general && statsData.general.response === void 0 || statsData.week && statsData.week.response === void 0 || statsData.month && statsData.month.response === void 0;
    return responseOk ? statsData : {};
  }
  Object.assign(this, methods);
}
var restApi = new JetpackRestApiClient();
var api_default = restApi;
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  if (response.status === 404) {
    return new Promise(() => {
      const err = response.redirected ? new Api404AfterRedirectError(response.redirected) : new Api404Error();
      throw err;
    });
  }
  return response.json().catch((e) => catchJsonParseError(e)).then((json) => {
    const error = new Error(`${json.message} (Status ${response.status})`);
    error.response = json;
    error.name = "ApiError";
    throw error;
  });
}
function parseJsonResponse(response) {
  return response.json().catch((e) => catchJsonParseError(e, response.redirected, response.url));
}
function catchJsonParseError(e, redirected, url) {
  const err = redirected ? new JsonParseAfterRedirectError(url) : new JsonParseError();
  throw err;
}
function catchNetworkErrors() {
  throw new FetchNetworkError();
}

// routes/index/stage.jsx
var import_api_fetch2 = __toESM(require_api_fetch());
var import_element6 = __toESM(require_element());

// ../../js-packages/components/build/components/jetpack-logo/index.js
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var import_i18n = __toESM(require_i18n(), 1);

// ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
var clsx_default = clsx;

// ../../js-packages/components/build/components/jetpack-logo/index.js
var JetpackLogo = ({ logoColor = "#069e08", showText = true, className, height = 32, title, ...otherProps }) => {
  const viewBox = showText ? "0 0 118 32" : "0 0 32 32";
  const logoTitle = title ?? (0, import_i18n.__)("Jetpack Logo", "jetpack-components");
  return (0, import_jsx_runtime.jsxs)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    x: "0px",
    y: "0px",
    viewBox,
    className: clsx_default("jetpack-logo", className),
    "aria-labelledby": "jetpack-logo-title",
    height,
    ...otherProps,
    // role="img" is required to prevent VoiceOver on Safari reading the content of the SVG
    role: "img",
    children: [
      (0, import_jsx_runtime.jsx)("title", { id: "jetpack-logo-title", children: logoTitle }),
      (0, import_jsx_runtime.jsx)("path", { fill: logoColor, d: "M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z" }),
      showText && (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        (0, import_jsx_runtime.jsx)("path", { d: "M41.3,26.6c-0.5-0.7-0.9-1.4-1.3-2.1c2.3-1.4,3-2.5,3-4.6V8h-3V6h6v13.4C46,22.8,45,24.8,41.3,26.6z" }),
        (0, import_jsx_runtime.jsx)("path", { d: "M65,18.4c0,1.1,0.8,1.3,1.4,1.3c0.5,0,2-0.2,2.6-0.4v2.1c-0.9,0.3-2.5,0.5-3.7,0.5c-1.5,0-3.2-0.5-3.2-3.1V12H60v-2h2.1V7.1 H65V10h4v2h-4V18.4z" }),
        (0, import_jsx_runtime.jsx)("path", { d: "M71,10h3v1.3c1.1-0.8,1.9-1.3,3.3-1.3c2.5,0,4.5,1.8,4.5,5.6s-2.2,6.3-5.8,6.3c-0.9,0-1.3-0.1-2-0.3V28h-3V10z M76.5,12.3 c-0.8,0-1.6,0.4-2.5,1.2v5.9c0.6,0.1,0.9,0.2,1.8,0.2c2,0,3.2-1.3,3.2-3.9C79,13.4,78.1,12.3,76.5,12.3z" }),
        (0, import_jsx_runtime.jsx)("path", { d: "M93,22h-3v-1.5c-0.9,0.7-1.9,1.5-3.5,1.5c-1.5,0-3.1-1.1-3.1-3.2c0-2.9,2.5-3.4,4.2-3.7l2.4-0.3v-0.3c0-1.5-0.5-2.3-2-2.3 c-0.7,0-2.3,0.5-3.7,1.1L84,11c1.2-0.4,3-1,4.4-1c2.7,0,4.6,1.4,4.6,4.7L93,22z M90,16.4l-2.2,0.4c-0.7,0.1-1.4,0.5-1.4,1.6 c0,0.9,0.5,1.4,1.3,1.4s1.5-0.5,2.3-1V16.4z" }),
        (0, import_jsx_runtime.jsx)("path", { d: "M104.5,21.3c-1.1,0.4-2.2,0.6-3.5,0.6c-4.2,0-5.9-2.4-5.9-5.9c0-3.7,2.3-6,6.1-6c1.4,0,2.3,0.2,3.2,0.5V13 c-0.8-0.3-2-0.6-3.2-0.6c-1.7,0-3.2,0.9-3.2,3.6c0,2.9,1.5,3.8,3.3,3.8c0.9,0,1.9-0.2,3.2-0.7V21.3z" }),
        (0, import_jsx_runtime.jsx)("path", { d: "M110,15.2c0.2-0.3,0.2-0.8,3.8-5.2h3.7l-4.6,5.7l5,6.3h-3.7l-4.2-5.8V22h-3V6h3V15.2z" }),
        (0, import_jsx_runtime.jsx)("path", { d: "M58.5,21.3c-1.5,0.5-2.7,0.6-4.2,0.6c-3.6,0-5.8-1.8-5.8-6c0-3.1,1.9-5.9,5.5-5.9s4.9,2.5,4.9,4.9c0,0.8,0,1.5-0.1,2h-7.3 c0.1,2.5,1.5,2.8,3.6,2.8c1.1,0,2.2-0.3,3.4-0.7C58.5,19,58.5,21.3,58.5,21.3z M56,15c0-1.4-0.5-2.9-2-2.9c-1.4,0-2.3,1.3-2.4,2.9 C51.6,15,56,15,56,15z" })
      ] })
    ]
  });
};
var jetpack_logo_default = JetpackLogo;

// ../../js-packages/components/build/tools/jp-redirect/index.js
function getRedirectUrl(source, args = {}) {
  const queryVars = {};
  let calypsoEnv;
  if (typeof window !== "undefined") {
    calypsoEnv = window?.JP_CONNECTION_INITIAL_STATE?.calypsoEnv;
  }
  if (source.search("https://") === 0) {
    const parsedUrl = new URL(source);
    source = `https://${parsedUrl.host}${parsedUrl.pathname}`;
    queryVars.url = encodeURIComponent(source);
  } else {
    queryVars.source = encodeURIComponent(source);
  }
  for (const argName in args) {
    queryVars[argName] = encodeURIComponent(args[argName]);
  }
  if (!Object.keys(queryVars).includes("site") && typeof jetpack_redirects !== "undefined" && Object.hasOwn(jetpack_redirects, "currentSiteRawUrl")) {
    queryVars.site = jetpack_redirects.currentBlogID ?? jetpack_redirects.currentSiteRawUrl;
  }
  if (calypsoEnv) {
    queryVars.calypso_env = calypsoEnv;
  }
  const queryString = Object.keys(queryVars).map((key) => key + "=" + queryVars[key]).join("&");
  return `https://jetpack.com/redirect/?` + queryString;
}

// ../../js-packages/components/build/components/automattic-byline-logo/index.js
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var import_i18n2 = __toESM(require_i18n(), 1);
var AutomatticBylineLogo = ({ title = (0, import_i18n2.__)("An Automattic Airline", "jetpack-components"), height = 7, className, ...otherProps }) => {
  return (0, import_jsx_runtime2.jsxs)("svg", { role: "img", x: "0", y: "0", viewBox: "0 0 935 38.2", enableBackground: "new 0 0 935 38.2", "aria-labelledby": "jp-automattic-byline-logo-title", height, className: clsx_default("jp-automattic-byline-logo", className), ...otherProps, children: [
    (0, import_jsx_runtime2.jsx)("desc", { id: "jp-automattic-byline-logo-title", children: title }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M317.1 38.2c-12.6 0-20.7-9.1-20.7-18.5v-1.2c0-9.6 8.2-18.5 20.7-18.5 12.6 0 20.8 8.9 20.8 18.5v1.2C337.9 29.1 329.7 38.2 317.1 38.2zM331.2 18.6c0-6.9-5-13-14.1-13s-14 6.1-14 13v0.9c0 6.9 5 13.1 14 13.1s14.1-6.2 14.1-13.1V18.6zM175 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7L157 1.3h5.5L182 36.8H175zM159.7 8.2L152 23.1h15.7L159.7 8.2zM212.4 38.2c-12.7 0-18.7-6.9-18.7-16.2V1.3h6.6v20.9c0 6.6 4.3 10.5 12.5 10.5 8.4 0 11.9-3.9 11.9-10.5V1.3h6.7V22C231.4 30.8 225.8 38.2 212.4 38.2zM268.6 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H268.6zM397.3 36.8V8.7l-1.8 3.1 -14.9 25h-3.3l-14.7-25 -1.8-3.1v28.1h-6.5V1.3h9.2l14 24.4 1.7 3 1.7-3 13.9-24.4h9.1v35.5H397.3zM454.4 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7l19.2-35.5h5.5l19.5 35.5H454.4zM439.1 8.2l-7.7 14.9h15.7L439.1 8.2zM488.4 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H488.4zM537.3 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H537.3zM569.3 36.8V4.6c2.7 0 3.7-1.4 3.7-3.4h2.8v35.5L569.3 36.8 569.3 36.8zM628 11.3c-3.2-2.9-7.9-5.7-14.2-5.7 -9.5 0-14.8 6.5-14.8 13.3v0.7c0 6.7 5.4 13 15.3 13 5.9 0 10.8-2.8 13.9-5.7l4 4.2c-3.9 3.8-10.5 7.1-18.3 7.1 -13.4 0-21.6-8.7-21.6-18.3v-1.2c0-9.6 8.9-18.7 21.9-18.7 7.5 0 14.3 3.1 18 7.1L628 11.3zM321.5 12.4c1.2 0.8 1.5 2.4 0.8 3.6l-6.1 9.4c-0.8 1.2-2.4 1.6-3.6 0.8l0 0c-1.2-0.8-1.5-2.4-0.8-3.6l6.1-9.4C318.7 11.9 320.3 11.6 321.5 12.4L321.5 12.4z" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M37.5 36.7l-4.7-8.9H11.7l-4.6 8.9H0L19.4 0.8H25l19.7 35.9H37.5zM22 7.8l-7.8 15.1h15.9L22 7.8zM82.8 36.7l-23.3-24 -2.3-2.5v26.6h-6.7v-36H57l22.6 24 2.3 2.6V0.8h6.7v35.9H82.8z" }),
    (0, import_jsx_runtime2.jsx)("path", { d: "M719.9 37l-4.8-8.9H694l-4.6 8.9h-7.1l19.5-36h5.6l19.8 36H719.9zM704.4 8l-7.8 15.1h15.9L704.4 8zM733 37V1h6.8v36H733zM781 37c-1.8 0-2.6-2.5-2.9-5.8l-0.2-3.7c-0.2-3.6-1.7-5.1-8.4-5.1h-12.8V37H750V1h19.6c10.8 0 15.7 4.3 15.7 9.9 0 3.9-2 7.7-9 9 7 0.5 8.5 3.7 8.6 7.9l0.1 3c0.1 2.5 0.5 4.3 2.2 6.1V37H781zM778.5 11.8c0-2.6-2.1-5.1-7.9-5.1h-13.8v10.8h14.4c5 0 7.3-2.4 7.3-5.2V11.8zM794.8 37V1h6.8v30.4h28.2V37H794.8zM836.7 37V1h6.8v36H836.7zM886.2 37l-23.4-24.1 -2.3-2.5V37h-6.8V1h6.5l22.7 24.1 2.3 2.6V1h6.8v36H886.2zM902.3 37V1H935v5.6h-26v9.2h20v5.5h-20v10.1h26V37H902.3z" })
  ] });
};
var automattic_byline_logo_default = AutomatticBylineLogo;

// ../../js-packages/components/build/components/jetpack-footer/index.js
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);

// ../../js-packages/script-data/src/utils.ts
function getScriptData() {
  return window.JetpackScriptData;
}
function getAdminUrl(path = "") {
  return `${getScriptData()?.site.admin_url}${path}`;
}
function isWpcomPlatformSite() {
  return getScriptData()?.site?.is_wpcom_platform;
}

// ../../js-packages/components/build/components/jetpack-footer/index.js
var import_i18n4 = __toESM(require_i18n(), 1);

// ../../../node_modules/.pnpm/@wordpress+ui@0.13.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/ui/build-module/badge/badge.mjs
var import_element2 = __toESM(require_element(), 1);

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/useRefWithInit.js
var React = __toESM(require_react(), 1);
var UNINITIALIZED = {};
function useRefWithInit(init, initArg) {
  const ref = React.useRef(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }
  return ref;
}

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/warn.js
var set;
if (true) {
  set = /* @__PURE__ */ new Set();
}
function warn(...messages) {
  if (true) {
    const messageKey = messages.join(" ");
    if (!set.has(messageKey)) {
      set.add(messageKey);
      console.warn(`Base UI: ${messageKey}`);
    }
  }
}

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/internals/useRenderElement.js
var React4 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/useMergedRefs.js
function useMergedRefs(a, b, c, d) {
  const forkRef = useRefWithInit(createForkRef).current;
  if (didChange(forkRef, a, b, c, d)) {
    update(forkRef, [a, b, c, d]);
  }
  return forkRef.callback;
}
function useMergedRefsN(refs) {
  const forkRef = useRefWithInit(createForkRef).current;
  if (didChangeN(forkRef, refs)) {
    update(forkRef, refs);
  }
  return forkRef.callback;
}
function createForkRef() {
  return {
    callback: null,
    cleanup: null,
    refs: []
  };
}
function didChange(forkRef, a, b, c, d) {
  return forkRef.refs[0] !== a || forkRef.refs[1] !== b || forkRef.refs[2] !== c || forkRef.refs[3] !== d;
}
function didChangeN(forkRef, newRefs) {
  return forkRef.refs.length !== newRefs.length || forkRef.refs.some((ref, index) => ref !== newRefs[index]);
}
function update(forkRef, refs) {
  forkRef.refs = refs;
  if (refs.every((ref) => ref == null)) {
    forkRef.callback = null;
    return;
  }
  forkRef.callback = (instance) => {
    if (forkRef.cleanup) {
      forkRef.cleanup();
      forkRef.cleanup = null;
    }
    if (instance != null) {
      const cleanupCallbacks = Array(refs.length).fill(null);
      for (let i = 0; i < refs.length; i += 1) {
        const ref = refs[i];
        if (ref == null) {
          continue;
        }
        switch (typeof ref) {
          case "function": {
            const refCleanup = ref(instance);
            if (typeof refCleanup === "function") {
              cleanupCallbacks[i] = refCleanup;
            }
            break;
          }
          case "object": {
            ref.current = instance;
            break;
          }
          default:
        }
      }
      forkRef.cleanup = () => {
        for (let i = 0; i < refs.length; i += 1) {
          const ref = refs[i];
          if (ref == null) {
            continue;
          }
          switch (typeof ref) {
            case "function": {
              const cleanupCallback = cleanupCallbacks[i];
              if (typeof cleanupCallback === "function") {
                cleanupCallback();
              } else {
                ref(null);
              }
              break;
            }
            case "object": {
              ref.current = null;
              break;
            }
            default:
          }
        }
      };
    }
  };
}

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/getReactElementRef.js
var React3 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/reactVersion.js
var React2 = __toESM(require_react(), 1);
var majorVersion = parseInt(React2.version, 10);
function isReactVersionAtLeast(reactVersionToCheck) {
  return majorVersion >= reactVersionToCheck;
}

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/getReactElementRef.js
function getReactElementRef(element) {
  if (!/* @__PURE__ */ React3.isValidElement(element)) {
    return null;
  }
  const reactElement = element;
  const propsWithRef = reactElement.props;
  return (isReactVersionAtLeast(19) ? propsWithRef?.ref : reactElement.ref) ?? null;
}

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/mergeObjects.js
function mergeObjects(a, b) {
  if (a && !b) {
    return a;
  }
  if (!a && b) {
    return b;
  }
  if (a || b) {
    return {
      ...a,
      ...b
    };
  }
  return void 0;
}

// ../../../node_modules/.pnpm/@base-ui+utils@0.2.9_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/utils/esm/empty.js
var EMPTY_ARRAY = Object.freeze([]);
var EMPTY_OBJECT = Object.freeze({});

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/internals/getStateAttributesProps.js
function getStateAttributesProps(state, customMapping) {
  const props = {};
  for (const key in state) {
    const value = state[key];
    if (customMapping?.hasOwnProperty(key)) {
      const customProps = customMapping[key](value);
      if (customProps != null) {
        Object.assign(props, customProps);
      }
      continue;
    }
    if (value === true) {
      props[`data-${key.toLowerCase()}`] = "";
    } else if (value) {
      props[`data-${key.toLowerCase()}`] = value.toString();
    }
  }
  return props;
}

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/utils/resolveClassName.js
function resolveClassName(className, state) {
  return typeof className === "function" ? className(state) : className;
}

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/utils/resolveStyle.js
function resolveStyle(style, state) {
  return typeof style === "function" ? style(state) : style;
}

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/merge-props/mergeProps.js
var EMPTY_PROPS = {};
function mergeProps(a, b, c, d, e) {
  if (!c && !d && !e && !a) {
    return createInitialMergedProps(b);
  }
  let merged = createInitialMergedProps(a);
  if (b) {
    merged = mergeInto(merged, b);
  }
  if (c) {
    merged = mergeInto(merged, c);
  }
  if (d) {
    merged = mergeInto(merged, d);
  }
  if (e) {
    merged = mergeInto(merged, e);
  }
  return merged;
}
function mergePropsN(props) {
  if (props.length === 0) {
    return EMPTY_PROPS;
  }
  if (props.length === 1) {
    return createInitialMergedProps(props[0]);
  }
  let merged = createInitialMergedProps(props[0]);
  for (let i = 1; i < props.length; i += 1) {
    merged = mergeInto(merged, props[i]);
  }
  return merged;
}
function createInitialMergedProps(inputProps) {
  if (isPropsGetter(inputProps)) {
    return {
      ...resolvePropsGetter(inputProps, EMPTY_PROPS)
    };
  }
  return copyInitialProps(inputProps);
}
function mergeInto(merged, inputProps) {
  if (isPropsGetter(inputProps)) {
    return resolvePropsGetter(inputProps, merged);
  }
  return mutablyMergeInto(merged, inputProps);
}
function copyInitialProps(inputProps) {
  const copiedProps = {
    ...inputProps
  };
  for (const propName in copiedProps) {
    const propValue = copiedProps[propName];
    if (isEventHandler(propName, propValue)) {
      copiedProps[propName] = wrapEventHandler(propValue);
    }
  }
  return copiedProps;
}
function mutablyMergeInto(mergedProps, externalProps) {
  if (!externalProps) {
    return mergedProps;
  }
  for (const propName in externalProps) {
    const externalPropValue = externalProps[propName];
    switch (propName) {
      case "style": {
        mergedProps[propName] = mergeObjects(mergedProps.style, externalPropValue);
        break;
      }
      case "className": {
        mergedProps[propName] = mergeClassNames(mergedProps.className, externalPropValue);
        break;
      }
      default: {
        if (isEventHandler(propName, externalPropValue)) {
          mergedProps[propName] = mergeEventHandlers(mergedProps[propName], externalPropValue);
        } else {
          mergedProps[propName] = externalPropValue;
        }
      }
    }
  }
  return mergedProps;
}
function isEventHandler(key, value) {
  const code0 = key.charCodeAt(0);
  const code1 = key.charCodeAt(1);
  const code2 = key.charCodeAt(2);
  return code0 === 111 && code1 === 110 && code2 >= 65 && code2 <= 90 && (typeof value === "function" || typeof value === "undefined");
}
function isPropsGetter(inputProps) {
  return typeof inputProps === "function";
}
function resolvePropsGetter(inputProps, previousProps) {
  if (isPropsGetter(inputProps)) {
    return inputProps(previousProps);
  }
  return inputProps ?? EMPTY_PROPS;
}
function mergeEventHandlers(ourHandler, theirHandler) {
  if (!theirHandler) {
    return ourHandler;
  }
  if (!ourHandler) {
    return wrapEventHandler(theirHandler);
  }
  return (...args) => {
    const event = args[0];
    if (isSyntheticEvent(event)) {
      const baseUIEvent = event;
      makeEventPreventable(baseUIEvent);
      const result2 = theirHandler(...args);
      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler?.(...args);
      }
      return result2;
    }
    const result = theirHandler(...args);
    ourHandler?.(...args);
    return result;
  };
}
function wrapEventHandler(handler) {
  if (!handler) {
    return handler;
  }
  return (...args) => {
    const event = args[0];
    if (isSyntheticEvent(event)) {
      makeEventPreventable(event);
    }
    return handler(...args);
  };
}
function makeEventPreventable(event) {
  event.preventBaseUIHandler = () => {
    event.baseUIHandlerPrevented = true;
  };
  return event;
}
function mergeClassNames(ourClassName, theirClassName) {
  if (theirClassName) {
    if (ourClassName) {
      return theirClassName + " " + ourClassName;
    }
    return theirClassName;
  }
  return ourClassName;
}
function isSyntheticEvent(event) {
  return event != null && typeof event === "object" && "nativeEvent" in event;
}

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/internals/useRenderElement.js
var import_react = __toESM(require_react(), 1);
function useRenderElement(element, componentProps, params = {}) {
  const renderProp = componentProps.render;
  const outProps = useRenderElementProps(componentProps, params);
  if (params.enabled === false) {
    return null;
  }
  const state = params.state ?? EMPTY_OBJECT;
  return evaluateRenderProp(element, renderProp, outProps, state);
}
function useRenderElementProps(componentProps, params = {}) {
  const {
    className: classNameProp,
    style: styleProp,
    render: renderProp
  } = componentProps;
  const {
    state = EMPTY_OBJECT,
    ref,
    props,
    stateAttributesMapping,
    enabled = true
  } = params;
  const className = enabled ? resolveClassName(classNameProp, state) : void 0;
  const style = enabled ? resolveStyle(styleProp, state) : void 0;
  const stateProps = enabled ? getStateAttributesProps(state, stateAttributesMapping) : EMPTY_OBJECT;
  const resolvedProps = enabled && props ? resolveRenderFunctionProps(props) : void 0;
  const outProps = enabled ? mergeObjects(stateProps, resolvedProps) ?? {} : EMPTY_OBJECT;
  if (typeof document !== "undefined") {
    if (!enabled) {
      useMergedRefs(null, null);
    } else if (Array.isArray(ref)) {
      outProps.ref = useMergedRefsN([outProps.ref, getReactElementRef(renderProp), ...ref]);
    } else {
      outProps.ref = useMergedRefs(outProps.ref, getReactElementRef(renderProp), ref);
    }
  }
  if (!enabled) {
    return EMPTY_OBJECT;
  }
  if (className !== void 0) {
    outProps.className = mergeClassNames(outProps.className, className);
  }
  if (style !== void 0) {
    outProps.style = mergeObjects(outProps.style, style);
  }
  return outProps;
}
function resolveRenderFunctionProps(props) {
  if (Array.isArray(props)) {
    return mergePropsN(props);
  }
  return mergeProps(void 0, props);
}
var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
var COMPONENT_IDENTIFIER_PATTERN = /^[A-Z][A-Za-z0-9$]*$/;
var LOWERCASE_CHARACTER_PATTERN = /[a-z]/;
function evaluateRenderProp(element, render, props, state) {
  if (render) {
    if (typeof render === "function") {
      if (true) {
        warnIfRenderPropLooksLikeComponent(render);
      }
      return render(props, state);
    }
    const mergedProps = mergeProps(props, render.props);
    mergedProps.ref = props.ref;
    let newElement = render;
    if (newElement?.$$typeof === REACT_LAZY_TYPE) {
      const children = React4.Children.toArray(render);
      newElement = children[0];
    }
    if (true) {
      if (!/* @__PURE__ */ React4.isValidElement(newElement)) {
        throw new Error(["Base UI: The `render` prop was provided an invalid React element as `React.isValidElement(render)` is `false`.", "A valid React element must be provided to the `render` prop because it is cloned with props to replace the default element.", "https://base-ui.com/r/invalid-render-prop"].join("\n"));
      }
    }
    return /* @__PURE__ */ React4.cloneElement(newElement, mergedProps);
  }
  if (element) {
    if (typeof element === "string") {
      return renderTag(element, props);
    }
  }
  throw new Error(true ? "Base UI: Render element or function are not defined." : formatErrorMessage_default(8));
}
function warnIfRenderPropLooksLikeComponent(renderFn) {
  const functionName = renderFn.name;
  if (functionName.length === 0) {
    return;
  }
  if (!COMPONENT_IDENTIFIER_PATTERN.test(functionName)) {
    return;
  }
  if (!LOWERCASE_CHARACTER_PATTERN.test(functionName)) {
    return;
  }
  warn(`The \`render\` prop received a function named \`${functionName}\` that starts with an uppercase letter.`, "This usually means a React component was passed directly as `render={Component}`.", "Base UI calls `render` as a plain function, which can break the Rules of Hooks during reconciliation.", "If this is an intentional render callback, rename it to start with a lowercase letter.", "Use `render={<Component />}` or `render={(props) => <Component {...props} />}` instead.", "https://base-ui.com/r/invalid-render-prop");
}
function renderTag(Tag, props) {
  if (Tag === "button") {
    return /* @__PURE__ */ (0, import_react.createElement)("button", {
      type: "button",
      ...props,
      key: props.key
    });
  }
  if (Tag === "img") {
    return /* @__PURE__ */ (0, import_react.createElement)("img", {
      alt: "",
      ...props,
      key: props.key
    });
  }
  return /* @__PURE__ */ React4.createElement(Tag, props);
}

// ../../../node_modules/.pnpm/@base-ui+react@1.5.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui/react/esm/use-render/useRender.js
function useRender(params) {
  return useRenderElement(params.defaultTagName ?? "div", params, params);
}

// ../../../node_modules/.pnpm/@wordpress+ui@0.13.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/ui/build-module/text/text.mjs
var import_element = __toESM(require_element(), 1);
var STYLE_HASH_ATTRIBUTE = "data-wp-hash";
function getRuntime() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument(targetDocument) {
  const runtime = getRuntime();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle(hash, css) {
  const runtime = getRuntime();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle(targetDocument, hash, css);
  }
}
if (typeof process === "undefined" || true) {
  registerStyle("0c8601dd83", '@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;@layer wp-ui-components{._83ed8a8da5dd50ea__text{margin:0}._14437cfb77831647__heading-2xl{--_gcd-heading-font-size:var(--wpds-typography-font-size-2xl,32px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-medium,499);--_gcd-p-font-size:var(--wpds-typography-font-size-2xl,32px);--_gcd-p-line-height:var(--wpds-typography-line-height-2xl,40px);font-size:var(--wpds-typography-font-size-2xl,32px);line-height:var(--wpds-typography-line-height-2xl,40px)}._14437cfb77831647__heading-2xl,._3c78b7fa9b4072dd__heading-xl{font-family:var(--wpds-typography-font-family-heading,-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif);font-weight:var(--wpds-typography-font-weight-medium,499)}._3c78b7fa9b4072dd__heading-xl{--_gcd-heading-font-size:var(--wpds-typography-font-size-xl,20px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-medium,499);--_gcd-p-font-size:var(--wpds-typography-font-size-xl,20px);--_gcd-p-line-height:var(--wpds-typography-line-height-md,24px);font-size:var(--wpds-typography-font-size-xl,20px);line-height:var(--wpds-typography-line-height-md,24px)}.aa58f227716bcde2__heading-lg{--_gcd-heading-font-size:var(--wpds-typography-font-size-lg,15px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-medium,499);--_gcd-p-font-size:var(--wpds-typography-font-size-lg,15px);--_gcd-p-line-height:var(--wpds-typography-line-height-sm,20px);font-size:var(--wpds-typography-font-size-lg,15px)}.aa58f227716bcde2__heading-lg,.fc4da56d8dfe52c4__heading-md{font-family:var(--wpds-typography-font-family-heading,-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif);font-weight:var(--wpds-typography-font-weight-medium,499);line-height:var(--wpds-typography-line-height-sm,20px)}.fc4da56d8dfe52c4__heading-md{--_gcd-heading-font-size:var(--wpds-typography-font-size-md,13px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-medium,499);--_gcd-p-font-size:var(--wpds-typography-font-size-md,13px);--_gcd-p-line-height:var(--wpds-typography-line-height-sm,20px);font-size:var(--wpds-typography-font-size-md,13px)}.a9b78c7c82e8dff7__heading-sm{--_gcd-heading-font-size:var(--wpds-typography-font-size-xs,11px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-medium,499);--_gcd-p-font-size:var(--wpds-typography-font-size-xs,11px);--_gcd-p-line-height:var(--wpds-typography-line-height-xs,16px);font-family:var(--wpds-typography-font-family-heading,-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif);font-size:var(--wpds-typography-font-size-xs,11px);font-weight:var(--wpds-typography-font-weight-medium,499);line-height:var(--wpds-typography-line-height-xs,16px);text-transform:uppercase}._305ff559e52180d5__body-xl{--_gcd-heading-font-size:var(--wpds-typography-font-size-xl,20px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-regular,400);--_gcd-p-font-size:var(--wpds-typography-font-size-xl,20px);--_gcd-p-line-height:var(--wpds-typography-line-height-xl,32px);font-size:var(--wpds-typography-font-size-xl,20px);line-height:var(--wpds-typography-line-height-xl,32px)}._305ff559e52180d5__body-xl,.ca1aa3fc2029e958__body-lg{font-family:var(--wpds-typography-font-family-body,-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif);font-weight:var(--wpds-typography-font-weight-regular,400)}.ca1aa3fc2029e958__body-lg{--_gcd-heading-font-size:var(--wpds-typography-font-size-lg,15px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-regular,400);--_gcd-p-font-size:var(--wpds-typography-font-size-lg,15px);--_gcd-p-line-height:var(--wpds-typography-line-height-md,24px);font-size:var(--wpds-typography-font-size-lg,15px);line-height:var(--wpds-typography-line-height-md,24px)}._131101940be12424__body-md{--_gcd-heading-font-size:var(--wpds-typography-font-size-md,13px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-regular,400);--_gcd-p-font-size:var(--wpds-typography-font-size-md,13px);--_gcd-p-line-height:var(--wpds-typography-line-height-sm,20px);font-size:var(--wpds-typography-font-size-md,13px);line-height:var(--wpds-typography-line-height-sm,20px)}._0e8d87a42c1f75fa__body-sm,._131101940be12424__body-md{font-family:var(--wpds-typography-font-family-body,-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif);font-weight:var(--wpds-typography-font-weight-regular,400)}._0e8d87a42c1f75fa__body-sm{--_gcd-heading-font-size:var(--wpds-typography-font-size-sm,12px);--_gcd-heading-font-weight:var(--wpds-typography-font-weight-regular,400);--_gcd-p-font-size:var(--wpds-typography-font-size-sm,12px);--_gcd-p-line-height:var(--wpds-typography-line-height-xs,16px);font-size:var(--wpds-typography-font-size-sm,12px);line-height:var(--wpds-typography-line-height-xs,16px)}}');
}
var style_default = { "text": "_83ed8a8da5dd50ea__text", "heading-2xl": "_14437cfb77831647__heading-2xl", "heading-xl": "_3c78b7fa9b4072dd__heading-xl", "heading-lg": "aa58f227716bcde2__heading-lg", "heading-md": "fc4da56d8dfe52c4__heading-md", "heading-sm": "a9b78c7c82e8dff7__heading-sm", "body-xl": "_305ff559e52180d5__body-xl", "body-lg": "ca1aa3fc2029e958__body-lg", "body-md": "_131101940be12424__body-md", "body-sm": "_0e8d87a42c1f75fa__body-sm" };
if (typeof process === "undefined" || true) {
  registerStyle("1fb29d3a3c", "._6defc79820e382c6__button{box-sizing:var(--_gcd-button-box-sizing,border-box);font-family:var(--_gcd-button-font-family,inherit);font-size:var(--_gcd-button-font-size,inherit);font-weight:var(--_gcd-button-font-weight,inherit)}.d2cff2e5dea83bd1__input{box-sizing:var(--_gcd-input-box-sizing,border-box);font-family:var(--_gcd-input-font-family,inherit);font-size:var(--_gcd-input-font-size,inherit);font-weight:var(--_gcd-input-font-weight,inherit);margin:var(--_gcd-input-margin,0);&:is(textarea,[type=text],[type=password],[type=color],[type=date],[type=datetime],[type=datetime-local],[type=email],[type=month],[type=number],[type=search],[type=tel],[type=time],[type=url],[type=week]){background-color:var(--_gcd-input-background-color,#0000);border:var(--_gcd-input-border,none);border-radius:var(--_gcd-input-border-radius,0);box-shadow:var(--_gcd-input-box-shadow,0 0 0 #0000);color:var(--_gcd-input-color,var(--wpds-color-fg-interactive-neutral,#1e1e1e));&:focus{border-color:var(--_gcd-input-border-color-focus,var(--wp-admin-theme-color));box-shadow:var(--_gcd-input-box-shadow-focus,none);outline:var(--_gcd-input-outline-focus,none)}&:disabled{background:var(--_gcd-input-background-disabled,#0000);border-color:var(--_gcd-input-border-color-disabled,#0000);box-shadow:var(--_gcd-input-box-shadow-disabled,none);color:var(--_gcd-input-color-disabled,var(--wpds-color-fg-interactive-neutral-disabled,#8d8d8d))}&::placeholder{color:var(--_gcd-input-placeholder-color,var(--wpds-color-fg-interactive-neutral-disabled,#8d8d8d))}}&:is(textarea,[type=text],[type=password],[type=date],[type=datetime],[type=datetime-local],[type=email],[type=month],[type=number],[type=search],[type=tel],[type=time],[type=url],[type=week]){line-height:var(--_gcd-input-line-height,inherit);min-height:var(--_gcd-input-min-height,auto);padding:var(--_gcd-input-padding,0)}}._547d86373d02e108__textarea{box-sizing:var(--_gcd-textarea-box-sizing,border-box);overflow:var(--_gcd-textarea-overflow,auto);resize:var(--_gcd-textarea-resize,block)}._8c15fd0ed9f28ba4__div{outline:var(--_gcd-div-outline,0 solid #0000)}p._43cec3e1eec1066d__p{font-size:var(--_gcd-p-font-size,13px);line-height:var(--_gcd-p-line-height,1.5);margin:var(--_gcd-p-margin,0)}:is(h1,h2,h3,h4,h5,h6).e97669c6d9a38497__heading{color:var(--_gcd-heading-color,var(--wpds-color-fg-content-neutral,#1e1e1e));font-size:var(--_gcd-heading-font-size,inherit);font-weight:var(--_gcd-heading-font-weight,var(--wpds-typography-font-weight-medium,499));margin:var(--_gcd-heading-margin,0)}._2c0831b0499dbd6e__a,._2c0831b0499dbd6e__a:is(:hover,:focus,:active){border-radius:var(--_gcd-a-border-radius,0);box-shadow:var(--_gcd-a-box-shadow,none);color:var(--_gcd-a-color,inherit);outline:var(--_gcd-a-outline,0 solid #0000);transition:var(--_gcd-a-transition,none)}");
}
var global_css_defense_default = { "button": "_6defc79820e382c6__button", "input": "d2cff2e5dea83bd1__input", "textarea": "_547d86373d02e108__textarea", "div": "_8c15fd0ed9f28ba4__div", "p": "_43cec3e1eec1066d__p", "heading": "e97669c6d9a38497__heading", "a": "_2c0831b0499dbd6e__a" };
var Text = (0, import_element.forwardRef)(function Text2({ variant = "body-md", render, className, ...props }, ref) {
  const element = useRender({
    render,
    defaultTagName: "span",
    ref,
    props: mergeProps(props, {
      className: clsx_default(
        style_default.text,
        global_css_defense_default.heading,
        global_css_defense_default.p,
        style_default[variant],
        className
      )
    })
  });
  return element;
});

// ../../../node_modules/.pnpm/@wordpress+ui@0.13.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/ui/build-module/badge/badge.mjs
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var STYLE_HASH_ATTRIBUTE2 = "data-wp-hash";
function getRuntime2() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument2(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash2(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE2}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE2) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle2(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime2();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash2(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE2, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument2(targetDocument) {
  const runtime = getRuntime2();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle2(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle2(hash, css) {
  const runtime = getRuntime2();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle2(targetDocument, hash, css);
  }
}
if (typeof process === "undefined" || true) {
  registerStyle2("d6a685e1aa", "@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;@layer wp-ui-components{._96e6251aad1a6136__badge{border-radius:var(--wpds-border-radius-lg,8px);padding-block:var(--wpds-dimension-padding-xs,4px);padding-inline:var(--wpds-dimension-padding-sm,8px)}._99f7158cb520f750__is-high-intent{background-color:var(--wpds-color-bg-surface-error,#f6e6e3);color:var(--wpds-color-fg-content-error,#470000)}.c20ebef2365bc8b7__is-medium-intent{background-color:var(--wpds-color-bg-surface-warning,#fde6be);color:var(--wpds-color-fg-content-warning,#2e1900)}._365e1626c6202e52__is-low-intent{background-color:var(--wpds-color-bg-surface-caution,#fee995);color:var(--wpds-color-fg-content-caution,#281d00)}._33f8198127ddf4ef__is-stable-intent{background-color:var(--wpds-color-bg-surface-success,#c6f7cd);color:var(--wpds-color-fg-content-success,#002900)}._04c1aca8fc449412__is-informational-intent{background-color:var(--wpds-color-bg-surface-info,#deebfa);color:var(--wpds-color-fg-content-info,#001b4f)}._90726e69d495ec19__is-draft-intent{background-color:var(--wpds-color-bg-surface-neutral-weak,#f4f4f4);color:var(--wpds-color-fg-content-neutral,#1e1e1e)}._898f4a544993bd39__is-none-intent{background-color:var(--wpds-color-bg-surface-neutral-strong,#fff);border:var(--wpds-border-width-xs,1px) solid var(--wpds-color-stroke-surface-neutral,#dbdbdb);color:var(--wpds-color-fg-content-neutral,#1e1e1e);padding-block:calc(var(--wpds-dimension-padding-xs, 4px) - var(--wpds-border-width-xs, 1px));padding-inline:calc(var(--wpds-dimension-padding-sm, 8px) - var(--wpds-border-width-xs, 1px))}}");
}
var style_default2 = { "badge": "_96e6251aad1a6136__badge", "is-high-intent": "_99f7158cb520f750__is-high-intent", "is-medium-intent": "c20ebef2365bc8b7__is-medium-intent", "is-low-intent": "_365e1626c6202e52__is-low-intent", "is-stable-intent": "_33f8198127ddf4ef__is-stable-intent", "is-informational-intent": "_04c1aca8fc449412__is-informational-intent", "is-draft-intent": "_90726e69d495ec19__is-draft-intent", "is-none-intent": "_898f4a544993bd39__is-none-intent" };
var Badge = (0, import_element2.forwardRef)(function Badge2({ intent = "none", className, ...props }, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    Text,
    {
      ref,
      className: clsx_default(
        style_default2.badge,
        style_default2[`is-${intent}-intent`],
        className
      ),
      ...props,
      variant: "body-sm"
    }
  );
});

// ../../../node_modules/.pnpm/@wordpress+ui@0.13.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/ui/build-module/stack/stack.mjs
var import_element3 = __toESM(require_element(), 1);
var STYLE_HASH_ATTRIBUTE3 = "data-wp-hash";
function getRuntime3() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument3(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash3(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE3}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE3) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle3(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime3();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash3(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE3, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument3(targetDocument) {
  const runtime = getRuntime3();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle3(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle3(hash, css) {
  const runtime = getRuntime3();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle3(targetDocument, hash, css);
  }
}
if (typeof process === "undefined" || true) {
  registerStyle3("b51ff41489", "@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;@layer wp-ui-components{._19ce0419607e1896__stack{display:flex}}");
}
var style_default3 = { "stack": "_19ce0419607e1896__stack" };
var gapTokens = {
  xs: "var(--wpds-dimension-gap-xs, 4px)",
  sm: "var(--wpds-dimension-gap-sm, 8px)",
  md: "var(--wpds-dimension-gap-md, 12px)",
  lg: "var(--wpds-dimension-gap-lg, 16px)",
  xl: "var(--wpds-dimension-gap-xl, 24px)",
  "2xl": "var(--wpds-dimension-gap-2xl, 32px)",
  "3xl": "var(--wpds-dimension-gap-3xl, 40px)"
};
var Stack = (0, import_element3.forwardRef)(function Stack2({ direction, gap, align, justify, wrap, render, ...props }, ref) {
  const style = {
    gap: gap && gapTokens[gap],
    alignItems: align,
    justifyContent: justify,
    flexDirection: direction,
    flexWrap: wrap
  };
  const element = useRender({
    render,
    ref,
    props: mergeProps(props, { style, className: style_default3.stack })
  });
  return element;
});

// ../../../node_modules/.pnpm/@wordpress+ui@0.13.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/ui/build-module/link/link.mjs
var import_element4 = __toESM(require_element(), 1);
var import_i18n3 = __toESM(require_i18n(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var STYLE_HASH_ATTRIBUTE4 = "data-wp-hash";
function getRuntime4() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument4(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash4(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE4}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE4) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle4(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime4();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash4(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE4, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument4(targetDocument) {
  const runtime = getRuntime4();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle4(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle4(hash, css) {
  const runtime = getRuntime4();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle4(targetDocument, hash, css);
  }
}
if (typeof process === "undefined" || true) {
  registerStyle4("e3ae230cea", "@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;@layer wp-ui-utilities{._336cd3e4e743482f__box-sizing{box-sizing:border-box;*,:after,:before{box-sizing:inherit}}}");
}
var resets_default = { "box-sizing": "_336cd3e4e743482f__box-sizing" };
if (typeof process === "undefined" || true) {
  registerStyle4("2a5ab8f3a7", "@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;@layer wp-ui-utilities{._08e8a2e44959f892__outset-ring--focus,._970d04df7376df67__outset-ring--focus-within-except-active,.c5cb3ee4bddaa8e4__outset-ring--focus-within-visible,.cd83dfc2126a0846__outset-ring--focus-within,.d0541bc9dd9dc7b6__outset-ring--focus-visible,.e25b2bdd7aa21721__outset-ring--focus-except-active,.ecadb9e080e2dfa5__outset-ring--focus-parent-visible{@media not (prefers-reduced-motion){--_gcd-a-transition:outline 0.1s ease-out;transition:outline .1s ease-out}outline:0 solid #0000;outline-offset:1px}._08e8a2e44959f892__outset-ring--focus:focus,._970d04df7376df67__outset-ring--focus-within-except-active:focus-within:not(:has(:active)),.c5cb3ee4bddaa8e4__outset-ring--focus-within-visible:focus-within:has(:focus-visible),.cd83dfc2126a0846__outset-ring--focus-within:focus-within,.d0541bc9dd9dc7b6__outset-ring--focus-visible:focus-visible,.e25b2bdd7aa21721__outset-ring--focus-except-active:focus:not(:active),:focus-visible .ecadb9e080e2dfa5__outset-ring--focus-parent-visible{--_gcd-a-outline:var(--wpds-border-width-focus,var(--wp-admin-border-width-focus,2px)) solid var(--wpds-color-stroke-focus-brand,var(--wp-admin-theme-color,#3858e9));--_gcd-div-outline:var(--wpds-border-width-focus,var(--wp-admin-border-width-focus,2px)) solid var(--wpds-color-stroke-focus-brand,var(--wp-admin-theme-color,#3858e9));outline:var(--wpds-border-width-focus,var(--wp-admin-border-width-focus,2px)) solid var(--wpds-color-stroke-focus-brand,var(--wp-admin-theme-color,#3858e9))}}");
}
var focus_default = { "outset-ring--focus": "_08e8a2e44959f892__outset-ring--focus", "outset-ring--focus-except-active": "e25b2bdd7aa21721__outset-ring--focus-except-active", "outset-ring--focus-visible": "d0541bc9dd9dc7b6__outset-ring--focus-visible", "outset-ring--focus-within": "cd83dfc2126a0846__outset-ring--focus-within", "outset-ring--focus-within-except-active": "_970d04df7376df67__outset-ring--focus-within-except-active", "outset-ring--focus-within-visible": "c5cb3ee4bddaa8e4__outset-ring--focus-within-visible", "outset-ring--focus-parent-visible": "ecadb9e080e2dfa5__outset-ring--focus-parent-visible" };
if (typeof process === "undefined" || true) {
  registerStyle4("90a23568f8", '@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;@layer wp-ui-components{.d4250949359b05ce__link{text-decoration-thickness:from-font;text-underline-offset:.2em}.c6055659b8e2cd2c__is-brand,.c6055659b8e2cd2c__is-brand:visited{--_gcd-a-color:var(--wpds-color-fg-interactive-brand,var(--wp-admin-theme-color,#3858e9));color:var(--wpds-color-fg-interactive-brand,var(--wp-admin-theme-color,#3858e9))}.c6055659b8e2cd2c__is-brand:active,.c6055659b8e2cd2c__is-brand:hover{--_gcd-a-color:var(--wpds-color-fg-interactive-brand-active,var(--wp-admin-theme-color,#3858e9));color:var(--wpds-color-fg-interactive-brand-active,var(--wp-admin-theme-color,#3858e9))}._92e0dfcaeee15b88__is-neutral,._92e0dfcaeee15b88__is-neutral:visited{--_gcd-a-color:var(--wpds-color-fg-interactive-neutral,#1e1e1e);color:var(--wpds-color-fg-interactive-neutral,#1e1e1e);text-decoration-color:var(--wpds-color-stroke-interactive-neutral,#8d8d8d)}._92e0dfcaeee15b88__is-neutral:active,._92e0dfcaeee15b88__is-neutral:hover{--_gcd-a-color:var(--wpds-color-fg-interactive-neutral-active,#1e1e1e);color:var(--wpds-color-fg-interactive-neutral-active,#1e1e1e)}.cf122a9bf1035d42__is-unstyled{--_gcd-a-color:inherit;color:inherit;text-decoration:none}._0cb411afac4c86c7__link-icon{display:inline-block;font-weight:var(--wpds-typography-font-weight-regular,400);line-height:1;margin-inline-start:var(--wpds-dimension-padding-xs,4px);text-decoration:none}._0cb411afac4c86c7__link-icon:after{content:"\\2197"}._0cb411afac4c86c7__link-icon:dir(rtl):after{content:"\\2196"}}');
}
var style_default4 = { "link": "d4250949359b05ce__link", "is-brand": "c6055659b8e2cd2c__is-brand", "is-neutral": "_92e0dfcaeee15b88__is-neutral", "is-unstyled": "cf122a9bf1035d42__is-unstyled", "link-icon": "_0cb411afac4c86c7__link-icon" };
if (typeof process === "undefined" || true) {
  registerStyle4("1fb29d3a3c", "._6defc79820e382c6__button{box-sizing:var(--_gcd-button-box-sizing,border-box);font-family:var(--_gcd-button-font-family,inherit);font-size:var(--_gcd-button-font-size,inherit);font-weight:var(--_gcd-button-font-weight,inherit)}.d2cff2e5dea83bd1__input{box-sizing:var(--_gcd-input-box-sizing,border-box);font-family:var(--_gcd-input-font-family,inherit);font-size:var(--_gcd-input-font-size,inherit);font-weight:var(--_gcd-input-font-weight,inherit);margin:var(--_gcd-input-margin,0);&:is(textarea,[type=text],[type=password],[type=color],[type=date],[type=datetime],[type=datetime-local],[type=email],[type=month],[type=number],[type=search],[type=tel],[type=time],[type=url],[type=week]){background-color:var(--_gcd-input-background-color,#0000);border:var(--_gcd-input-border,none);border-radius:var(--_gcd-input-border-radius,0);box-shadow:var(--_gcd-input-box-shadow,0 0 0 #0000);color:var(--_gcd-input-color,var(--wpds-color-fg-interactive-neutral,#1e1e1e));&:focus{border-color:var(--_gcd-input-border-color-focus,var(--wp-admin-theme-color));box-shadow:var(--_gcd-input-box-shadow-focus,none);outline:var(--_gcd-input-outline-focus,none)}&:disabled{background:var(--_gcd-input-background-disabled,#0000);border-color:var(--_gcd-input-border-color-disabled,#0000);box-shadow:var(--_gcd-input-box-shadow-disabled,none);color:var(--_gcd-input-color-disabled,var(--wpds-color-fg-interactive-neutral-disabled,#8d8d8d))}&::placeholder{color:var(--_gcd-input-placeholder-color,var(--wpds-color-fg-interactive-neutral-disabled,#8d8d8d))}}&:is(textarea,[type=text],[type=password],[type=date],[type=datetime],[type=datetime-local],[type=email],[type=month],[type=number],[type=search],[type=tel],[type=time],[type=url],[type=week]){line-height:var(--_gcd-input-line-height,inherit);min-height:var(--_gcd-input-min-height,auto);padding:var(--_gcd-input-padding,0)}}._547d86373d02e108__textarea{box-sizing:var(--_gcd-textarea-box-sizing,border-box);overflow:var(--_gcd-textarea-overflow,auto);resize:var(--_gcd-textarea-resize,block)}._8c15fd0ed9f28ba4__div{outline:var(--_gcd-div-outline,0 solid #0000)}p._43cec3e1eec1066d__p{font-size:var(--_gcd-p-font-size,13px);line-height:var(--_gcd-p-line-height,1.5);margin:var(--_gcd-p-margin,0)}:is(h1,h2,h3,h4,h5,h6).e97669c6d9a38497__heading{color:var(--_gcd-heading-color,var(--wpds-color-fg-content-neutral,#1e1e1e));font-size:var(--_gcd-heading-font-size,inherit);font-weight:var(--_gcd-heading-font-weight,var(--wpds-typography-font-weight-medium,499));margin:var(--_gcd-heading-margin,0)}._2c0831b0499dbd6e__a,._2c0831b0499dbd6e__a:is(:hover,:focus,:active){border-radius:var(--_gcd-a-border-radius,0);box-shadow:var(--_gcd-a-box-shadow,none);color:var(--_gcd-a-color,inherit);outline:var(--_gcd-a-outline,0 solid #0000);transition:var(--_gcd-a-transition,none)}");
}
var global_css_defense_default2 = { "button": "_6defc79820e382c6__button", "input": "d2cff2e5dea83bd1__input", "textarea": "_547d86373d02e108__textarea", "div": "_8c15fd0ed9f28ba4__div", "p": "_43cec3e1eec1066d__p", "heading": "e97669c6d9a38497__heading", "a": "_2c0831b0499dbd6e__a" };
var Link = (0, import_element4.forwardRef)(function Link2({
  children,
  variant = "default",
  tone = "brand",
  openInNewTab = false,
  render,
  className,
  ...props
}, ref) {
  const element = useRender({
    render,
    defaultTagName: "a",
    ref,
    props: mergeProps(props, {
      className: clsx_default(
        global_css_defense_default2.a,
        resets_default["box-sizing"],
        focus_default["outset-ring--focus"],
        variant !== "unstyled" && style_default4.link,
        variant !== "unstyled" && style_default4[`is-${tone}`],
        variant === "unstyled" && style_default4["is-unstyled"],
        className
      ),
      target: openInNewTab ? "_blank" : void 0,
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        children,
        openInNewTab && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "span",
          {
            className: style_default4["link-icon"],
            role: "img",
            "aria-label": (
              /* translators: accessibility text appended to link text */
              (0, import_i18n3.__)("(opens in a new tab)")
            )
          }
        )
      ] })
    })
  });
  return element;
});

// ../../js-packages/components/build/components/jetpack-footer/style.scss
if (typeof document !== "undefined" && true && !document.head.querySelector("style[data-wp-hash='7bd1410875']")) {
  const style = document.createElement("style");
  style.setAttribute("data-wp-hash", "7bd1410875");
  style.appendChild(document.createTextNode(':root{--wpds-border-radius-xs:1px;--wpds-border-radius-sm:2px;--wpds-border-radius-md:4px;--wpds-border-radius-lg:8px;--wpds-border-width-xs:1px;--wpds-border-width-sm:2px;--wpds-border-width-md:4px;--wpds-border-width-lg:8px;--wpds-border-width-focus:2px;--wpds-color-bg-surface-neutral:#fcfcfc;--wpds-color-bg-surface-neutral-strong:#fff;--wpds-color-bg-surface-neutral-weak:#f4f4f4;--wpds-color-bg-surface-brand:#ecf0fa;--wpds-color-bg-surface-success:#c6f7cd;--wpds-color-bg-surface-success-weak:#ebffed;--wpds-color-bg-surface-info:#deebfa;--wpds-color-bg-surface-info-weak:#f3f9ff;--wpds-color-bg-surface-warning:#fde6be;--wpds-color-bg-surface-warning-weak:#fff7e1;--wpds-color-bg-surface-caution:#fee995;--wpds-color-bg-surface-caution-weak:#fff9ca;--wpds-color-bg-surface-error:#f6e6e3;--wpds-color-bg-surface-error-weak:#fff6f5;--wpds-color-bg-interactive-neutral-strong:#2d2d2d;--wpds-color-bg-interactive-neutral-strong-active:#1e1e1e;--wpds-color-bg-interactive-neutral-strong-disabled:#e6e6e6;--wpds-color-bg-interactive-neutral-weak:#0000;--wpds-color-bg-interactive-neutral-weak-active:#ededed;--wpds-color-bg-interactive-neutral-weak-disabled:#0000;--wpds-color-bg-interactive-brand-strong:#3858e9;--wpds-color-bg-interactive-brand-strong-active:#2e49d9;--wpds-color-bg-interactive-brand-weak:#0000;--wpds-color-bg-interactive-brand-weak-active:#e6eaf4;--wpds-color-bg-interactive-error:#0000;--wpds-color-bg-interactive-error-active:#fff6f5;--wpds-color-bg-interactive-error-strong:#cc1818;--wpds-color-bg-interactive-error-strong-active:#b90000;--wpds-color-bg-interactive-error-weak:#0000;--wpds-color-bg-interactive-error-weak-active:#f6e6e3;--wpds-color-bg-track-neutral-weak:#e4e4e4;--wpds-color-bg-track-neutral:#dbdbdb;--wpds-color-bg-thumb-neutral-weak:#8d8d8d;--wpds-color-bg-thumb-neutral-weak-active:#6e6e6e;--wpds-color-bg-thumb-brand:#3858e9;--wpds-color-bg-thumb-brand-active:#3858e9;--wpds-color-bg-thumb-neutral-disabled:#dbdbdb;--wpds-color-fg-content-neutral:#1e1e1e;--wpds-color-fg-content-neutral-weak:#707070;--wpds-color-fg-content-success:#002900;--wpds-color-fg-content-success-weak:#008030;--wpds-color-fg-content-info:#001b4f;--wpds-color-fg-content-info-weak:#006bd7;--wpds-color-fg-content-warning:#2e1900;--wpds-color-fg-content-warning-weak:#926300;--wpds-color-fg-content-caution:#281d00;--wpds-color-fg-content-caution-weak:#826a00;--wpds-color-fg-content-error:#470000;--wpds-color-fg-content-error-weak:#cc1818;--wpds-color-fg-interactive-neutral:#1e1e1e;--wpds-color-fg-interactive-neutral-active:#1e1e1e;--wpds-color-fg-interactive-neutral-disabled:#8d8d8d;--wpds-color-fg-interactive-neutral-strong:#f0f0f0;--wpds-color-fg-interactive-neutral-strong-active:#f0f0f0;--wpds-color-fg-interactive-neutral-strong-disabled:#8d8d8d;--wpds-color-fg-interactive-neutral-weak:#707070;--wpds-color-fg-interactive-neutral-weak-disabled:#8d8d8d;--wpds-color-fg-interactive-brand:#3858e9;--wpds-color-fg-interactive-brand-active:#3858e9;--wpds-color-fg-interactive-brand-strong:#eff0f2;--wpds-color-fg-interactive-brand-strong-active:#eff0f2;--wpds-color-fg-interactive-error:#cc1818;--wpds-color-fg-interactive-error-active:#cc1818;--wpds-color-fg-interactive-error-strong:#f2efef;--wpds-color-fg-interactive-error-strong-active:#f2efef;--wpds-color-stroke-surface-neutral:#dbdbdb;--wpds-color-stroke-surface-neutral-weak:#e4e4e4;--wpds-color-stroke-surface-neutral-strong:#8d8d8d;--wpds-color-stroke-surface-brand:#a3b1d4;--wpds-color-stroke-surface-brand-strong:#3858e9;--wpds-color-stroke-surface-success:#8ac894;--wpds-color-stroke-surface-success-strong:#008030;--wpds-color-stroke-surface-info:#9fbcdc;--wpds-color-stroke-surface-info-strong:#006bd7;--wpds-color-stroke-surface-warning:#d0b481;--wpds-color-stroke-surface-warning-strong:#926300;--wpds-color-stroke-surface-error:#daa39b;--wpds-color-stroke-surface-error-strong:#cc1818;--wpds-color-stroke-interactive-neutral:#8d8d8d;--wpds-color-stroke-interactive-neutral-active:#6e6e6e;--wpds-color-stroke-interactive-neutral-disabled:#dbdbdb;--wpds-color-stroke-interactive-neutral-strong:#6e6e6e;--wpds-color-stroke-interactive-brand:#3858e9;--wpds-color-stroke-interactive-brand-active:#2337c8;--wpds-color-stroke-interactive-error:#cc1818;--wpds-color-stroke-interactive-error-active:#9d0000;--wpds-color-stroke-interactive-error-strong:#cc1818;--wpds-color-stroke-focus-brand:#3858e9;--wpds-cursor-control:pointer;--wpds-dimension-base:4px;--wpds-dimension-padding-xs:4px;--wpds-dimension-padding-sm:8px;--wpds-dimension-padding-md:12px;--wpds-dimension-padding-lg:16px;--wpds-dimension-padding-xl:20px;--wpds-dimension-padding-2xl:24px;--wpds-dimension-padding-3xl:32px;--wpds-dimension-gap-xs:4px;--wpds-dimension-gap-sm:8px;--wpds-dimension-gap-md:12px;--wpds-dimension-gap-lg:16px;--wpds-dimension-gap-xl:24px;--wpds-dimension-gap-2xl:32px;--wpds-dimension-gap-3xl:40px;--wpds-dimension-surface-width-xs:240px;--wpds-dimension-surface-width-sm:320px;--wpds-dimension-surface-width-md:400px;--wpds-dimension-surface-width-lg:560px;--wpds-dimension-surface-width-xl:720px;--wpds-dimension-surface-width-2xl:960px;--wpds-elevation-xs:0 1px 1px 0 #00000008,0 1px 2px 0 #00000005,0 3px 3px 0 #00000005,0 4px 4px 0 #00000003;--wpds-elevation-sm:0 1px 2px 0 #0000000d,0 2px 3px 0 #0000000a,0 6px 6px 0 #00000008,0 8px 8px 0 #00000005;--wpds-elevation-md:0 2px 3px 0 #0000000d,0 4px 5px 0 #0000000a,0 12px 12px 0 #00000008,0 16px 16px 0 #00000005;--wpds-elevation-lg:0 5px 15px 0 #00000014,0 15px 27px 0 #00000012,0 30px 36px 0 #0000000a,0 50px 43px 0 #00000005;--wpds-motion-duration-xs:50ms;--wpds-motion-duration-sm:100ms;--wpds-motion-duration-md:200ms;--wpds-motion-duration-lg:300ms;--wpds-motion-duration-xl:400ms;--wpds-motion-easing-subtle:cubic-bezier(0.15,0,0.15,1);--wpds-motion-easing-balanced:cubic-bezier(0.4,0,0.2,1);--wpds-motion-easing-expressive:cubic-bezier(0.25,0,0,1);--wpds-typography-font-family-heading:-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif;--wpds-typography-font-family-body:-apple-system,system-ui,"Segoe UI","Roboto","Oxygen-Sans","Ubuntu","Cantarell","Helvetica Neue",sans-serif;--wpds-typography-font-family-mono:"Menlo","Consolas",monaco,monospace;--wpds-typography-font-size-xs:11px;--wpds-typography-font-size-sm:12px;--wpds-typography-font-size-md:13px;--wpds-typography-font-size-lg:15px;--wpds-typography-font-size-xl:20px;--wpds-typography-font-size-2xl:32px;--wpds-typography-line-height-xs:16px;--wpds-typography-line-height-sm:20px;--wpds-typography-line-height-md:24px;--wpds-typography-line-height-lg:28px;--wpds-typography-line-height-xl:32px;--wpds-typography-line-height-2xl:40px;--wpds-typography-font-weight-regular:400;--wpds-typography-font-weight-medium:499}[data-wpds-theme-provider-id][data-wpds-density=compact]{--wpds-dimension-padding-xs:4px;--wpds-dimension-padding-sm:4px;--wpds-dimension-padding-md:8px;--wpds-dimension-padding-lg:12px;--wpds-dimension-padding-xl:16px;--wpds-dimension-padding-2xl:20px;--wpds-dimension-padding-3xl:24px;--wpds-dimension-gap-xs:4px;--wpds-dimension-gap-sm:4px;--wpds-dimension-gap-md:8px;--wpds-dimension-gap-lg:12px;--wpds-dimension-gap-xl:20px;--wpds-dimension-gap-2xl:24px;--wpds-dimension-gap-3xl:32px}[data-wpds-theme-provider-id][data-wpds-density=comfortable]{--wpds-dimension-padding-xs:8px;--wpds-dimension-padding-sm:12px;--wpds-dimension-padding-md:16px;--wpds-dimension-padding-lg:20px;--wpds-dimension-padding-xl:24px;--wpds-dimension-padding-2xl:32px;--wpds-dimension-padding-3xl:40px;--wpds-dimension-gap-xs:8px;--wpds-dimension-gap-sm:12px;--wpds-dimension-gap-md:16px;--wpds-dimension-gap-lg:20px;--wpds-dimension-gap-xl:32px;--wpds-dimension-gap-2xl:40px;--wpds-dimension-gap-3xl:48px}[data-wpds-theme-provider-id][data-wpds-density=default]{--wpds-dimension-base:4px;--wpds-dimension-padding-xs:4px;--wpds-dimension-padding-sm:8px;--wpds-dimension-padding-md:12px;--wpds-dimension-padding-lg:16px;--wpds-dimension-padding-xl:20px;--wpds-dimension-padding-2xl:24px;--wpds-dimension-padding-3xl:32px;--wpds-dimension-gap-xs:4px;--wpds-dimension-gap-sm:8px;--wpds-dimension-gap-md:12px;--wpds-dimension-gap-lg:16px;--wpds-dimension-gap-xl:24px;--wpds-dimension-gap-2xl:32px;--wpds-dimension-gap-3xl:40px;--wpds-dimension-surface-width-xs:240px;--wpds-dimension-surface-width-sm:320px;--wpds-dimension-surface-width-md:400px;--wpds-dimension-surface-width-lg:560px;--wpds-dimension-surface-width-xl:720px;--wpds-dimension-surface-width-2xl:960px}@media (-webkit-min-device-pixel-ratio:2),(min-resolution:192dpi){:root{--wpds-border-width-focus:1.5px}}.jetpack-footer{border-top:var(--wpds-border-width-xs,1px) solid var(--wpds-color-stroke-surface-neutral-weak,#e0e0e0);box-sizing:border-box;font-size:var(--wpds-typography-font-size-md,13px);padding:var(--wpds-dimension-padding-xl,20px) var(--wpds-dimension-padding-2xl,24px);width:100%}.jetpack-footer :is(.jetpack-footer__menu-item:any-link,.jetpack-footer__menu-item[role=button]){color:var(--wpds-color-fg-interactive-neutral-weak,#707070);cursor:pointer;text-decoration:none}.jetpack-footer .jetpack-footer__menu-item:hover{text-decoration:underline}.jetpack-footer>ul{list-style:none;margin:0;padding:0}.jetpack-footer>ul>li{margin:0}.jetpack-footer__logo{flex-shrink:0}@media (min-width:480px){a.jetpack-footer__a8c{margin-inline-start:auto}}a.jetpack-footer__a8c svg{fill:var(--wpds-color-fg-interactive-neutral-weak,#707070)}'));
  document.head.appendChild(style);
}

// ../../js-packages/components/build/components/jetpack-footer/index.js
var JetpackFooter = ({ className, menu, ...otherProps }) => {
  let items = [];
  const isMyJetpackAvailable = getScriptData()?.jetpack?.isMyJetpackAvailable;
  if (!isWpcomPlatformSite() && !window?.JetpackNetworkAdminData && false !== isMyJetpackAvailable) {
    items = [
      {
        label: (0, import_i18n4.__)("Products", "jetpack-components"),
        href: getAdminUrl("admin.php?page=my-jetpack#/products")
      },
      {
        label: (0, import_i18n4.__)("Help", "jetpack-components"),
        href: getAdminUrl("admin.php?page=my-jetpack#/help")
      },
      ...items
    ];
  }
  if (menu) {
    items = [...items, ...menu];
  }
  return (0, import_jsx_runtime5.jsxs)(Stack, { render: (0, import_jsx_runtime5.jsx)("footer", {}), className: clsx_default("jetpack-footer", className), "aria-label": (0, import_i18n4.__)("Jetpack", "jetpack-components"), role: "contentinfo", direction: "row", justify: "flex-start", align: "center", wrap: "wrap", gap: "xl", ...otherProps, children: [
    (0, import_jsx_runtime5.jsxs)(Stack, { className: "jetpack-footer__logo", direction: "row", gap: "sm", align: "center", children: [
      (0, import_jsx_runtime5.jsx)(jetpack_logo_default, { showText: false, height: 16, "aria-hidden": "true" }),
      (0, import_jsx_runtime5.jsx)(Text, { variant: "body-md", children: "Jetpack" })
    ] }),
    (0, import_jsx_runtime5.jsx)(Stack, { render: (0, import_jsx_runtime5.jsx)("ul", {}), direction: "row", gap: "lg", wrap: "wrap", children: items.map((item) => {
      return (0, import_jsx_runtime5.jsx)("li", { children: (0, import_jsx_runtime5.jsx)(Text, { variant: "body-md", className: "jetpack-footer__menu-item", render: !item.href ? (0, import_jsx_runtime5.jsx)(Link, { render: (0, import_jsx_runtime5.jsx)("span", {}), tabIndex: 0, title: item.title || "", onClick: item.onClick || void 0, onKeyDown: item.onKeyDown || void 0, role: "button" }) : (0, import_jsx_runtime5.jsx)(Link, { href: item.href, title: item.title || "", onClick: item.onClick || void 0, onKeyDown: item.onKeyDown || void 0 }), children: item.label }) }, item.label);
    }) }),
    (0, import_jsx_runtime5.jsx)("a", { className: "jetpack-footer__a8c", href: getRedirectUrl("a8c-about"), rel: "noopener noreferrer", target: "_blank", children: (0, import_jsx_runtime5.jsx)(automattic_byline_logo_default, { height: 8 }) })
  ] });
};
var jetpack_footer_default = JetpackFooter;

// ../../../node_modules/.pnpm/@wordpress+style-runtime@0.2.0/node_modules/@wordpress/style-runtime/src/index.ts
var STYLE_HASH_ATTRIBUTE5 = "data-wp-hash";
function getRuntime5() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument5(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash5(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE5}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE5) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle5(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime5();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash5(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE5, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument5(targetDocument) {
  const runtime = getRuntime5();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle5(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle5(hash, css) {
  const runtime = getRuntime5();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle5(targetDocument, hash, css);
  }
}

// ../../js-packages/components/build/components/admin-section/basic/index.js
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);

// ../../js-packages/components/build/components/admin-section/basic/style.module.scss
if (typeof process === "undefined" || true) {
  registerStyle5("9716c5eff2", ".cb320661bbb5a1df__section{background-color:var(--jp-white)}");
}
var style_module_default = { "section": "cb320661bbb5a1df__section" };

// ../../js-packages/components/build/components/admin-section/basic/index.js
var AdminSection = ({ children }) => {
  return (0, import_jsx_runtime6.jsx)("div", { className: style_module_default.section, children });
};
var basic_default = AdminSection;

// ../../js-packages/components/build/components/admin-page/index.js
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/@wordpress+admin-ui@2.1.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/admin-ui/build-module/navigable-region/index.mjs
var import_element5 = __toESM(require_element(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var NavigableRegion = (0, import_element5.forwardRef)(
  ({ children, className, ariaLabel, as: Tag = "div", ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      Tag,
      {
        ref,
        className: clsx_default("admin-ui-navigable-region", className),
        "aria-label": ariaLabel,
        role: "region",
        tabIndex: "-1",
        ...props,
        children
      }
    );
  }
);
NavigableRegion.displayName = "NavigableRegion";
var navigable_region_default = NavigableRegion;

// ../../../node_modules/.pnpm/@wordpress+admin-ui@2.1.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/admin-ui/build-module/page/sidebar-toggle-slot.mjs
var import_components = __toESM(require_components(), 1);
var { Fill: SidebarToggleFill, Slot: SidebarToggleSlot } = (0, import_components.createSlotFill)("SidebarToggle");

// ../../../node_modules/.pnpm/@wordpress+admin-ui@2.1.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/admin-ui/build-module/page/header.mjs
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var STYLE_HASH_ATTRIBUTE6 = "data-wp-hash";
function getRuntime6() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument6(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash6(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE6}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE6) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle6(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime6();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash6(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE6, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument6(targetDocument) {
  const runtime = getRuntime6();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle6(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle6(hash, css) {
  const runtime = getRuntime6();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle6(targetDocument, hash, css);
  }
}
if (typeof process === "undefined" || true) {
  registerStyle6("aa9c241ccc", "._956b6df0898efed0__page{text-wrap:pretty;background-color:var(--wpds-color-bg-surface-neutral,#fcfcfc);color:var(--wpds-color-fg-content-neutral,#1e1e1e);display:flex;flex-flow:column;height:100%;position:relative;z-index:1}._0625b55e82a0d93d__header{background:var(--wpds-color-bg-surface-neutral-strong,#fff);border-block-end:var(--wpds-border-width-xs,1px) solid var(--wpds-color-stroke-surface-neutral-weak,#e4e4e4);inset-block-start:0;padding:var(--wpds-dimension-padding-lg,16px) var(--wpds-dimension-padding-2xl,24px);position:sticky;z-index:1}.a43c44d5ae28b2e8__header-content{min-height:calc(var(--wpds-dimension-base, 4px)*8)}.b7cb5b9daf3a3b25__header-actions{flex-shrink:0}._8113be94e7caf73c__header-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}._9a776c7f70996f61__header-visual{display:grid;flex-shrink:0;grid-template-columns:1fr;grid-template-rows:1fr;height:calc(var(--wpds-dimension-base, 4px)*6);width:calc(var(--wpds-dimension-base, 4px)*6);>*{grid-column:1/-1;grid-row:1/-1;max-height:100%;max-width:100%}}.d5e0920cd15d35bc__sidebar-toggle-slot:empty{display:none}._60fea2f6bf5319cd__header-subtitle{color:var(--wpds-color-fg-content-neutral-weak,#707070);padding-block-end:var(--wpds-dimension-padding-xs,4px)}.be5e57d029ec4036__content{display:flex;flex-direction:column;flex-grow:1;overflow:auto;&._128806d0b26e3a50__has-padding{padding:var(--wpds-dimension-padding-lg,16px) var(--wpds-dimension-padding-2xl,24px)}}");
}
var style_default5 = { "page": "_956b6df0898efed0__page", "header": "_0625b55e82a0d93d__header", "header-content": "a43c44d5ae28b2e8__header-content", "header-actions": "b7cb5b9daf3a3b25__header-actions", "header-title": "_8113be94e7caf73c__header-title", "header-visual": "_9a776c7f70996f61__header-visual", "sidebar-toggle-slot": "d5e0920cd15d35bc__sidebar-toggle-slot", "header-subtitle": "_60fea2f6bf5319cd__header-subtitle", "content": "be5e57d029ec4036__content", "has-padding": "_128806d0b26e3a50__has-padding" };
function Header({
  headingLevel = 1,
  breadcrumbs,
  badges,
  visual,
  title,
  subTitle,
  actions,
  showSidebarToggle = true
}) {
  const HeadingTag = `h${headingLevel}`;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Stack, { direction: "column", className: style_default5.header, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      Stack,
      {
        className: style_default5["header-content"],
        direction: "row",
        gap: "sm",
        justify: "space-between",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Stack, { direction: "row", gap: "sm", align: "center", justify: "start", children: [
            showSidebarToggle && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SidebarToggleSlot,
              {
                bubblesVirtually: true,
                className: style_default5["sidebar-toggle-slot"]
              }
            ),
            visual && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "div",
              {
                className: style_default5["header-visual"],
                "aria-hidden": "true",
                children: visual
              }
            ),
            title && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              Text,
              {
                className: style_default5["header-title"],
                render: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(HeadingTag, {}),
                variant: "heading-lg",
                children: title
              }
            ),
            breadcrumbs,
            badges
          ] }),
          actions && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            Stack,
            {
              align: "center",
              className: style_default5["header-actions"],
              direction: "row",
              gap: "sm",
              children: actions
            }
          )
        ]
      }
    ),
    subTitle && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      Text,
      {
        render: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", {}),
        variant: "body-md",
        className: style_default5["header-subtitle"],
        children: subTitle
      }
    )
  ] });
}

// ../../../node_modules/.pnpm/@wordpress+admin-ui@2.1.0_@types+react@18.3.28_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@wordpress/admin-ui/build-module/page/index.mjs
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var STYLE_HASH_ATTRIBUTE7 = "data-wp-hash";
function getRuntime7() {
  const globalScope = globalThis;
  if (globalScope.__wpStyleRuntime) {
    return globalScope.__wpStyleRuntime;
  }
  globalScope.__wpStyleRuntime = {
    documents: /* @__PURE__ */ new Map(),
    styles: /* @__PURE__ */ new Map(),
    injectedStyles: /* @__PURE__ */ new WeakMap()
  };
  if (typeof document !== "undefined") {
    registerDocument7(document);
  }
  return globalScope.__wpStyleRuntime;
}
function documentContainsStyleHash7(targetDocument, hash) {
  if (!targetDocument.head) {
    return false;
  }
  for (const style of targetDocument.head.querySelectorAll(
    `style[${STYLE_HASH_ATTRIBUTE7}]`
  )) {
    if (style.getAttribute(STYLE_HASH_ATTRIBUTE7) === hash) {
      return true;
    }
  }
  return false;
}
function injectStyle7(targetDocument, hash, css) {
  if (!targetDocument.head) {
    return;
  }
  const runtime = getRuntime7();
  let injectedStyles = runtime.injectedStyles.get(targetDocument);
  if (!injectedStyles) {
    injectedStyles = /* @__PURE__ */ new Set();
    runtime.injectedStyles.set(targetDocument, injectedStyles);
  }
  if (injectedStyles.has(hash)) {
    return;
  }
  if (documentContainsStyleHash7(targetDocument, hash)) {
    injectedStyles.add(hash);
    return;
  }
  const style = targetDocument.createElement("style");
  style.setAttribute(STYLE_HASH_ATTRIBUTE7, hash);
  style.appendChild(targetDocument.createTextNode(css));
  targetDocument.head.appendChild(style);
  injectedStyles.add(hash);
}
function registerDocument7(targetDocument) {
  const runtime = getRuntime7();
  runtime.documents.set(
    targetDocument,
    (runtime.documents.get(targetDocument) ?? 0) + 1
  );
  for (const [hash, css] of runtime.styles) {
    injectStyle7(targetDocument, hash, css);
  }
  return () => {
    const count = runtime.documents.get(targetDocument);
    if (count === void 0) {
      return;
    }
    if (count <= 1) {
      runtime.documents.delete(targetDocument);
      return;
    }
    runtime.documents.set(targetDocument, count - 1);
  };
}
function registerStyle7(hash, css) {
  const runtime = getRuntime7();
  runtime.styles.set(hash, css);
  for (const targetDocument of runtime.documents.keys()) {
    injectStyle7(targetDocument, hash, css);
  }
}
if (typeof process === "undefined" || true) {
  registerStyle7("aa9c241ccc", "._956b6df0898efed0__page{text-wrap:pretty;background-color:var(--wpds-color-bg-surface-neutral,#fcfcfc);color:var(--wpds-color-fg-content-neutral,#1e1e1e);display:flex;flex-flow:column;height:100%;position:relative;z-index:1}._0625b55e82a0d93d__header{background:var(--wpds-color-bg-surface-neutral-strong,#fff);border-block-end:var(--wpds-border-width-xs,1px) solid var(--wpds-color-stroke-surface-neutral-weak,#e4e4e4);inset-block-start:0;padding:var(--wpds-dimension-padding-lg,16px) var(--wpds-dimension-padding-2xl,24px);position:sticky;z-index:1}.a43c44d5ae28b2e8__header-content{min-height:calc(var(--wpds-dimension-base, 4px)*8)}.b7cb5b9daf3a3b25__header-actions{flex-shrink:0}._8113be94e7caf73c__header-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}._9a776c7f70996f61__header-visual{display:grid;flex-shrink:0;grid-template-columns:1fr;grid-template-rows:1fr;height:calc(var(--wpds-dimension-base, 4px)*6);width:calc(var(--wpds-dimension-base, 4px)*6);>*{grid-column:1/-1;grid-row:1/-1;max-height:100%;max-width:100%}}.d5e0920cd15d35bc__sidebar-toggle-slot:empty{display:none}._60fea2f6bf5319cd__header-subtitle{color:var(--wpds-color-fg-content-neutral-weak,#707070);padding-block-end:var(--wpds-dimension-padding-xs,4px)}.be5e57d029ec4036__content{display:flex;flex-direction:column;flex-grow:1;overflow:auto;&._128806d0b26e3a50__has-padding{padding:var(--wpds-dimension-padding-lg,16px) var(--wpds-dimension-padding-2xl,24px)}}");
}
var style_default6 = { "page": "_956b6df0898efed0__page", "header": "_0625b55e82a0d93d__header", "header-content": "a43c44d5ae28b2e8__header-content", "header-actions": "b7cb5b9daf3a3b25__header-actions", "header-title": "_8113be94e7caf73c__header-title", "header-visual": "_9a776c7f70996f61__header-visual", "sidebar-toggle-slot": "d5e0920cd15d35bc__sidebar-toggle-slot", "header-subtitle": "_60fea2f6bf5319cd__header-subtitle", "content": "be5e57d029ec4036__content", "has-padding": "_128806d0b26e3a50__has-padding" };
function Page({
  headingLevel,
  breadcrumbs,
  badges,
  visual,
  title,
  subTitle,
  children,
  className,
  actions,
  ariaLabel,
  hasPadding = false,
  showSidebarToggle = true
}) {
  const classes = clsx_default(style_default6.page, className);
  const effectiveAriaLabel = ariaLabel ?? (typeof title === "string" ? title : "");
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(navigable_region_default, { className: classes, ariaLabel: effectiveAriaLabel, children: [
    (title || breadcrumbs || badges || actions || visual) && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Header,
      {
        headingLevel,
        breadcrumbs,
        badges,
        visual,
        title,
        subTitle,
        actions,
        showSidebarToggle
      }
    ),
    hasPadding ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "div",
      {
        className: clsx_default(
          style_default6.content,
          style_default6["has-padding"]
        ),
        children
      }
    ) : children
  ] });
}
Page.SidebarToggleFill = SidebarToggleFill;
var page_default = Page;

// ../../js-packages/components/build/components/admin-page/index.js
var import_i18n5 = __toESM(require_i18n(), 1);
var import_react7 = __toESM(require_react(), 1);

// ../../js-packages/components/build/components/layout/col/index.js
var import_react5 = __toESM(require_react(), 1);

// ../../js-packages/components/build/components/layout/col/style.module.scss
if (typeof process === "undefined" || true) {
  registerStyle5("ca8d4354b2", "@media (max-width:599px){._4ba5bd2b2f2b5576__col-sm-1{grid-column-end:span 1}._6601aeff7267b980__col-sm-1-start{grid-column-start:1}._5bb1b7c7c72a9aa6__col-sm-1-end{grid-column-end:2}.e3136223bc700634__col-sm-2{grid-column-end:span 2}.dbfa2617b17217b5__col-sm-2-start{grid-column-start:2}._7b2e3fcdbfd3f4a8__col-sm-2-end{grid-column-end:3}.fc29c562d5d68a53__col-sm-3{grid-column-end:span 3}._17b487ffaa90e203__col-sm-3-start{grid-column-start:3}.e202a4faf688b14a__col-sm-3-end{grid-column-end:4}.db735f94e6c07cdf__col-sm-4{grid-column-end:span 4}._5f188ed0ae3495f1__col-sm-4-start{grid-column-start:4}._1c1add806915f00b__col-sm-4-end{grid-column-end:5}}@media (min-width:600px) and (max-width:959px){._8a55498aa5ba1c68__col-md-1{grid-column-end:span 1}._1bb08dd9a4c8a05b__col-md-1-start{grid-column-start:1}._75f4b3edce3a3a7f__col-md-1-end{grid-column-end:2}._7d58c248693ee3da__col-md-2{grid-column-end:span 2}._9c758f342194a44b__col-md-2-start{grid-column-start:2}.d4fb859f9e402b49__col-md-2-end{grid-column-end:3}._36ecb0dc0e03b5cd__col-md-3{grid-column-end:span 3}.ecb6729408474cb0__col-md-3-start{grid-column-start:3}.f60c0b2e1de7f4d2__col-md-3-end{grid-column-end:4}.e83e8aab951ceafd__col-md-4{grid-column-end:span 4}._3ff393d18d24a6f9__col-md-4-start{grid-column-start:4}._8c916f820edf5c9a__col-md-4-end{grid-column-end:5}.add50d906e810cd7__col-md-5{grid-column-end:span 5}.eaee1d459d6c65a8__col-md-5-start{grid-column-start:5}._52b91e5acc7c0fb5__col-md-5-end{grid-column-end:6}.bdb2e2163d3f48b2__col-md-6{grid-column-end:span 6}.d162ed88c5243a25__col-md-6-start{grid-column-start:6}._56f06ff30ae4b667__col-md-6-end{grid-column-end:7}._7055975e64b5bc1c__col-md-7{grid-column-end:span 7}.b7a632e515cc02c3__col-md-7-start{grid-column-start:7}._2702ed2ffdd972f0__col-md-7-end{grid-column-end:8}.e112942946664bff__col-md-8{grid-column-end:span 8}._74f8b3c9df668ee1__col-md-8-start{grid-column-start:8}._02744f2fa412f1a5__col-md-8-end{grid-column-end:9}}@media (min-width:960px){._7492d6b66adf6525__col-lg-1{grid-column-end:span 1}._3052910ee63aa98c__col-lg-1-start{grid-column-start:1}._55c16f94f6225f6f__col-lg-1-end{grid-column-end:2}._2357b031a5c2367f__col-lg-2{grid-column-end:span 2}._58d48a9b5eac52c5__col-lg-2-start{grid-column-start:2}._13fe4aadaa45f8b6__col-lg-2-end{grid-column-end:3}._2d63faaef1635ae6__col-lg-3{grid-column-end:span 3}._7af735b2e21c9981__col-lg-3-start{grid-column-start:3}.eb14b434c4c2ce6b__col-lg-3-end{grid-column-end:4}._343bb33d58ec6261__col-lg-4{grid-column-end:span 4}._86610dd2e0590160__col-lg-4-start{grid-column-start:4}._59214f7888e4835f__col-lg-4-end{grid-column-end:5}._1b19570740cd5dd1__col-lg-5{grid-column-end:span 5}.c4cdc96581539d20__col-lg-5-start{grid-column-start:5}.b6f0a397f5d7b50e__col-lg-5-end{grid-column-end:6}._858f6c0679958dcc__col-lg-6{grid-column-end:span 6}._3e2c9d7329d847d8__col-lg-6-start{grid-column-start:6}._2fab0036d233adb8__col-lg-6-end{grid-column-end:7}.ea6fe8fce1a5b610__col-lg-7{grid-column-end:span 7}.e26bac844795a5b0__col-lg-7-start{grid-column-start:7}._3563f215b9315308__col-lg-7-end{grid-column-end:8}.bc54f8285d7491b3__col-lg-8{grid-column-end:span 8}.d266537f7cb842bb__col-lg-8-start{grid-column-start:8}.ac61c6f494f96a7f__col-lg-8-end{grid-column-end:9}.b70f1bde7c8fbb85__col-lg-9{grid-column-end:span 9}._9fb65645e14c0ff5__col-lg-9-start{grid-column-start:9}.d9cc3dbafa543391__col-lg-9-end{grid-column-end:10}.fa751d8b986a2731__col-lg-10{grid-column-end:span 10}._4bd1c6041a9d66c9__col-lg-10-start{grid-column-start:10}.a01f9529575f2f73__col-lg-10-end{grid-column-end:11}._59eecee10f639ece__col-lg-11{grid-column-end:span 11}.ecb646b1d30d4f4c__col-lg-11-start{grid-column-start:11}._776b4cdf8d377756__col-lg-11-end{grid-column-end:12}._3ec2a04de1c8625d__col-lg-12{grid-column-end:span 12}._1bd28a89dd7e4200__col-lg-12-start{grid-column-start:12}.dad15fd540d98df8__col-lg-12-end{grid-column-end:13}}");
}
var style_module_default2 = { "sm": "(max-width: 599px)", "md": "(min-width: 600px) and (max-width: 959px)", "lg": "(min-width: 960px)", "smcols": "4", "mdcols": "8", "lgcols": "12", "col-sm-1": "_4ba5bd2b2f2b5576__col-sm-1", "col-sm-1-start": "_6601aeff7267b980__col-sm-1-start", "col-sm-1-end": "_5bb1b7c7c72a9aa6__col-sm-1-end", "col-sm-2": "e3136223bc700634__col-sm-2", "col-sm-2-start": "dbfa2617b17217b5__col-sm-2-start", "col-sm-2-end": "_7b2e3fcdbfd3f4a8__col-sm-2-end", "col-sm-3": "fc29c562d5d68a53__col-sm-3", "col-sm-3-start": "_17b487ffaa90e203__col-sm-3-start", "col-sm-3-end": "e202a4faf688b14a__col-sm-3-end", "col-sm-4": "db735f94e6c07cdf__col-sm-4", "col-sm-4-start": "_5f188ed0ae3495f1__col-sm-4-start", "col-sm-4-end": "_1c1add806915f00b__col-sm-4-end", "col-md-1": "_8a55498aa5ba1c68__col-md-1", "col-md-1-start": "_1bb08dd9a4c8a05b__col-md-1-start", "col-md-1-end": "_75f4b3edce3a3a7f__col-md-1-end", "col-md-2": "_7d58c248693ee3da__col-md-2", "col-md-2-start": "_9c758f342194a44b__col-md-2-start", "col-md-2-end": "d4fb859f9e402b49__col-md-2-end", "col-md-3": "_36ecb0dc0e03b5cd__col-md-3", "col-md-3-start": "ecb6729408474cb0__col-md-3-start", "col-md-3-end": "f60c0b2e1de7f4d2__col-md-3-end", "col-md-4": "e83e8aab951ceafd__col-md-4", "col-md-4-start": "_3ff393d18d24a6f9__col-md-4-start", "col-md-4-end": "_8c916f820edf5c9a__col-md-4-end", "col-md-5": "add50d906e810cd7__col-md-5", "col-md-5-start": "eaee1d459d6c65a8__col-md-5-start", "col-md-5-end": "_52b91e5acc7c0fb5__col-md-5-end", "col-md-6": "bdb2e2163d3f48b2__col-md-6", "col-md-6-start": "d162ed88c5243a25__col-md-6-start", "col-md-6-end": "_56f06ff30ae4b667__col-md-6-end", "col-md-7": "_7055975e64b5bc1c__col-md-7", "col-md-7-start": "b7a632e515cc02c3__col-md-7-start", "col-md-7-end": "_2702ed2ffdd972f0__col-md-7-end", "col-md-8": "e112942946664bff__col-md-8", "col-md-8-start": "_74f8b3c9df668ee1__col-md-8-start", "col-md-8-end": "_02744f2fa412f1a5__col-md-8-end", "col-lg-1": "_7492d6b66adf6525__col-lg-1", "col-lg-1-start": "_3052910ee63aa98c__col-lg-1-start", "col-lg-1-end": "_55c16f94f6225f6f__col-lg-1-end", "col-lg-2": "_2357b031a5c2367f__col-lg-2", "col-lg-2-start": "_58d48a9b5eac52c5__col-lg-2-start", "col-lg-2-end": "_13fe4aadaa45f8b6__col-lg-2-end", "col-lg-3": "_2d63faaef1635ae6__col-lg-3", "col-lg-3-start": "_7af735b2e21c9981__col-lg-3-start", "col-lg-3-end": "eb14b434c4c2ce6b__col-lg-3-end", "col-lg-4": "_343bb33d58ec6261__col-lg-4", "col-lg-4-start": "_86610dd2e0590160__col-lg-4-start", "col-lg-4-end": "_59214f7888e4835f__col-lg-4-end", "col-lg-5": "_1b19570740cd5dd1__col-lg-5", "col-lg-5-start": "c4cdc96581539d20__col-lg-5-start", "col-lg-5-end": "b6f0a397f5d7b50e__col-lg-5-end", "col-lg-6": "_858f6c0679958dcc__col-lg-6", "col-lg-6-start": "_3e2c9d7329d847d8__col-lg-6-start", "col-lg-6-end": "_2fab0036d233adb8__col-lg-6-end", "col-lg-7": "ea6fe8fce1a5b610__col-lg-7", "col-lg-7-start": "e26bac844795a5b0__col-lg-7-start", "col-lg-7-end": "_3563f215b9315308__col-lg-7-end", "col-lg-8": "bc54f8285d7491b3__col-lg-8", "col-lg-8-start": "d266537f7cb842bb__col-lg-8-start", "col-lg-8-end": "ac61c6f494f96a7f__col-lg-8-end", "col-lg-9": "b70f1bde7c8fbb85__col-lg-9", "col-lg-9-start": "_9fb65645e14c0ff5__col-lg-9-start", "col-lg-9-end": "d9cc3dbafa543391__col-lg-9-end", "col-lg-10": "fa751d8b986a2731__col-lg-10", "col-lg-10-start": "_4bd1c6041a9d66c9__col-lg-10-start", "col-lg-10-end": "a01f9529575f2f73__col-lg-10-end", "col-lg-11": "_59eecee10f639ece__col-lg-11", "col-lg-11-start": "ecb646b1d30d4f4c__col-lg-11-start", "col-lg-11-end": "_776b4cdf8d377756__col-lg-11-end", "col-lg-12": "_3ec2a04de1c8625d__col-lg-12", "col-lg-12-start": "_1bd28a89dd7e4200__col-lg-12-start", "col-lg-12-end": "dad15fd540d98df8__col-lg-12-end" };

// ../../js-packages/components/build/components/layout/col/index.js
var smCols = Number(style_module_default2.smcols);
var mdCols = Number(style_module_default2.mdcols);
var lgCols = Number(style_module_default2.lgcols);
var Col = (props) => {
  const { children, tagName = "div", className } = props;
  const sm = Math.min(smCols, typeof props.sm === "number" ? props.sm : smCols);
  const smStart = Math.min(smCols, typeof props.sm === "object" ? props.sm.start : 0);
  const smEnd = Math.min(smCols, typeof props.sm === "object" ? props.sm.end : 0);
  const md = Math.min(mdCols, typeof props.md === "number" ? props.md : mdCols);
  const mdStart = Math.min(mdCols, typeof props.md === "object" ? props.md.start : 0);
  const mdEnd = Math.min(mdCols, typeof props.md === "object" ? props.md.end : 0);
  const lg = Math.min(lgCols, typeof props.lg === "number" ? props.lg : lgCols);
  const lgStart = Math.min(lgCols, typeof props.lg === "object" ? props.lg.start : 0);
  const lgEnd = Math.min(lgCols, typeof props.lg === "object" ? props.lg.end : 0);
  const colClassName = clsx_default(className, {
    // SM
    [style_module_default2[`col-sm-${sm}`]]: !(smStart && smEnd),
    [style_module_default2[`col-sm-${smStart}-start`]]: smStart > 0,
    [style_module_default2[`col-sm-${smEnd}-end`]]: smEnd > 0,
    // MD
    [style_module_default2[`col-md-${md}`]]: !(mdStart && mdEnd),
    [style_module_default2[`col-md-${mdStart}-start`]]: mdStart > 0,
    [style_module_default2[`col-md-${mdEnd}-end`]]: mdEnd > 0,
    // LG
    [style_module_default2[`col-lg-${lg}`]]: !(lgStart && lgEnd),
    [style_module_default2[`col-lg-${lgStart}-start`]]: lgStart > 0,
    [style_module_default2[`col-lg-${lgEnd}-end`]]: lgEnd > 0
  });
  return (0, import_react5.createElement)(tagName, {
    className: colClassName
  }, children);
};
var col_default = Col;

// ../../js-packages/components/build/components/layout/container/index.js
var import_react6 = __toESM(require_react(), 1);

// ../../js-packages/components/build/components/layout/container/style.module.scss
if (typeof process === "undefined" || true) {
  registerStyle5("58647a5875", ".a7346e2a366ff62a__container{--max-container-width:1040px;--vertical-gutter:24px;--horizontal-spacing:8px;column-gap:var(--vertical-gutter);display:grid;margin:0 auto;width:100%}@media (max-width:599px){.a7346e2a366ff62a__container{grid-template-columns:repeat(4,minmax(0,1fr));max-width:calc(var(--max-container-width) + 32px);padding:0 16px}}@media (min-width:600px) and (max-width:959px){.a7346e2a366ff62a__container{grid-template-columns:repeat(8,minmax(0,1fr));max-width:calc(var(--max-container-width) + 36px);padding:0 18px}}@media (min-width:960px){.a7346e2a366ff62a__container{grid-template-columns:repeat(12,minmax(0,1fr));max-width:calc(var(--max-container-width) + 48px);padding:0 24px}}.a7346e2a366ff62a__container._14c87126b79195d3__fluid{max-width:none;padding:unset}");
}
var style_module_default3 = { "sm": "(max-width: 599px)", "md": "(min-width: 600px) and (max-width: 959px)", "lg": "(min-width: 960px)", "container": "a7346e2a366ff62a__container", "fluid": "_14c87126b79195d3__fluid" };

// ../../js-packages/components/build/components/layout/container/index.js
var Container = ({ children, fluid = false, tagName = "div", className, horizontalGap = 1, horizontalSpacing = 1 }, ref) => {
  const containerStyle = (0, import_react6.useMemo)(() => {
    const padding = `calc( var(--horizontal-spacing) * ${horizontalSpacing} )`;
    const rowGap = `calc( var(--horizontal-spacing) * ${horizontalGap} )`;
    return {
      paddingTop: padding,
      paddingBottom: padding,
      rowGap
    };
  }, [horizontalGap, horizontalSpacing]);
  const containerClassName = clsx_default(className, style_module_default3.container, {
    [style_module_default3.fluid]: fluid
  });
  return (0, import_react6.createElement)(tagName, {
    className: containerClassName,
    style: containerStyle,
    ref
  }, children);
};
var container_default = (0, import_react6.forwardRef)(Container);

// ../../js-packages/components/build/components/admin-page/style.module.scss
if (typeof process === "undefined" || true) {
  registerStyle5("3de4523662", "._3576fd25ffa54499__admin-page{margin-left:-20px}@media (max-width:782px){._3576fd25ffa54499__admin-page{margin-left:-10px}}._3576fd25ffa54499__admin-page.cdf2fab8060d83ed__background{background-color:var(--jp-white)}._3576fd25ffa54499__admin-page.eb848a1bf79d4668__without-bottom-border .jp-admin-page__page>:first-child{border-bottom:none}._3576fd25ffa54499__admin-page .jp-admin-page__page>:first-child{position:relative;z-index:1}._3576fd25ffa54499__admin-page .jp-admin-page__page{clear:both}._3576fd25ffa54499__admin-page .jp-admin-page__page>:first-child [aria-hidden=true]{place-items:center}._3576fd25ffa54499__admin-page .jp-admin-page__page>:first-child>div:has([aria-hidden=true]){align-items:center;min-height:40px}._3576fd25ffa54499__admin-page ._075579478b1a25d8__admin-page-header{align-items:center;display:flex;gap:8px}._3576fd25ffa54499__admin-page ._4d34c6d280829167__admin-page-footer{box-sizing:border-box}._3576fd25ffa54499__admin-page ._83a64a19225dc9f1__sandbox-domain-badge{background:#d63638;color:#fff;cursor:pointer;font-size:9px;font-weight:700;letter-spacing:.2em;text-shadow:none;text-transform:uppercase}.jetpack-admin-page #dolly{background-color:#fff}");
}
var style_module_default4 = { "admin-page": "_3576fd25ffa54499__admin-page", "background": "cdf2fab8060d83ed__background", "without-bottom-border": "eb848a1bf79d4668__without-bottom-border", "admin-page-header": "_075579478b1a25d8__admin-page-header", "admin-page-footer": "_4d34c6d280829167__admin-page-footer", "sandbox-domain-badge": "_83a64a19225dc9f1__sandbox-domain-badge" };

// ../../js-packages/components/build/components/admin-page/index.js
var AdminPage = ({ children, className, showHeader = true, showFooter = true, showBackground = true, sandboxedDomain = "", apiRoot = "", apiNonce = "", optionalMenuItems, header, title, subTitle, logo, actions, breadcrumbs, tabs, showBottomBorder = true, unwrapped = false }) => {
  (0, import_react7.useEffect)(() => {
    api_default.setApiRoot(apiRoot);
    api_default.setApiNonce(apiNonce);
  }, [apiRoot, apiNonce]);
  const rootClassName = clsx_default(style_module_default4["admin-page"], "jp-admin-page", className, {
    [style_module_default4.background]: showBackground,
    [style_module_default4["without-bottom-border"]]: tabs || !showBottomBorder
  });
  const testConnection = (0, import_react7.useCallback)(async () => {
    try {
      const connectionTest = await api_default.fetchSiteConnectionTest();
      window.alert(connectionTest.message);
    } catch (error) {
      window.alert((0, import_i18n5.sprintf)(
        /* translators: %s: an error message. */
        (0, import_i18n5.__)("There was an error testing Jetpack. Error: %s", "jetpack-components"),
        error.message
      ));
    }
  }, []);
  if (showHeader && (title || breadcrumbs)) {
    return (0, import_jsx_runtime10.jsx)("div", { className: rootClassName, children: (0, import_jsx_runtime10.jsxs)(page_default, { className: "jp-admin-page__page", visual: logo || (0, import_jsx_runtime10.jsx)(jetpack_logo_default, { showText: false, height: 20 }), breadcrumbs, title, subTitle, actions, showSidebarToggle: false, children: [tabs, unwrapped ? children : (0, import_jsx_runtime10.jsx)(container_default, { fluid: true, horizontalSpacing: 0, children: (0, import_jsx_runtime10.jsx)(col_default, { children }) }), showFooter && (0, import_jsx_runtime10.jsx)(jetpack_footer_default, { menu: optionalMenuItems })] }) });
  }
  return (0, import_jsx_runtime10.jsxs)("div", { className: rootClassName, children: [showHeader && (0, import_jsx_runtime10.jsx)(container_default, { horizontalSpacing: 5, children: (0, import_jsx_runtime10.jsxs)(col_default, { className: clsx_default(style_module_default4["admin-page-header"], "jp-admin-page-header"), children: [header ? header : (0, import_jsx_runtime10.jsx)(jetpack_logo_default, {}), sandboxedDomain && (0, import_jsx_runtime10.jsx)("code", {
    className: style_module_default4["sandbox-domain-badge"],
    onClick: testConnection,
    onKeyDown: testConnection,
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
    role: "button",
    tabIndex: 0,
    title: `Sandboxing via ${sandboxedDomain}. Click to test connection.`,
    children: "API Sandboxed"
  })] }) }), (0, import_jsx_runtime10.jsx)(container_default, { fluid: true, horizontalSpacing: 0, children: (0, import_jsx_runtime10.jsx)(col_default, { children }) }), showFooter && (0, import_jsx_runtime10.jsx)(jetpack_footer_default, { menu: optionalMenuItems })] });
};
var admin_page_default = AdminPage;

// _inc/client/offline-mode/component.jsx
var import_api_fetch = __toESM(require_api_fetch());
var import_components2 = __toESM(require_components());
var import_i18n6 = __toESM(require_i18n());
var import_prop_types = __toESM(require_prop_types());
var import_react8 = __toESM(require_react());

// _inc/client/offline-mode/style.scss
if (typeof document !== "undefined" && true && !document.head.querySelector("style[data-wp-hash='ecca744257']")) {
  const style = document.createElement("style");
  style.setAttribute("data-wp-hash", "ecca744257");
  style.appendChild(document.createTextNode("body.jetpack-offline-mode-page{--jp-offline-mode-canvas-background:#fcfcfc}body.jetpack-offline-mode-page #wpcontent{padding-left:0}body.jetpack-offline-mode-page #screen-meta-links,body.jetpack-offline-mode-page #wpfooter{display:none}body.jetpack-offline-mode-page #wpbody-content{bottom:0;box-sizing:border-box;display:flex;flex-direction:column;left:160px;overflow:hidden;padding-bottom:0;position:fixed;right:0;top:var(--wp-admin-bar-height,32px);width:auto}body.jetpack-offline-mode-page.folded #wpbody-content{left:36px}@media (max-width:960px){body.jetpack-offline-mode-page.auto-fold #wpbody-content{left:36px}}@media (min-width:961px){body.jetpack-offline-mode-page.is-nav-unification:not(.folded) #wpbody-content{left:272px}}body.jetpack-offline-mode-page #wpbody-content :has(.jp-admin-page):not(:has(.boot-layout__stage)){display:flex;flex:1 1 auto;flex-direction:column;min-height:0;min-width:0}body.jetpack-offline-mode-page .jp-admin-page{display:flex;flex:1 1 auto;flex-direction:column;margin-left:0;min-height:0;min-width:0;overflow:visible}body.jetpack-offline-mode-page .jp-admin-page__page{display:flex;flex:1 1 auto;flex-direction:column;min-height:0;min-width:0}body.jetpack-offline-mode-page .jp-admin-page__page>:first-child{flex-shrink:0}body.jetpack-offline-mode-page .jp-admin-page__page:has(.jp-admin-page-tabs)>:first-child{border-bottom:none;padding-bottom:0}body.jetpack-offline-mode-page .jp-admin-page__page>:not(:first-child):not(.jetpack-footer){display:flex;flex:1 1 auto;flex-direction:column;min-height:0;min-width:0;overflow:auto}body.jetpack-offline-mode-page .jp-admin-page__page>:not(:first-child):not(.jetpack-footer)>*{display:flex;flex:1 1 auto;flex-direction:column;min-height:0;min-width:0}body.jetpack-offline-mode-page .jetpack-footer{flex-shrink:0}body.jetpack-offline-mode-page .jp-admin-page-tabs{background:var(--wpds-color-bg-surface-neutral-strong,#fff);border-bottom:var(--wpds-border-width-xs,1px) solid var(--wpds-color-stroke-surface-neutral-weak,#e4e4e4);padding-inline:var(--wpds-dimension-padding-sm,8px);position:sticky;top:0;z-index:10}body.jetpack-offline-mode-page .jp-admin-page-tabs--minimal{padding-inline:var(--wpds-dimension-padding-2xl,24px)}body.jetpack-offline-mode-page .jp-admin-page-tabs [role=tab]{font-size:var(--wpds-typography-font-size-md,13px)}@media (max-width:782px){body.jetpack-offline-mode-page #wpbody-content,body.jetpack-offline-mode-page.auto-fold #wpbody-content,body.jetpack-offline-mode-page.folded #wpbody-content{left:0;top:var(--wp-admin-bar-height,46px)}body.jetpack-offline-mode-page .jp-admin-page{margin-left:0}}body.jetpack-offline-mode-page nav[aria-label=Breadcrumbs] li{margin:0}body.jetpack-offline-mode-page nav[aria-label=Breadcrumbs] a{text-decoration:none}body.jetpack-offline-mode-page nav[aria-label=Breadcrumbs] :is(a:focus-visible,a:hover){text-decoration:underline}body.jetpack-offline-mode-page,body.jetpack-offline-mode-page .jp-admin-page,body.jetpack-offline-mode-page .jp-admin-page__page{background-color:var(--jp-offline-mode-canvas-background)}.jp-offline-mode__container{box-sizing:border-box;flex:1 1 auto;min-block-size:0;min-inline-size:0;overflow-y:auto}.jp-offline-mode{inline-size:100%}.jp-offline-mode--loading{min-block-size:160px}.jp-offline-mode__content{inline-size:100%;margin-inline:auto;max-inline-size:880px;padding-block-end:24px}.jp-offline-mode__feature-group,.jp-offline-mode__requires-connection{box-shadow:none}.jp-offline-mode__feature-group-header{background:#fff;border-block-end:1px solid #f0f0f0;min-block-size:48px}.jp-offline-mode__feature-row{align-items:flex-start;display:grid;gap:16px 20px;grid-template-columns:minmax(168px,224px) minmax(0,1fr) minmax(148px,max-content)}.jp-offline-mode__feature-row .components-toggle-control{margin-block-start:-2px}.jp-offline-mode__feature-row .components-toggle-control__label{font-weight:500}.jp-offline-mode__feature-copy{min-inline-size:0}.jp-offline-mode__feature-copy p,.jp-offline-mode__feature-name{margin-block:0}.jp-offline-mode__feature-documentation-link{display:inline-flex;font-size:inherit;line-height:inherit;margin-inline-start:4px;vertical-align:text-bottom}.jp-offline-mode__feature-documentation-link .components-external-link__icon{margin-inline-start:0}.jp-offline-mode__limitation{grid-column:2/4;min-inline-size:0}.jp-offline-mode__limitation-notice{margin-block:0;margin-inline:0}.jp-offline-mode__feature-badges{min-inline-size:0}.jp-offline-mode__feature-badges .components-badge{white-space:nowrap}@media (max-width:782px){.jp-offline-mode__feature-row{grid-template-columns:1fr}.jp-offline-mode__limitation{grid-column:1}.jp-offline-mode__feature-badges{justify-content:flex-start}}"));
  document.head.appendChild(style);
}

// _inc/client/offline-mode/component.jsx
var import_jsx_runtime11 = __toESM(require_jsx_runtime());
var OFFLINE_MODE_FEATURES_PATH = "/jetpack/v4/offline-mode/features";
var EMPTY_FEATURES = [];
var EMPTY_REQUIRES_CONNECTION_FEATURES = [];
var EMPTY_GROUPS = {};
var hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);
var getFeatureModule = (feature) => feature.underlying_module || feature.module || feature.slug;
var getRecommendedInactiveFeatures = (features) => features.filter(
  (feature) => feature.recommended && feature.available && false !== feature.toggleable && !feature.active
);
var settlePromise = (promise) => promise.then(
  (value) => ({ status: "fulfilled", value }),
  (reason) => ({ status: "rejected", reason })
);
var getGroupedFeatures = (features, groups) => {
  return features.reduce((grouped, feature) => {
    const groupSlug = feature.group || "other";
    const groupName = groups[groupSlug] || (0, import_i18n6.__)("Other features", "jetpack");
    if (!grouped[groupSlug]) {
      grouped[groupSlug] = {
        name: groupName,
        features: []
      };
    }
    grouped[groupSlug].features.push(feature);
    return grouped;
  }, {});
};
var getFeatureActiveState = (feature, activeOverrides) => {
  const module = getFeatureModule(feature);
  if (hasOwn(activeOverrides, module)) {
    return activeOverrides[module];
  }
  return feature.active;
};
var FeatureStatusBadge = ({ active, isUpdating }) => {
  if (isUpdating) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "draft", children: (0, import_i18n6.__)("Saving", "jetpack") });
  }
  if (active) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "stable", children: (0, import_i18n6.__)("Active", "jetpack") });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "draft", children: (0, import_i18n6.__)("Inactive", "jetpack") });
};
FeatureStatusBadge.propTypes = {
  active: import_prop_types.default.bool.isRequired,
  isUpdating: import_prop_types.default.bool.isRequired
};
var FeatureRow = ({ feature, isUpdating, onActivate, onDeactivate }) => {
  const module = getFeatureModule(feature);
  const documentationLabel = (0, import_i18n6.sprintf)(
    /* translators: %s: Jetpack feature name. */
    (0, import_i18n6.__)("View %s documentation", "jetpack"),
    feature.name
  );
  const handleToggle = (0, import_react8.useCallback)(() => {
    return feature.active ? onDeactivate(module) : onActivate(module);
  }, [feature.active, module, onActivate, onDeactivate]);
  const isToggleable = false !== feature.toggleable;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "jp-offline-mode__feature-row", children: [
    isToggleable ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      import_components2.ToggleControl,
      {
        checked: feature.active,
        disabled: !feature.available || isUpdating,
        label: feature.name,
        onChange: handleToggle,
        __nextHasNoMarginBottom: true
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalText, { as: "h3", className: "jp-offline-mode__feature-name", size: 14, weight: 500, children: feature.name }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "jp-offline-mode__feature-copy", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.__experimentalText, { as: "p", size: 13, variant: "muted", children: [
      feature.description,
      feature.documentation_url && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        import_components2.ExternalLink,
        {
          "aria-label": documentationLabel,
          className: "jp-offline-mode__feature-documentation-link",
          href: feature.documentation_url,
          title: documentationLabel,
          children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "screen-reader-text", children: documentationLabel })
        }
      )
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      import_components2.__experimentalHStack,
      {
        alignment: "center",
        className: "jp-offline-mode__feature-badges",
        expanded: false,
        justify: "flex-end",
        spacing: 2,
        wrap: true,
        children: [
          feature.recommended && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "draft", children: (0, import_i18n6.__)("Recommended", "jetpack") }),
          "partial" === feature.type && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "informational", children: (0, import_i18n6.__)("Partial support", "jetpack") }),
          !isToggleable && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "stable", children: (0, import_i18n6.__)("Always available", "jetpack") }),
          isToggleable && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FeatureStatusBadge, { active: feature.active, isUpdating })
        ]
      }
    ),
    feature.limitation && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      "div",
      {
        "aria-label": (0, import_i18n6.sprintf)(
          /* translators: %s: Offline Mode feature name. */
          (0, import_i18n6.__)("%s limitation", "jetpack"),
          feature.name
        ),
        className: "jp-offline-mode__limitation",
        role: "note",
        children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          import_components2.Notice,
          {
            className: "jp-offline-mode__limitation-notice",
            isDismissible: false,
            status: "info",
            children: feature.limitation
          }
        )
      }
    )
  ] });
};
FeatureRow.propTypes = {
  feature: import_prop_types.default.shape({
    active: import_prop_types.default.bool.isRequired,
    available: import_prop_types.default.bool.isRequired,
    description: import_prop_types.default.string.isRequired,
    documentation_url: import_prop_types.default.string,
    limitation: import_prop_types.default.string,
    module: import_prop_types.default.string,
    name: import_prop_types.default.string.isRequired,
    recommended: import_prop_types.default.bool.isRequired,
    slug: import_prop_types.default.string.isRequired,
    toggleable: import_prop_types.default.bool,
    type: import_prop_types.default.string.isRequired,
    underlying_module: import_prop_types.default.string
  }).isRequired,
  isUpdating: import_prop_types.default.bool.isRequired,
  onActivate: import_prop_types.default.func.isRequired,
  onDeactivate: import_prop_types.default.func.isRequired
};
var FeatureGroup = ({ group, updatingModules, onActivate, onDeactivate }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.Card, { className: "jp-offline-mode__feature-group", isBorderless: false, size: "small", children: [
  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.CardHeader, { className: "jp-offline-mode__feature-group-header", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalText, { as: "h2", size: 14, weight: 600, children: group.name }) }),
  group.features.map((feature, index) => {
    const module = getFeatureModule(feature);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_react8.Fragment, { children: [
      index > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.CardDivider, {}),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.CardBody, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        FeatureRow,
        {
          feature,
          isUpdating: updatingModules.includes(module),
          onActivate,
          onDeactivate
        }
      ) })
    ] }, feature.slug);
  })
] });
FeatureGroup.propTypes = {
  group: import_prop_types.default.shape({
    name: import_prop_types.default.string.isRequired,
    features: import_prop_types.default.arrayOf(FeatureRow.propTypes.feature).isRequired
  }).isRequired,
  onActivate: import_prop_types.default.func.isRequired,
  onDeactivate: import_prop_types.default.func.isRequired,
  updatingModules: import_prop_types.default.arrayOf(import_prop_types.default.string).isRequired
};
var RequiresConnectionSection = ({ features }) => {
  if (0 === features.length) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.Card, { className: "jp-offline-mode__requires-connection", isBorderless: false, size: "small", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.CardHeader, { className: "jp-offline-mode__feature-group-header", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.__experimentalVStack, { spacing: 1, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalText, { as: "h2", size: 14, weight: 600, children: (0, import_i18n6.__)("Requires connection", "jetpack") }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalText, { as: "p", size: 13, variant: "muted", children: (0, import_i18n6.__)(
        "These Jetpack features are shown for planning purposes and are unavailable while the site is offline.",
        "jetpack"
      ) })
    ] }) }),
    features.map((feature, index) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_react8.Fragment, { children: [
      index > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.CardDivider, {}),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.CardBody, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.__experimentalHStack, { alignment: "flex-start", justify: "space-between", spacing: 4, wrap: true, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.__experimentalVStack, { spacing: 1, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalText, { as: "h3", size: 14, weight: 500, children: feature.name }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalText, { as: "p", size: 13, variant: "muted", children: feature.description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { intent: "medium", children: (0, import_i18n6.__)("Connection required", "jetpack") })
      ] }) })
    ] }, feature.slug || feature.name))
  ] });
};
RequiresConnectionSection.propTypes = {
  features: import_prop_types.default.arrayOf(
    import_prop_types.default.shape({
      description: import_prop_types.default.string.isRequired,
      name: import_prop_types.default.string.isRequired,
      slug: import_prop_types.default.string
    })
  ).isRequired
};
var EnableRecommendedButton = ({ canEnableRecommended, isSaving, onEnableRecommended }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_components2.Button,
  {
    disabled: !canEnableRecommended || isSaving,
    onClick: onEnableRecommended,
    variant: "secondary",
    __next40pxDefaultSize: true,
    children: (0, import_i18n6.__)("Enable recommended", "jetpack")
  }
);
EnableRecommendedButton.propTypes = {
  canEnableRecommended: import_prop_types.default.bool.isRequired,
  isSaving: import_prop_types.default.bool.isRequired,
  onEnableRecommended: import_prop_types.default.func.isRequired
};
var OfflineModePage = ({ actions = null, apiNonce = "", apiRoot = "", children }) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  admin_page_default,
  {
    actions,
    apiNonce,
    apiRoot,
    subTitle: (0, import_i18n6.__)(
      "Build and test Jetpack features without a WordPress.com connection.",
      "jetpack"
    ),
    title: (0, import_i18n6.__)("Offline Mode", "jetpack"),
    children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(basic_default, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(container_default, { className: "jp-offline-mode__container", horizontalSpacing: 6, horizontalGap: 3, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(col_default, { sm: 4, md: 8, lg: 12, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "jp-offline-mode", children }) }) }) })
  }
);
OfflineModePage.propTypes = {
  actions: import_prop_types.default.node,
  apiNonce: import_prop_types.default.string,
  apiRoot: import_prop_types.default.string,
  children: import_prop_types.default.node.isRequired
};
var OfflineMode = ({
  activateModule,
  apiNonce = "",
  apiRoot = "",
  deactivateModule,
  fetchModules
}) => {
  const [dashboardData, setDashboardData] = (0, import_react8.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)(null);
  const [updatingModules, setUpdatingModules] = (0, import_react8.useState)([]);
  const [activeOverrides, setActiveOverrides] = (0, import_react8.useState)({});
  (0, import_react8.useEffect)(() => {
    document.body.classList.add("jetpack-offline-mode-page");
    return () => document.body.classList.remove("jetpack-offline-mode-page");
  }, []);
  const loadDashboardData = (0, import_react8.useCallback)(({ showError = false, showLoading = false } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }
    if (showError) {
      setError(null);
    }
    return (0, import_api_fetch.default)({ path: OFFLINE_MODE_FEATURES_PATH }).then((response) => {
      setDashboardData(response);
    }).catch(() => {
      if (showError) {
        setError((0, import_i18n6.__)("Offline Mode features could not be loaded.", "jetpack"));
      }
    }).finally(() => {
      if (showLoading) {
        setIsLoading(false);
      }
    });
  }, []);
  (0, import_react8.useEffect)(() => {
    loadDashboardData({ showError: true, showLoading: true });
  }, [loadDashboardData]);
  const features = dashboardData?.features || EMPTY_FEATURES;
  const requiresConnectionFeatures = dashboardData?.requires_connection || EMPTY_REQUIRES_CONNECTION_FEATURES;
  const groups = dashboardData?.groups || EMPTY_GROUPS;
  const featuresWithOptimisticState = (0, import_react8.useMemo)(
    () => features.map((feature) => ({
      ...feature,
      active: getFeatureActiveState(feature, activeOverrides)
    })),
    [activeOverrides, features]
  );
  const groupedFeatures = (0, import_react8.useMemo)(
    () => getGroupedFeatures(featuresWithOptimisticState, groups),
    [featuresWithOptimisticState, groups]
  );
  const recommendedInactiveFeatures = (0, import_react8.useMemo)(
    () => getRecommendedInactiveFeatures(featuresWithOptimisticState),
    [featuresWithOptimisticState]
  );
  const isAnyFeatureUpdating = updatingModules.length > 0;
  const markModuleUpdating = (0, import_react8.useCallback)((module) => {
    setUpdatingModules(
      (currentModules) => currentModules.includes(module) ? currentModules : [...currentModules, module]
    );
  }, []);
  const unmarkModuleUpdating = (0, import_react8.useCallback)((module) => {
    setUpdatingModules(
      (currentModules) => currentModules.filter((updatingModule) => updatingModule !== module)
    );
  }, []);
  const setModuleActiveOverride = (0, import_react8.useCallback)((module, active) => {
    setActiveOverrides((currentOverrides) => ({
      ...currentOverrides,
      [module]: active
    }));
  }, []);
  const removeModuleActiveOverride = (0, import_react8.useCallback)((module) => {
    setActiveOverrides((currentOverrides) => {
      if (!hasOwn(currentOverrides, module)) {
        return currentOverrides;
      }
      const nextOverrides = { ...currentOverrides };
      delete nextOverrides[module];
      return nextOverrides;
    });
  }, []);
  const refreshModules = (0, import_react8.useCallback)(() => {
    return Promise.all([fetchModules(), loadDashboardData()]);
  }, [fetchModules, loadDashboardData]);
  const updateModule = (0, import_react8.useCallback)(
    (module, active, action) => {
      markModuleUpdating(module);
      setModuleActiveOverride(module, active);
      return action(module).then(refreshModules).catch(() => {
        removeModuleActiveOverride(module);
      }).finally(() => {
        removeModuleActiveOverride(module);
        unmarkModuleUpdating(module);
      });
    },
    [
      markModuleUpdating,
      refreshModules,
      removeModuleActiveOverride,
      setModuleActiveOverride,
      unmarkModuleUpdating
    ]
  );
  const handleActivate = (0, import_react8.useCallback)(
    (module) => updateModule(module, true, activateModule),
    [activateModule, updateModule]
  );
  const handleDeactivate = (0, import_react8.useCallback)(
    (module) => updateModule(module, false, deactivateModule),
    [deactivateModule, updateModule]
  );
  const handleActivateRecommended = (0, import_react8.useCallback)(() => {
    const modules = recommendedInactiveFeatures.map(getFeatureModule);
    modules.forEach((module) => {
      markModuleUpdating(module);
      setModuleActiveOverride(module, true);
    });
    return Promise.all(modules.map((module) => settlePromise(activateModule(module)))).then(refreshModules).finally(() => {
      modules.forEach((module) => {
        removeModuleActiveOverride(module);
        unmarkModuleUpdating(module);
      });
    });
  }, [
    activateModule,
    markModuleUpdating,
    recommendedInactiveFeatures,
    removeModuleActiveOverride,
    refreshModules,
    setModuleActiveOverride,
    unmarkModuleUpdating
  ]);
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(OfflineModePage, { apiNonce, apiRoot, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      import_components2.__experimentalHStack,
      {
        alignment: "center",
        className: "jp-offline-mode--loading",
        justify: "center",
        spacing: 2,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.Spinner, {}),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: (0, import_i18n6.__)("Loading Offline Mode features\u2026", "jetpack") })
        ]
      }
    ) });
  }
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(OfflineModePage, { apiNonce, apiRoot, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.Notice, { isDismissible: false, status: "error", children: error }) });
  }
  if (0 === featuresWithOptimisticState.length) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      OfflineModePage,
      {
        actions: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          EnableRecommendedButton,
          {
            canEnableRecommended: false,
            isSaving: false,
            onEnableRecommended: handleActivateRecommended
          }
        ),
        apiNonce,
        apiRoot,
        children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.__experimentalVStack, { as: "main", className: "jp-offline-mode__content", spacing: 6, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.Notice, { isDismissible: false, status: "info", children: (0, import_i18n6.__)("No offline-safe features are available for this site.", "jetpack") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RequiresConnectionSection, { features: requiresConnectionFeatures })
        ] })
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    OfflineModePage,
    {
      actions: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        EnableRecommendedButton,
        {
          canEnableRecommended: recommendedInactiveFeatures.length > 0,
          isSaving: isAnyFeatureUpdating,
          onEnableRecommended: handleActivateRecommended
        }
      ),
      apiNonce,
      apiRoot,
      children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_components2.__experimentalVStack, { as: "main", className: "jp-offline-mode__content", spacing: 6, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_components2.__experimentalVStack, { spacing: 6, children: Object.entries(groupedFeatures).map(([groupSlug, group]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          FeatureGroup,
          {
            group,
            onActivate: handleActivate,
            onDeactivate: handleDeactivate,
            updatingModules
          },
          groupSlug
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RequiresConnectionSection, { features: requiresConnectionFeatures })
      ] })
    }
  );
};
OfflineMode.propTypes = {
  activateModule: import_prop_types.default.func.isRequired,
  apiNonce: import_prop_types.default.string,
  apiRoot: import_prop_types.default.string,
  deactivateModule: import_prop_types.default.func.isRequired,
  fetchModules: import_prop_types.default.func.isRequired
};

// routes/index/stage.jsx
var import_jsx_runtime12 = __toESM(require_jsx_runtime());
var getInitialState = () => window.JetpackOfflineModeInitialState || {};
function configureRestApi(apiRoot, apiNonce) {
  if (apiRoot) {
    api_default.setApiRoot(apiRoot);
    if (import_api_fetch2.default.createRootURLMiddleware) {
      import_api_fetch2.default.use(import_api_fetch2.default.createRootURLMiddleware(apiRoot));
    }
  }
  if (apiNonce) {
    api_default.setApiNonce(apiNonce);
    if (import_api_fetch2.default.createNonceMiddleware) {
      import_api_fetch2.default.use(import_api_fetch2.default.createNonceMiddleware(apiNonce));
    }
  }
}
function Stage() {
  const { apiNonce = "", apiRoot = "" } = getInitialState();
  const moduleActions = (0, import_element6.useMemo)(
    () => ({
      activateModule: (module) => api_default.activateModule(module),
      deactivateModule: (module) => api_default.deactivateModule(module),
      fetchModules: () => api_default.fetchModules()
    }),
    []
  );
  (0, import_element6.useEffect)(() => {
    configureRestApi(apiRoot, apiNonce);
  }, [apiNonce, apiRoot]);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(OfflineMode, { apiNonce, apiRoot, ...moduleActions });
}
export {
  Stage as stage
};
/*! Bundled license information:

react-is/cjs/react-is.development.js:
  (** @license React v16.13.1
   * react-is.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)
*/
