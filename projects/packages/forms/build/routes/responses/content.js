var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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

// vendor-external:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "vendor-external:react/jsx-runtime"(exports, module) {
    module.exports = window.ReactJSXRuntime;
  }
});

// vendor-external:react
var require_react = __commonJS({
  "vendor-external:react"(exports, module) {
    module.exports = window.React;
  }
});

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
var require_use_sync_external_store_shim_development = __commonJS({
  "../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js"(exports) {
    "use strict";
    (function() {
      function is(x2, y2) {
        return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
      }
      function useSyncExternalStore$2(subscribe2, getSnapshot) {
        didWarnOld18Alpha || void 0 === React36.startTransition || (didWarnOld18Alpha = true, console.error(
          "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
        ));
        var value = getSnapshot();
        if (!didWarnUncachedGetSnapshot) {
          var cachedValue = getSnapshot();
          objectIs(value, cachedValue) || (console.error(
            "The result of getSnapshot should be cached to avoid an infinite loop"
          ), didWarnUncachedGetSnapshot = true);
        }
        cachedValue = useState33({
          inst: { value, getSnapshot }
        });
        var inst = cachedValue[0].inst, forceUpdate = cachedValue[1];
        useLayoutEffect4(
          function() {
            inst.value = value;
            inst.getSnapshot = getSnapshot;
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          },
          [subscribe2, value, getSnapshot]
        );
        useEffect22(
          function() {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            return subscribe2(function() {
              checkIfSnapshotChanged(inst) && forceUpdate({ inst });
            });
          },
          [subscribe2]
        );
        useDebugValue(value);
        return value;
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error2) {
          return true;
        }
      }
      function useSyncExternalStore$1(subscribe2, getSnapshot) {
        return getSnapshot();
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React36 = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useState33 = React36.useState, useEffect22 = React36.useEffect, useLayoutEffect4 = React36.useLayoutEffect, useDebugValue = React36.useDebugValue, didWarnOld18Alpha = false, didWarnUncachedGetSnapshot = false, shim = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
      exports.useSyncExternalStore = void 0 !== React36.useSyncExternalStore ? React36.useSyncExternalStore : shim;
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS({
  "../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_use_sync_external_store_shim_development();
    }
  }
});

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
var require_with_selector_development = __commonJS({
  "../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js"(exports) {
    "use strict";
    (function() {
      function is(x2, y2) {
        return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React36 = require_react(), shim = require_shim(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore2 = shim.useSyncExternalStore, useRef33 = React36.useRef, useEffect22 = React36.useEffect, useMemo31 = React36.useMemo, useDebugValue = React36.useDebugValue;
      exports.useSyncExternalStoreWithSelector = function(subscribe2, getSnapshot, getServerSnapshot, selector2, isEqual) {
        var instRef = useRef33(null);
        if (null === instRef.current) {
          var inst = { hasValue: false, value: null };
          instRef.current = inst;
        } else inst = instRef.current;
        instRef = useMemo31(
          function() {
            function memoizedSelector(nextSnapshot) {
              if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                nextSnapshot = selector2(nextSnapshot);
                if (void 0 !== isEqual && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector2(nextSnapshot);
              if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
                return memoizedSnapshot = nextSnapshot, currentSelection;
              memoizedSnapshot = nextSnapshot;
              return memoizedSelection = nextSelection;
            }
            var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
              function() {
                return memoizedSelector(getSnapshot());
              },
              null === maybeGetServerSnapshot ? void 0 : function() {
                return memoizedSelector(maybeGetServerSnapshot());
              }
            ];
          },
          [getSnapshot, getServerSnapshot, selector2, isEqual]
        );
        var value = useSyncExternalStore2(subscribe2, instRef[0], instRef[1]);
        useEffect22(
          function() {
            inst.hasValue = true;
            inst.value = value;
          },
          [value]
        );
        useDebugValue(value);
        return value;
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// ../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = __commonJS({
  "../../../node_modules/.pnpm/use-sync-external-store@1.6.0_react@18.3.1/node_modules/use-sync-external-store/shim/with-selector.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_with_selector_development();
    }
  }
});

// vendor-external:react-dom
var require_react_dom = __commonJS({
  "vendor-external:react-dom"(exports, module) {
    module.exports = window.ReactDOM;
  }
});

// package-external:@wordpress/element
var require_element = __commonJS({
  "package-external:@wordpress/element"(exports, module) {
    module.exports = window.wp.element;
  }
});

// package-external:@wordpress/components
var require_components = __commonJS({
  "package-external:@wordpress/components"(exports, module) {
    module.exports = window.wp.components;
  }
});

// package-external:@wordpress/core-data
var require_core_data = __commonJS({
  "package-external:@wordpress/core-data"(exports, module) {
    module.exports = window.wp.coreData;
  }
});

// package-external:@wordpress/compose
var require_compose = __commonJS({
  "package-external:@wordpress/compose"(exports, module) {
    module.exports = window.wp.compose;
  }
});

// package-external:@wordpress/i18n
var require_i18n = __commonJS({
  "package-external:@wordpress/i18n"(exports, module) {
    module.exports = window.wp.i18n;
  }
});

// package-external:@wordpress/primitives
var require_primitives = __commonJS({
  "package-external:@wordpress/primitives"(exports, module) {
    module.exports = window.wp.primitives;
  }
});

// package-external:@wordpress/keycodes
var require_keycodes = __commonJS({
  "package-external:@wordpress/keycodes"(exports, module) {
    module.exports = window.wp.keycodes;
  }
});

// package-external:@wordpress/data
var require_data = __commonJS({
  "package-external:@wordpress/data"(exports, module) {
    module.exports = window.wp.data;
  }
});

// package-external:@wordpress/private-apis
var require_private_apis = __commonJS({
  "package-external:@wordpress/private-apis"(exports, module) {
    module.exports = window.wp.privateApis;
  }
});

// ../../../node_modules/.pnpm/remove-accents@0.5.0/node_modules/remove-accents/index.js
var require_remove_accents = __commonJS({
  "../../../node_modules/.pnpm/remove-accents@0.5.0/node_modules/remove-accents/index.js"(exports, module) {
    var characterMap = {
      "\xC0": "A",
      "\xC1": "A",
      "\xC2": "A",
      "\xC3": "A",
      "\xC4": "A",
      "\xC5": "A",
      "\u1EA4": "A",
      "\u1EAE": "A",
      "\u1EB2": "A",
      "\u1EB4": "A",
      "\u1EB6": "A",
      "\xC6": "AE",
      "\u1EA6": "A",
      "\u1EB0": "A",
      "\u0202": "A",
      "\u1EA2": "A",
      "\u1EA0": "A",
      "\u1EA8": "A",
      "\u1EAA": "A",
      "\u1EAC": "A",
      "\xC7": "C",
      "\u1E08": "C",
      "\xC8": "E",
      "\xC9": "E",
      "\xCA": "E",
      "\xCB": "E",
      "\u1EBE": "E",
      "\u1E16": "E",
      "\u1EC0": "E",
      "\u1E14": "E",
      "\u1E1C": "E",
      "\u0206": "E",
      "\u1EBA": "E",
      "\u1EBC": "E",
      "\u1EB8": "E",
      "\u1EC2": "E",
      "\u1EC4": "E",
      "\u1EC6": "E",
      "\xCC": "I",
      "\xCD": "I",
      "\xCE": "I",
      "\xCF": "I",
      "\u1E2E": "I",
      "\u020A": "I",
      "\u1EC8": "I",
      "\u1ECA": "I",
      "\xD0": "D",
      "\xD1": "N",
      "\xD2": "O",
      "\xD3": "O",
      "\xD4": "O",
      "\xD5": "O",
      "\xD6": "O",
      "\xD8": "O",
      "\u1ED0": "O",
      "\u1E4C": "O",
      "\u1E52": "O",
      "\u020E": "O",
      "\u1ECE": "O",
      "\u1ECC": "O",
      "\u1ED4": "O",
      "\u1ED6": "O",
      "\u1ED8": "O",
      "\u1EDC": "O",
      "\u1EDE": "O",
      "\u1EE0": "O",
      "\u1EDA": "O",
      "\u1EE2": "O",
      "\xD9": "U",
      "\xDA": "U",
      "\xDB": "U",
      "\xDC": "U",
      "\u1EE6": "U",
      "\u1EE4": "U",
      "\u1EEC": "U",
      "\u1EEE": "U",
      "\u1EF0": "U",
      "\xDD": "Y",
      "\xE0": "a",
      "\xE1": "a",
      "\xE2": "a",
      "\xE3": "a",
      "\xE4": "a",
      "\xE5": "a",
      "\u1EA5": "a",
      "\u1EAF": "a",
      "\u1EB3": "a",
      "\u1EB5": "a",
      "\u1EB7": "a",
      "\xE6": "ae",
      "\u1EA7": "a",
      "\u1EB1": "a",
      "\u0203": "a",
      "\u1EA3": "a",
      "\u1EA1": "a",
      "\u1EA9": "a",
      "\u1EAB": "a",
      "\u1EAD": "a",
      "\xE7": "c",
      "\u1E09": "c",
      "\xE8": "e",
      "\xE9": "e",
      "\xEA": "e",
      "\xEB": "e",
      "\u1EBF": "e",
      "\u1E17": "e",
      "\u1EC1": "e",
      "\u1E15": "e",
      "\u1E1D": "e",
      "\u0207": "e",
      "\u1EBB": "e",
      "\u1EBD": "e",
      "\u1EB9": "e",
      "\u1EC3": "e",
      "\u1EC5": "e",
      "\u1EC7": "e",
      "\xEC": "i",
      "\xED": "i",
      "\xEE": "i",
      "\xEF": "i",
      "\u1E2F": "i",
      "\u020B": "i",
      "\u1EC9": "i",
      "\u1ECB": "i",
      "\xF0": "d",
      "\xF1": "n",
      "\xF2": "o",
      "\xF3": "o",
      "\xF4": "o",
      "\xF5": "o",
      "\xF6": "o",
      "\xF8": "o",
      "\u1ED1": "o",
      "\u1E4D": "o",
      "\u1E53": "o",
      "\u020F": "o",
      "\u1ECF": "o",
      "\u1ECD": "o",
      "\u1ED5": "o",
      "\u1ED7": "o",
      "\u1ED9": "o",
      "\u1EDD": "o",
      "\u1EDF": "o",
      "\u1EE1": "o",
      "\u1EDB": "o",
      "\u1EE3": "o",
      "\xF9": "u",
      "\xFA": "u",
      "\xFB": "u",
      "\xFC": "u",
      "\u1EE7": "u",
      "\u1EE5": "u",
      "\u1EED": "u",
      "\u1EEF": "u",
      "\u1EF1": "u",
      "\xFD": "y",
      "\xFF": "y",
      "\u0100": "A",
      "\u0101": "a",
      "\u0102": "A",
      "\u0103": "a",
      "\u0104": "A",
      "\u0105": "a",
      "\u0106": "C",
      "\u0107": "c",
      "\u0108": "C",
      "\u0109": "c",
      "\u010A": "C",
      "\u010B": "c",
      "\u010C": "C",
      "\u010D": "c",
      "C\u0306": "C",
      "c\u0306": "c",
      "\u010E": "D",
      "\u010F": "d",
      "\u0110": "D",
      "\u0111": "d",
      "\u0112": "E",
      "\u0113": "e",
      "\u0114": "E",
      "\u0115": "e",
      "\u0116": "E",
      "\u0117": "e",
      "\u0118": "E",
      "\u0119": "e",
      "\u011A": "E",
      "\u011B": "e",
      "\u011C": "G",
      "\u01F4": "G",
      "\u011D": "g",
      "\u01F5": "g",
      "\u011E": "G",
      "\u011F": "g",
      "\u0120": "G",
      "\u0121": "g",
      "\u0122": "G",
      "\u0123": "g",
      "\u0124": "H",
      "\u0125": "h",
      "\u0126": "H",
      "\u0127": "h",
      "\u1E2A": "H",
      "\u1E2B": "h",
      "\u0128": "I",
      "\u0129": "i",
      "\u012A": "I",
      "\u012B": "i",
      "\u012C": "I",
      "\u012D": "i",
      "\u012E": "I",
      "\u012F": "i",
      "\u0130": "I",
      "\u0131": "i",
      "\u0132": "IJ",
      "\u0133": "ij",
      "\u0134": "J",
      "\u0135": "j",
      "\u0136": "K",
      "\u0137": "k",
      "\u1E30": "K",
      "\u1E31": "k",
      "K\u0306": "K",
      "k\u0306": "k",
      "\u0139": "L",
      "\u013A": "l",
      "\u013B": "L",
      "\u013C": "l",
      "\u013D": "L",
      "\u013E": "l",
      "\u013F": "L",
      "\u0140": "l",
      "\u0141": "l",
      "\u0142": "l",
      "\u1E3E": "M",
      "\u1E3F": "m",
      "M\u0306": "M",
      "m\u0306": "m",
      "\u0143": "N",
      "\u0144": "n",
      "\u0145": "N",
      "\u0146": "n",
      "\u0147": "N",
      "\u0148": "n",
      "\u0149": "n",
      "N\u0306": "N",
      "n\u0306": "n",
      "\u014C": "O",
      "\u014D": "o",
      "\u014E": "O",
      "\u014F": "o",
      "\u0150": "O",
      "\u0151": "o",
      "\u0152": "OE",
      "\u0153": "oe",
      "P\u0306": "P",
      "p\u0306": "p",
      "\u0154": "R",
      "\u0155": "r",
      "\u0156": "R",
      "\u0157": "r",
      "\u0158": "R",
      "\u0159": "r",
      "R\u0306": "R",
      "r\u0306": "r",
      "\u0212": "R",
      "\u0213": "r",
      "\u015A": "S",
      "\u015B": "s",
      "\u015C": "S",
      "\u015D": "s",
      "\u015E": "S",
      "\u0218": "S",
      "\u0219": "s",
      "\u015F": "s",
      "\u0160": "S",
      "\u0161": "s",
      "\u0162": "T",
      "\u0163": "t",
      "\u021B": "t",
      "\u021A": "T",
      "\u0164": "T",
      "\u0165": "t",
      "\u0166": "T",
      "\u0167": "t",
      "T\u0306": "T",
      "t\u0306": "t",
      "\u0168": "U",
      "\u0169": "u",
      "\u016A": "U",
      "\u016B": "u",
      "\u016C": "U",
      "\u016D": "u",
      "\u016E": "U",
      "\u016F": "u",
      "\u0170": "U",
      "\u0171": "u",
      "\u0172": "U",
      "\u0173": "u",
      "\u0216": "U",
      "\u0217": "u",
      "V\u0306": "V",
      "v\u0306": "v",
      "\u0174": "W",
      "\u0175": "w",
      "\u1E82": "W",
      "\u1E83": "w",
      "X\u0306": "X",
      "x\u0306": "x",
      "\u0176": "Y",
      "\u0177": "y",
      "\u0178": "Y",
      "Y\u0306": "Y",
      "y\u0306": "y",
      "\u0179": "Z",
      "\u017A": "z",
      "\u017B": "Z",
      "\u017C": "z",
      "\u017D": "Z",
      "\u017E": "z",
      "\u017F": "s",
      "\u0192": "f",
      "\u01A0": "O",
      "\u01A1": "o",
      "\u01AF": "U",
      "\u01B0": "u",
      "\u01CD": "A",
      "\u01CE": "a",
      "\u01CF": "I",
      "\u01D0": "i",
      "\u01D1": "O",
      "\u01D2": "o",
      "\u01D3": "U",
      "\u01D4": "u",
      "\u01D5": "U",
      "\u01D6": "u",
      "\u01D7": "U",
      "\u01D8": "u",
      "\u01D9": "U",
      "\u01DA": "u",
      "\u01DB": "U",
      "\u01DC": "u",
      "\u1EE8": "U",
      "\u1EE9": "u",
      "\u1E78": "U",
      "\u1E79": "u",
      "\u01FA": "A",
      "\u01FB": "a",
      "\u01FC": "AE",
      "\u01FD": "ae",
      "\u01FE": "O",
      "\u01FF": "o",
      "\xDE": "TH",
      "\xFE": "th",
      "\u1E54": "P",
      "\u1E55": "p",
      "\u1E64": "S",
      "\u1E65": "s",
      "X\u0301": "X",
      "x\u0301": "x",
      "\u0403": "\u0413",
      "\u0453": "\u0433",
      "\u040C": "\u041A",
      "\u045C": "\u043A",
      "A\u030B": "A",
      "a\u030B": "a",
      "E\u030B": "E",
      "e\u030B": "e",
      "I\u030B": "I",
      "i\u030B": "i",
      "\u01F8": "N",
      "\u01F9": "n",
      "\u1ED2": "O",
      "\u1ED3": "o",
      "\u1E50": "O",
      "\u1E51": "o",
      "\u1EEA": "U",
      "\u1EEB": "u",
      "\u1E80": "W",
      "\u1E81": "w",
      "\u1EF2": "Y",
      "\u1EF3": "y",
      "\u0200": "A",
      "\u0201": "a",
      "\u0204": "E",
      "\u0205": "e",
      "\u0208": "I",
      "\u0209": "i",
      "\u020C": "O",
      "\u020D": "o",
      "\u0210": "R",
      "\u0211": "r",
      "\u0214": "U",
      "\u0215": "u",
      "B\u030C": "B",
      "b\u030C": "b",
      "\u010C\u0323": "C",
      "\u010D\u0323": "c",
      "\xCA\u030C": "E",
      "\xEA\u030C": "e",
      "F\u030C": "F",
      "f\u030C": "f",
      "\u01E6": "G",
      "\u01E7": "g",
      "\u021E": "H",
      "\u021F": "h",
      "J\u030C": "J",
      "\u01F0": "j",
      "\u01E8": "K",
      "\u01E9": "k",
      "M\u030C": "M",
      "m\u030C": "m",
      "P\u030C": "P",
      "p\u030C": "p",
      "Q\u030C": "Q",
      "q\u030C": "q",
      "\u0158\u0329": "R",
      "\u0159\u0329": "r",
      "\u1E66": "S",
      "\u1E67": "s",
      "V\u030C": "V",
      "v\u030C": "v",
      "W\u030C": "W",
      "w\u030C": "w",
      "X\u030C": "X",
      "x\u030C": "x",
      "Y\u030C": "Y",
      "y\u030C": "y",
      "A\u0327": "A",
      "a\u0327": "a",
      "B\u0327": "B",
      "b\u0327": "b",
      "\u1E10": "D",
      "\u1E11": "d",
      "\u0228": "E",
      "\u0229": "e",
      "\u0190\u0327": "E",
      "\u025B\u0327": "e",
      "\u1E28": "H",
      "\u1E29": "h",
      "I\u0327": "I",
      "i\u0327": "i",
      "\u0197\u0327": "I",
      "\u0268\u0327": "i",
      "M\u0327": "M",
      "m\u0327": "m",
      "O\u0327": "O",
      "o\u0327": "o",
      "Q\u0327": "Q",
      "q\u0327": "q",
      "U\u0327": "U",
      "u\u0327": "u",
      "X\u0327": "X",
      "x\u0327": "x",
      "Z\u0327": "Z",
      "z\u0327": "z",
      "\u0439": "\u0438",
      "\u0419": "\u0418",
      "\u0451": "\u0435",
      "\u0401": "\u0415"
    };
    var chars = Object.keys(characterMap).join("|");
    var allAccents = new RegExp(chars, "g");
    var firstAccent = new RegExp(chars, "");
    function matcher(match2) {
      return characterMap[match2];
    }
    var removeAccents2 = function(string) {
      return string.replace(allAccents, matcher);
    };
    var hasAccents = function(string) {
      return !!string.match(firstAccent);
    };
    module.exports = removeAccents2;
    module.exports.has = hasAccents;
    module.exports.remove = removeAccents2;
  }
});

// ../../../node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/es6/index.js
var require_es6 = __commonJS({
  "../../../node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/es6/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a2, b2) {
      if (a2 === b2) return true;
      if (a2 && b2 && typeof a2 == "object" && typeof b2 == "object") {
        if (a2.constructor !== b2.constructor) return false;
        var length, i2, keys;
        if (Array.isArray(a2)) {
          length = a2.length;
          if (length != b2.length) return false;
          for (i2 = length; i2-- !== 0; )
            if (!equal(a2[i2], b2[i2])) return false;
          return true;
        }
        if (a2 instanceof Map && b2 instanceof Map) {
          if (a2.size !== b2.size) return false;
          for (i2 of a2.entries())
            if (!b2.has(i2[0])) return false;
          for (i2 of a2.entries())
            if (!equal(i2[1], b2.get(i2[0]))) return false;
          return true;
        }
        if (a2 instanceof Set && b2 instanceof Set) {
          if (a2.size !== b2.size) return false;
          for (i2 of a2.entries())
            if (!b2.has(i2[0])) return false;
          return true;
        }
        if (ArrayBuffer.isView(a2) && ArrayBuffer.isView(b2)) {
          length = a2.length;
          if (length != b2.length) return false;
          for (i2 = length; i2-- !== 0; )
            if (a2[i2] !== b2[i2]) return false;
          return true;
        }
        if (a2.constructor === RegExp) return a2.source === b2.source && a2.flags === b2.flags;
        if (a2.valueOf !== Object.prototype.valueOf) return a2.valueOf() === b2.valueOf();
        if (a2.toString !== Object.prototype.toString) return a2.toString() === b2.toString();
        keys = Object.keys(a2);
        length = keys.length;
        if (length !== Object.keys(b2).length) return false;
        for (i2 = length; i2-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b2, keys[i2])) return false;
        for (i2 = length; i2-- !== 0; ) {
          var key = keys[i2];
          if (!equal(a2[key], b2[key])) return false;
        }
        return true;
      }
      return a2 !== a2 && b2 !== b2;
    };
  }
});

// package-external:@wordpress/warning
var require_warning = __commonJS({
  "package-external:@wordpress/warning"(exports, module) {
    module.exports = window.wp.warning;
  }
});

// package-external:@wordpress/date
var require_date = __commonJS({
  "package-external:@wordpress/date"(exports, module) {
    module.exports = window.wp.date;
  }
});

// package-external:@wordpress/html-entities
var require_html_entities = __commonJS({
  "package-external:@wordpress/html-entities"(exports, module) {
    module.exports = window.wp.htmlEntities;
  }
});

// ../../../node_modules/.pnpm/@tanstack+router-core@1.139.12/node_modules/@tanstack/router-core/dist/esm/utils.js
var hasOwn = Object.prototype.hasOwnProperty;
function replaceEqualDeep(prev, _next) {
  if (prev === _next) {
    return prev;
  }
  const next = _next;
  const array = isPlainArray(prev) && isPlainArray(next);
  if (!array && !(isPlainObject(prev) && isPlainObject(next))) return next;
  const prevItems = array ? prev : getEnumerableOwnKeys(prev);
  if (!prevItems) return next;
  const nextItems = array ? next : getEnumerableOwnKeys(next);
  if (!nextItems) return next;
  const prevSize = prevItems.length;
  const nextSize = nextItems.length;
  const copy = array ? new Array(nextSize) : {};
  let equalItems = 0;
  for (let i2 = 0; i2 < nextSize; i2++) {
    const key = array ? i2 : nextItems[i2];
    const p2 = prev[key];
    const n2 = next[key];
    if (p2 === n2) {
      copy[key] = p2;
      if (array ? i2 < prevSize : hasOwn.call(prev, key)) equalItems++;
      continue;
    }
    if (p2 === null || n2 === null || typeof p2 !== "object" || typeof n2 !== "object") {
      copy[key] = n2;
      continue;
    }
    const v2 = replaceEqualDeep(p2, n2);
    copy[key] = v2;
    if (v2 === p2) equalItems++;
  }
  return prevSize === nextSize && equalItems === prevSize ? prev : copy;
}
function getEnumerableOwnKeys(o2) {
  const keys = [];
  const names = Object.getOwnPropertyNames(o2);
  for (const name of names) {
    if (!Object.prototype.propertyIsEnumerable.call(o2, name)) return false;
    keys.push(name);
  }
  const symbols = Object.getOwnPropertySymbols(o2);
  for (const symbol3 of symbols) {
    if (!Object.prototype.propertyIsEnumerable.call(o2, symbol3)) return false;
    keys.push(symbol3);
  }
  return keys;
}
function isPlainObject(o2) {
  if (!hasObjectPrototype(o2)) {
    return false;
  }
  const ctor = o2.constructor;
  if (typeof ctor === "undefined") {
    return true;
  }
  const prot = ctor.prototype;
  if (!hasObjectPrototype(prot)) {
    return false;
  }
  if (!prot.hasOwnProperty("isPrototypeOf")) {
    return false;
  }
  return true;
}
function hasObjectPrototype(o2) {
  return Object.prototype.toString.call(o2) === "[object Object]";
}
function isPlainArray(value) {
  return Array.isArray(value) && value.length === Object.keys(value).length;
}

// ../../../node_modules/.pnpm/tiny-invariant@1.3.3/node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var isProduction = false;
var prefix = "Invariant failed";
function invariant(condition, message2) {
  if (condition) {
    return;
  }
  if (isProduction) {
    throw new Error(prefix);
  }
  var provided = typeof message2 === "function" ? message2() : message2;
  var value = provided ? "".concat(prefix, ": ").concat(provided) : prefix;
  throw new Error(value);
}

// ../../../node_modules/.pnpm/tiny-warning@1.0.3/node_modules/tiny-warning/dist/tiny-warning.esm.js
var isProduction2 = false;
function warning(condition, message2) {
  if (!isProduction2) {
    if (condition) {
      return;
    }
    var text = "Warning: " + message2;
    if (typeof console !== "undefined") {
      console.warn(text);
    }
    try {
      throw Error(text);
    } catch (x2) {
    }
  }
}
var tiny_warning_esm_default = warning;

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useMatch.js
var React4 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@tanstack+react-store@0.8.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-store/dist/esm/index.js
var import_with_selector = __toESM(require_with_selector(), 1);
function useStore(store, selector2 = (d2) => d2, options = {}) {
  const equal = options.equal ?? shallow;
  const slice = (0, import_with_selector.useSyncExternalStoreWithSelector)(
    store.subscribe,
    () => store.state,
    () => store.state,
    selector2,
    equal
  );
  return slice;
}
function shallow(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;
    for (const [k, v2] of objA) {
      if (!objB.has(k) || !Object.is(v2, objB.get(k))) return false;
    }
    return true;
  }
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) return false;
    for (const v2 of objA) {
      if (!objB.has(v2)) return false;
    }
    return true;
  }
  if (objA instanceof Date && objB instanceof Date) {
    if (objA.getTime() !== objB.getTime()) return false;
    return true;
  }
  const keysA = getOwnKeys(objA);
  if (keysA.length !== getOwnKeys(objB).length) {
    return false;
  }
  for (let i2 = 0; i2 < keysA.length; i2++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i2]) || !Object.is(objA[keysA[i2]], objB[keysA[i2]])) {
      return false;
    }
  }
  return true;
}
function getOwnKeys(obj) {
  return Object.keys(obj).concat(
    Object.getOwnPropertySymbols(obj)
  );
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouterState.js
var import_react = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouter.js
var React2 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/routerContext.js
var React = __toESM(require_react(), 1);
var routerContext = React.createContext(null);
function getRouterContext() {
  if (typeof document === "undefined") {
    return routerContext;
  }
  if (window.__TSR_ROUTER_CONTEXT__) {
    return window.__TSR_ROUTER_CONTEXT__;
  }
  window.__TSR_ROUTER_CONTEXT__ = routerContext;
  return routerContext;
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouter.js
function useRouter(opts) {
  const value = React2.useContext(getRouterContext());
  tiny_warning_esm_default(
    !((opts?.warn ?? true) && !value),
    "useRouter must be used inside a <RouterProvider> component!"
  );
  return value;
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useRouterState.js
function useRouterState(opts) {
  const contextRouter = useRouter({
    warn: opts?.router === void 0
  });
  const router = opts?.router || contextRouter;
  const previousResult = (0, import_react.useRef)(void 0);
  return useStore(router.__store, (state) => {
    if (opts?.select) {
      if (opts.structuralSharing ?? router.options.defaultStructuralSharing) {
        const newSlice = replaceEqualDeep(
          previousResult.current,
          opts.select(state)
        );
        previousResult.current = newSlice;
        return newSlice;
      }
      return opts.select(state);
    }
    return state;
  });
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/matchContext.js
var React3 = __toESM(require_react(), 1);
var matchContext = React3.createContext(void 0);
var dummyMatchContext = React3.createContext(
  void 0
);

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useMatch.js
function useMatch(opts) {
  const nearestMatchId = React4.useContext(
    opts.from ? dummyMatchContext : matchContext
  );
  const matchSelection = useRouterState({
    select: (state) => {
      const match2 = state.matches.find(
        (d2) => opts.from ? opts.from === d2.routeId : d2.id === nearestMatchId
      );
      invariant(
        !((opts.shouldThrow ?? true) && !match2),
        `Could not find ${opts.from ? `an active match from "${opts.from}"` : "a nearest match!"}`
      );
      if (match2 === void 0) {
        return void 0;
      }
      return opts.select ? opts.select(match2) : match2;
    },
    structuralSharing: opts.structuralSharing
  });
  return matchSelection;
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useParams.js
function useParams(opts) {
  return useMatch({
    from: opts.from,
    shouldThrow: opts.shouldThrow,
    structuralSharing: opts.structuralSharing,
    strict: opts.strict,
    select: (match2) => {
      const params = opts.strict === false ? match2.params : match2._strictParams;
      return opts.select ? opts.select(params) : params;
    }
  });
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useSearch.js
function useSearch(opts) {
  return useMatch({
    from: opts.from,
    strict: opts.strict,
    shouldThrow: opts.shouldThrow,
    structuralSharing: opts.structuralSharing,
    select: (match2) => {
      return opts.select ? opts.select(match2.search) : match2.search;
    }
  });
}

// ../../../node_modules/.pnpm/@tanstack+react-router@1.139.12_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-router/dist/esm/useNavigate.js
var React5 = __toESM(require_react(), 1);
function useNavigate(_defaultOpts) {
  const router = useRouter();
  return React5.useCallback(
    (options) => {
      return router.navigate({
        ...options,
        from: options.from ?? _defaultOpts?.from
      });
    },
    [_defaultOpts?.from, router]
  );
}

// ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
function r(e2) {
  var t2, f2, n2 = "";
  if ("string" == typeof e2 || "number" == typeof e2) n2 += e2;
  else if ("object" == typeof e2) if (Array.isArray(e2)) {
    var o2 = e2.length;
    for (t2 = 0; t2 < o2; t2++) e2[t2] && (f2 = r(e2[t2])) && (n2 && (n2 += " "), n2 += f2);
  } else for (f2 in e2) e2[f2] && (n2 && (n2 += " "), n2 += f2);
  return n2;
}
function clsx() {
  for (var e2, t2, f2 = 0, n2 = "", o2 = arguments.length; f2 < o2; f2++) (e2 = arguments[f2]) && (t2 = r(e2)) && (n2 && (n2 += " "), n2 += t2);
  return n2;
}
var clsx_default = clsx;

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.3.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6_b3f1c0a24b274b87ef84b171d163fe1c/node_modules/@wordpress/admin-ui/build-module/navigable-region/index.js
var import_element = __toESM(require_element(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var NavigableRegion = (0, import_element.forwardRef)(
  ({ children, className, ariaLabel, as: Tag = "div", ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.3.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6_b3f1c0a24b274b87ef84b171d163fe1c/node_modules/@wordpress/admin-ui/build-module/page/header.js
var import_components = __toESM(require_components(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
function Header({
  breadcrumbs,
  badges,
  title,
  subTitle,
  actions
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_components.__experimentalVStack, { className: "admin-ui-page__header", as: "header", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      import_components.__experimentalHStack,
      {
        className: "admin-ui-page__header-title",
        justify: "space-between",
        spacing: 2,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_components.__experimentalHStack, { spacing: 2, children: [
            title && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_components.__experimentalHeading, { as: "h2", level: 3, weight: 500, truncate: true, children: title }),
            breadcrumbs,
            badges
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_components.__experimentalHStack,
            {
              style: { width: "auto", flexShrink: 0 },
              spacing: 2,
              className: "admin-ui-page__header-actions",
              children: actions
            }
          )
        ]
      }
    ),
    subTitle && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "admin-ui-page__header-subtitle", children: subTitle })
  ] });
}

// ../../../node_modules/.pnpm/@wordpress+admin-ui@1.3.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6_b3f1c0a24b274b87ef84b171d163fe1c/node_modules/@wordpress/admin-ui/build-module/page/index.js
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function Page({
  breadcrumbs,
  badges,
  title,
  subTitle,
  children,
  className,
  actions,
  hasPadding = false
}) {
  const classes = clsx_default("admin-ui-page", className);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(navigable_region_default, { className: classes, ariaLabel: title, children: [
    (title || breadcrumbs || badges) && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      Header,
      {
        breadcrumbs,
        badges,
        title,
        subTitle,
        actions
      }
    ),
    hasPadding ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "admin-ui-page__content has-padding", children }) : children
  ] });
}
var page_default = Page;

// routes/responses/stage.tsx
var import_components44 = __toESM(require_components());
var import_core_data = __toESM(require_core_data());

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews/index.js
var import_jsx_runtime100 = __toESM(require_jsx_runtime(), 1);
var import_components43 = __toESM(require_components(), 1);
var import_element46 = __toESM(require_element(), 1);
var import_compose11 = __toESM(require_compose(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-context/index.js
var import_element2 = __toESM(require_element(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/constants.js
var import_i18n = __toESM(require_i18n(), 1);

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/arrow-down.js
var import_primitives = __toESM(require_primitives(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var arrow_down_default = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_primitives.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_primitives.Path, { d: "m16.5 13.5-3.7 3.7V4h-1.5v13.2l-3.8-3.7-1 1 5.5 5.6 5.5-5.6z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/arrow-left.js
var import_primitives2 = __toESM(require_primitives(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var arrow_left_default = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_primitives2.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_primitives2.Path, { d: "M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/arrow-right.js
var import_primitives3 = __toESM(require_primitives(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var arrow_right_default = /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_primitives3.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_primitives3.Path, { d: "m14.5 6.5-1 1 3.7 3.7H4v1.6h13.2l-3.7 3.7 1 1 5.6-5.5z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/arrow-up.js
var import_primitives4 = __toESM(require_primitives(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var arrow_up_default = /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_primitives4.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_primitives4.Path, { d: "M12 3.9 6.5 9.5l1 1 3.8-3.7V20h1.5V6.8l3.7 3.7 1-1z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/at-symbol.js
var import_primitives5 = __toESM(require_primitives(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var at_symbol_default = /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_primitives5.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_primitives5.Path, { d: "M12.5939 21C14.1472 21 16.1269 20.5701 17.0711 20.1975L16.6447 18.879C16.0964 19.051 14.3299 19.6242 12.6548 19.6242C7.4467 19.6242 4.67513 16.8726 4.67513 12C4.67513 7.21338 7.50762 4.34713 12.2893 4.34713C17.132 4.34713 19.4162 7.55732 19.4162 10.7675C19.4162 14.035 19.0508 15.4968 17.4975 15.4968C16.5838 15.4968 16.0964 14.7803 16.0964 13.9777V7.5H14.4822V8.30255H14.3909C14.1777 7.67198 12.9898 7.12739 11.467 7.2707C9.18274 7.5 7.4467 9.27707 7.4467 11.8567C7.4467 14.5796 8.81726 16.672 11.467 16.758C13.203 16.8153 14.1168 16.0127 14.4822 15.1815H14.5736C14.7563 16.414 16.401 16.8439 17.467 16.8439C20.6954 16.8439 21 13.5764 21 10.7962C21 6.86943 18.0761 3 12.3807 3C6.50254 3 3 6.3535 3 11.9427C3 17.7325 6.38071 21 12.5939 21ZM11.7107 15.2962C9.73096 15.2962 9.03046 13.6051 9.03046 11.7707C9.03046 10.1083 10.0355 8.67516 11.7716 8.67516C13.599 8.67516 14.5736 9.36306 14.5736 11.7707C14.5736 14.1497 13.7513 15.2962 11.7107 15.2962Z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/block-table.js
var import_primitives6 = __toESM(require_primitives(), 1);
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var block_table_default = /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_primitives6.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_primitives6.Path, { d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v3.5h-15V5c0-.3.2-.5.5-.5zm8 5.5h6.5v3.5H13V10zm-1.5 3.5h-7V10h7v3.5zm-7 5.5v-4h7v4.5H5c-.3 0-.5-.2-.5-.5zm14.5.5h-6V15h6.5v4c0 .3-.2.5-.5.5z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/category.js
var import_primitives7 = __toESM(require_primitives(), 1);
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var category_default = /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_primitives7.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  import_primitives7.Path,
  {
    d: "M6 5.5h3a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5zM4 6a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm11-.5h3a.5.5 0 01.5.5v3a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V6a.5.5 0 01.5-.5zM13 6a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V6zm5 8.5h-3a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h3a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5zM15 13a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2v-3a2 2 0 00-2-2h-3zm-9 1.5h3a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5zM4 15a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }
) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/check.js
var import_primitives8 = __toESM(require_primitives(), 1);
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var check_default = /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_primitives8.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_primitives8.Path, { d: "M16.5 7.5 10 13.9l-2.5-2.4-1 1 3.5 3.6 7.5-7.6z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/chevron-down.js
var import_primitives9 = __toESM(require_primitives(), 1);
var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
var chevron_down_default = /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_primitives9.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_primitives9.Path, { d: "M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/chevron-right.js
var import_primitives10 = __toESM(require_primitives(), 1);
var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
var chevron_right_default = /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_primitives10.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_primitives10.Path, { d: "M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/chevron-up.js
var import_primitives11 = __toESM(require_primitives(), 1);
var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
var chevron_up_default = /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_primitives11.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_primitives11.Path, { d: "M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/close-small.js
var import_primitives12 = __toESM(require_primitives(), 1);
var import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
var close_small_default = /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_primitives12.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_primitives12.Path, { d: "M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/close.js
var import_primitives13 = __toESM(require_primitives(), 1);
var import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
var close_default = /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_primitives13.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_primitives13.Path, { d: "m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/cog.js
var import_primitives14 = __toESM(require_primitives(), 1);
var import_jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
var cog_default = /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_primitives14.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
  import_primitives14.Path,
  {
    fillRule: "evenodd",
    d: "M10.289 4.836A1 1 0 0111.275 4h1.306a1 1 0 01.987.836l.244 1.466c.787.26 1.503.679 2.108 1.218l1.393-.522a1 1 0 011.216.437l.653 1.13a1 1 0 01-.23 1.273l-1.148.944a6.025 6.025 0 010 2.435l1.149.946a1 1 0 01.23 1.272l-.653 1.13a1 1 0 01-1.216.437l-1.394-.522c-.605.54-1.32.958-2.108 1.218l-.244 1.466a1 1 0 01-.987.836h-1.306a1 1 0 01-.986-.836l-.244-1.466a5.995 5.995 0 01-2.108-1.218l-1.394.522a1 1 0 01-1.217-.436l-.653-1.131a1 1 0 01.23-1.272l1.149-.946a6.026 6.026 0 010-2.435l-1.148-.944a1 1 0 01-.23-1.272l.653-1.131a1 1 0 011.217-.437l1.393.522a5.994 5.994 0 012.108-1.218l.244-1.466zM14.929 12a3 3 0 11-6 0 3 3 0 016 0z",
    clipRule: "evenodd"
  }
) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/error.js
var import_primitives15 = __toESM(require_primitives(), 1);
var import_jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
var error_default = /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_primitives15.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  import_primitives15.Path,
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12.218 5.377a.25.25 0 0 0-.436 0l-7.29 12.96a.25.25 0 0 0 .218.373h14.58a.25.25 0 0 0 .218-.372l-7.29-12.96Zm-1.743-.735c.669-1.19 2.381-1.19 3.05 0l7.29 12.96a1.75 1.75 0 0 1-1.525 2.608H4.71a1.75 1.75 0 0 1-1.525-2.608l7.29-12.96ZM12.75 17.46h-1.5v-1.5h1.5v1.5Zm-1.5-3h1.5v-5h-1.5v5Z"
  }
) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/format-list-bullets-rtl.js
var import_primitives16 = __toESM(require_primitives(), 1);
var import_jsx_runtime19 = __toESM(require_jsx_runtime(), 1);
var format_list_bullets_rtl_default = /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_primitives16.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(import_primitives16.Path, { d: "M4 8.8h8.9V7.2H4v1.6zm0 7h8.9v-1.5H4v1.5zM18 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/format-list-bullets.js
var import_primitives17 = __toESM(require_primitives(), 1);
var import_jsx_runtime20 = __toESM(require_jsx_runtime(), 1);
var format_list_bullets_default = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_primitives17.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_primitives17.Path, { d: "M11.1 15.8H20v-1.5h-8.9v1.5zm0-8.6v1.5H20V7.2h-8.9zM6 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/funnel.js
var import_primitives18 = __toESM(require_primitives(), 1);
var import_jsx_runtime21 = __toESM(require_jsx_runtime(), 1);
var funnel_default = /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_primitives18.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_primitives18.Path, { d: "M10 17.5H14V16H10V17.5ZM6 6V7.5H18V6H6ZM8 12.5H16V11H8V12.5Z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/link.js
var import_primitives19 = __toESM(require_primitives(), 1);
var import_jsx_runtime22 = __toESM(require_jsx_runtime(), 1);
var link_default = /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_primitives19.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_primitives19.Path, { d: "M10 17.389H8.444A5.194 5.194 0 1 1 8.444 7H10v1.5H8.444a3.694 3.694 0 0 0 0 7.389H10v1.5ZM14 7h1.556a5.194 5.194 0 0 1 0 10.39H14v-1.5h1.556a3.694 3.694 0 0 0 0-7.39H14V7Zm-4.5 6h5v-1.5h-5V13Z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/lock.js
var import_primitives20 = __toESM(require_primitives(), 1);
var import_jsx_runtime23 = __toESM(require_jsx_runtime(), 1);
var lock_default = /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_primitives20.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(import_primitives20.Path, { d: "M17 10h-1.2V7c0-2.1-1.7-3.8-3.8-3.8-2.1 0-3.8 1.7-3.8 3.8v3H7c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-8c0-.6-.4-1-1-1zm-2.8 0H9.8V7c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v3z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/mobile.js
var import_primitives21 = __toESM(require_primitives(), 1);
var import_jsx_runtime24 = __toESM(require_jsx_runtime(), 1);
var mobile_default = /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_primitives21.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_primitives21.Path, { d: "M15 4H9c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 14c0 .3-.2.5-.5.5H9c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h6c.3 0 .5.2.5.5v12zm-4.5-.5h2V16h-2v1.5z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/more-vertical.js
var import_primitives22 = __toESM(require_primitives(), 1);
var import_jsx_runtime25 = __toESM(require_jsx_runtime(), 1);
var more_vertical_default = /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_primitives22.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(import_primitives22.Path, { d: "M13 19h-2v-2h2v2zm0-6h-2v-2h2v2zm0-6h-2V5h2v2z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/next.js
var import_primitives23 = __toESM(require_primitives(), 1);
var import_jsx_runtime26 = __toESM(require_jsx_runtime(), 1);
var next_default = /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_primitives23.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_primitives23.Path, { d: "M6.6 6L5.4 7l4.5 5-4.5 5 1.1 1 5.5-6-5.4-6zm6 0l-1.1 1 4.5 5-4.5 5 1.1 1 5.5-6-5.5-6z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/previous.js
var import_primitives24 = __toESM(require_primitives(), 1);
var import_jsx_runtime27 = __toESM(require_jsx_runtime(), 1);
var previous_default = /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_primitives24.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(import_primitives24.Path, { d: "M11.6 7l-1.1-1L5 12l5.5 6 1.1-1L7 12l4.6-5zm6 0l-1.1-1-5.5 6 5.5 6 1.1-1-4.6-5 4.6-5z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/search.js
var import_primitives25 = __toESM(require_primitives(), 1);
var import_jsx_runtime28 = __toESM(require_jsx_runtime(), 1);
var search_default = /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_primitives25.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(import_primitives25.Path, { d: "M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/seen.js
var import_primitives26 = __toESM(require_primitives(), 1);
var import_jsx_runtime29 = __toESM(require_jsx_runtime(), 1);
var seen_default = /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_primitives26.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(import_primitives26.Path, { d: "M3.99961 13C4.67043 13.3354 4.6703 13.3357 4.67017 13.3359L4.67298 13.3305C4.67621 13.3242 4.68184 13.3135 4.68988 13.2985C4.70595 13.2686 4.7316 13.2218 4.76695 13.1608C4.8377 13.0385 4.94692 12.8592 5.09541 12.6419C5.39312 12.2062 5.84436 11.624 6.45435 11.0431C7.67308 9.88241 9.49719 8.75 11.9996 8.75C14.502 8.75 16.3261 9.88241 17.5449 11.0431C18.1549 11.624 18.6061 12.2062 18.9038 12.6419C19.0523 12.8592 19.1615 13.0385 19.2323 13.1608C19.2676 13.2218 19.2933 13.2686 19.3093 13.2985C19.3174 13.3135 19.323 13.3242 19.3262 13.3305L19.3291 13.3359C19.3289 13.3357 19.3288 13.3354 19.9996 13C20.6704 12.6646 20.6703 12.6643 20.6701 12.664L20.6697 12.6632L20.6688 12.6614L20.6662 12.6563L20.6583 12.6408C20.6517 12.6282 20.6427 12.6108 20.631 12.5892C20.6078 12.5459 20.5744 12.4852 20.5306 12.4096C20.4432 12.2584 20.3141 12.0471 20.1423 11.7956C19.7994 11.2938 19.2819 10.626 18.5794 9.9569C17.1731 8.61759 14.9972 7.25 11.9996 7.25C9.00203 7.25 6.82614 8.61759 5.41987 9.9569C4.71736 10.626 4.19984 11.2938 3.85694 11.7956C3.68511 12.0471 3.55605 12.2584 3.4686 12.4096C3.42484 12.4852 3.39142 12.5459 3.36818 12.5892C3.35656 12.6108 3.34748 12.6282 3.34092 12.6408L3.33297 12.6563L3.33041 12.6614L3.32948 12.6632L3.32911 12.664C3.32894 12.6643 3.32879 12.6646 3.99961 13ZM11.9996 16C13.9326 16 15.4996 14.433 15.4996 12.5C15.4996 10.567 13.9326 9 11.9996 9C10.0666 9 8.49961 10.567 8.49961 12.5C8.49961 14.433 10.0666 16 11.9996 16Z" }) });

// ../../../node_modules/.pnpm/@wordpress+icons@11.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6dae6307de837e4d30b_react@18.3.1/node_modules/@wordpress/icons/build-module/library/unseen.js
var import_primitives27 = __toESM(require_primitives(), 1);
var import_jsx_runtime30 = __toESM(require_jsx_runtime(), 1);
var unseen_default = /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_primitives27.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(import_primitives27.Path, { d: "M20.7 12.7s0-.1-.1-.2c0-.2-.2-.4-.4-.6-.3-.5-.9-1.2-1.6-1.8-.7-.6-1.5-1.3-2.6-1.8l-.6 1.4c.9.4 1.6 1 2.1 1.5.6.6 1.1 1.2 1.4 1.6.1.2.3.4.3.5v.1l.7-.3.7-.3Zm-5.2-9.3-1.8 4c-.5-.1-1.1-.2-1.7-.2-3 0-5.2 1.4-6.6 2.7-.7.7-1.2 1.3-1.6 1.8-.2.3-.3.5-.4.6 0 0 0 .1-.1.2s0 0 .7.3l.7.3V13c0-.1.2-.3.3-.5.3-.4.7-1 1.4-1.6 1.2-1.2 3-2.3 5.5-2.3H13v.3c-.4 0-.8-.1-1.1-.1-1.9 0-3.5 1.6-3.5 3.5s.6 2.3 1.6 2.9l-2 4.4.9.4 7.6-16.2-.9-.4Zm-3 12.6c1.7-.2 3-1.7 3-3.5s-.2-1.4-.6-1.9L12.4 16Z" }) });

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/constants.js
var OPERATOR_IS = "is";
var OPERATOR_IS_NOT = "isNot";
var OPERATOR_IS_ANY = "isAny";
var OPERATOR_IS_NONE = "isNone";
var OPERATOR_IS_ALL = "isAll";
var OPERATOR_IS_NOT_ALL = "isNotAll";
var OPERATOR_LESS_THAN = "lessThan";
var OPERATOR_GREATER_THAN = "greaterThan";
var OPERATOR_LESS_THAN_OR_EQUAL = "lessThanOrEqual";
var OPERATOR_GREATER_THAN_OR_EQUAL = "greaterThanOrEqual";
var OPERATOR_BEFORE = "before";
var OPERATOR_AFTER = "after";
var OPERATOR_BEFORE_INC = "beforeInc";
var OPERATOR_AFTER_INC = "afterInc";
var OPERATOR_CONTAINS = "contains";
var OPERATOR_NOT_CONTAINS = "notContains";
var OPERATOR_STARTS_WITH = "startsWith";
var OPERATOR_BETWEEN = "between";
var OPERATOR_ON = "on";
var OPERATOR_NOT_ON = "notOn";
var OPERATOR_IN_THE_PAST = "inThePast";
var OPERATOR_OVER = "over";
var ALL_OPERATORS = [
  OPERATOR_IS,
  OPERATOR_IS_NOT,
  OPERATOR_IS_ANY,
  OPERATOR_IS_NONE,
  OPERATOR_IS_ALL,
  OPERATOR_IS_NOT_ALL,
  OPERATOR_LESS_THAN,
  OPERATOR_GREATER_THAN,
  OPERATOR_LESS_THAN_OR_EQUAL,
  OPERATOR_GREATER_THAN_OR_EQUAL,
  OPERATOR_BEFORE,
  OPERATOR_AFTER,
  OPERATOR_BEFORE_INC,
  OPERATOR_AFTER_INC,
  OPERATOR_CONTAINS,
  OPERATOR_NOT_CONTAINS,
  OPERATOR_STARTS_WITH,
  OPERATOR_BETWEEN,
  OPERATOR_ON,
  OPERATOR_NOT_ON,
  OPERATOR_IN_THE_PAST,
  OPERATOR_OVER
];
var SINGLE_SELECTION_OPERATORS = [
  OPERATOR_IS,
  OPERATOR_IS_NOT,
  OPERATOR_LESS_THAN,
  OPERATOR_GREATER_THAN,
  OPERATOR_LESS_THAN_OR_EQUAL,
  OPERATOR_GREATER_THAN_OR_EQUAL,
  OPERATOR_BEFORE,
  OPERATOR_AFTER,
  OPERATOR_BEFORE_INC,
  OPERATOR_AFTER_INC,
  OPERATOR_CONTAINS,
  OPERATOR_NOT_CONTAINS,
  OPERATOR_STARTS_WITH,
  OPERATOR_ON,
  OPERATOR_NOT_ON
];
var OPERATORS = {
  [OPERATOR_IS]: {
    key: "is-filter",
    label: (0, import_i18n.__)("Is")
  },
  [OPERATOR_IS_NOT]: {
    key: "is-not-filter",
    label: (0, import_i18n.__)("Is not")
  },
  [OPERATOR_IS_ANY]: {
    key: "is-any-filter",
    label: (0, import_i18n.__)("Is any")
  },
  [OPERATOR_IS_NONE]: {
    key: "is-none-filter",
    label: (0, import_i18n.__)("Is none")
  },
  [OPERATOR_IS_ALL]: {
    key: "is-all-filter",
    label: (0, import_i18n.__)("Is all")
  },
  [OPERATOR_IS_NOT_ALL]: {
    key: "is-not-all-filter",
    label: (0, import_i18n.__)("Is not all")
  },
  [OPERATOR_LESS_THAN]: {
    key: "less-than-filter",
    label: (0, import_i18n.__)("Less than")
  },
  [OPERATOR_GREATER_THAN]: {
    key: "greater-than-filter",
    label: (0, import_i18n.__)("Greater than")
  },
  [OPERATOR_LESS_THAN_OR_EQUAL]: {
    key: "less-than-or-equal-filter",
    label: (0, import_i18n.__)("Less than or equal")
  },
  [OPERATOR_GREATER_THAN_OR_EQUAL]: {
    key: "greater-than-or-equal-filter",
    label: (0, import_i18n.__)("Greater than or equal")
  },
  [OPERATOR_BEFORE]: {
    key: "before-filter",
    label: (0, import_i18n.__)("Before")
  },
  [OPERATOR_AFTER]: {
    key: "after-filter",
    label: (0, import_i18n.__)("After")
  },
  [OPERATOR_BEFORE_INC]: {
    key: "before-inc-filter",
    label: (0, import_i18n.__)("Before (inc)")
  },
  [OPERATOR_AFTER_INC]: {
    key: "after-inc-filter",
    label: (0, import_i18n.__)("After (inc)")
  },
  [OPERATOR_CONTAINS]: {
    key: "contains-filter",
    label: (0, import_i18n.__)("Contains")
  },
  [OPERATOR_NOT_CONTAINS]: {
    key: "not-contains-filter",
    label: (0, import_i18n.__)("Doesn't contain")
  },
  [OPERATOR_STARTS_WITH]: {
    key: "starts-with-filter",
    label: (0, import_i18n.__)("Starts with")
  },
  [OPERATOR_BETWEEN]: {
    key: "between-filter",
    label: (0, import_i18n.__)("Between (inc)")
  },
  [OPERATOR_ON]: {
    key: "on-filter",
    label: (0, import_i18n.__)("On")
  },
  [OPERATOR_NOT_ON]: {
    key: "not-on-filter",
    label: (0, import_i18n.__)("Not on")
  },
  [OPERATOR_IN_THE_PAST]: {
    key: "in-the-past-filter",
    label: (0, import_i18n.__)("In the past")
  },
  [OPERATOR_OVER]: {
    key: "over-filter",
    label: (0, import_i18n.__)("Over")
  }
};
var SORTING_DIRECTIONS = ["asc", "desc"];
var sortArrows = { asc: "\u2191", desc: "\u2193" };
var sortValues = { asc: "ascending", desc: "descending" };
var sortLabels = {
  asc: (0, import_i18n.__)("Sort ascending"),
  desc: (0, import_i18n.__)("Sort descending")
};
var sortIcons = {
  asc: arrow_up_default,
  desc: arrow_down_default
};
var LAYOUT_TABLE = "table";
var LAYOUT_GRID = "grid";
var LAYOUT_LIST = "list";
var LAYOUT_PICKER_GRID = "pickerGrid";

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-context/index.js
var DataViewsContext = (0, import_element2.createContext)({
  view: { type: LAYOUT_TABLE },
  onChangeView: () => {
  },
  fields: [],
  data: [],
  paginationInfo: {
    totalItems: 0,
    totalPages: 0
  },
  selection: [],
  onChangeSelection: () => {
  },
  setOpenedFilter: () => {
  },
  openedFilter: null,
  getItemId: (item) => item.id,
  isItemClickable: () => true,
  renderItemLink: void 0,
  containerWidth: 0,
  containerRef: (0, import_element2.createRef)(),
  resizeObserverRef: () => {
  },
  defaultLayouts: { list: {}, grid: {}, table: {} },
  filters: [],
  isShowingFilter: false,
  setIsShowingFilter: () => {
  },
  hasInfiniteScrollHandler: false,
  config: {
    perPageSizes: []
  }
});
DataViewsContext.displayName = "DataViewsContext";
var dataviews_context_default = DataViewsContext;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/index.js
var import_i18n16 = __toESM(require_i18n(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/index.js
var import_jsx_runtime37 = __toESM(require_jsx_runtime(), 1);
var import_i18n8 = __toESM(require_i18n(), 1);
var import_components7 = __toESM(require_components(), 1);
var import_element8 = __toESM(require_element(), 1);
var import_keycodes = __toESM(require_keycodes(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-selection-checkbox/index.js
var import_jsx_runtime31 = __toESM(require_jsx_runtime(), 1);
var import_components2 = __toESM(require_components(), 1);
var import_i18n2 = __toESM(require_i18n(), 1);
function DataViewsSelectionCheckbox({
  selection,
  onChangeSelection,
  item,
  getItemId: getItemId2,
  titleField,
  disabled,
  ...extraProps
}) {
  const id = getItemId2(item);
  const checked = !disabled && selection.includes(id);
  const selectionLabel = titleField?.getValue?.({ item }) || (0, import_i18n2.__)("(no title)");
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
    import_components2.CheckboxControl,
    {
      className: "dataviews-selection-checkbox",
      __nextHasNoMarginBottom: true,
      "aria-label": selectionLabel,
      "aria-disabled": disabled,
      checked,
      onChange: () => {
        if (disabled) {
          return;
        }
        onChangeSelection(
          selection.includes(id) ? selection.filter((itemId) => id !== itemId) : [...selection, id]
        );
      },
      ...extraProps
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-item-actions/index.js
var import_jsx_runtime32 = __toESM(require_jsx_runtime(), 1);
var import_components3 = __toESM(require_components(), 1);
var import_i18n3 = __toESM(require_i18n(), 1);
var import_element3 = __toESM(require_element(), 1);
var import_data = __toESM(require_data(), 1);
var import_compose = __toESM(require_compose(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/lock-unlock.js
var import_private_apis = __toESM(require_private_apis(), 1);
var { lock, unlock } = (0, import_private_apis.__dangerousOptInToUnstableAPIsOnlyForCoreModules)(
  "I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.",
  "@wordpress/dataviews"
);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-item-actions/index.js
var { Menu, kebabCase } = unlock(import_components3.privateApis);
function ButtonTrigger({
  action,
  onClick,
  items
}) {
  const label = typeof action.label === "string" ? action.label : action.label(items);
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    import_components3.Button,
    {
      disabled: !!action.disabled,
      accessibleWhenDisabled: true,
      size: "compact",
      onClick,
      children: label
    }
  );
}
function MenuItemTrigger({
  action,
  onClick,
  items
}) {
  const label = typeof action.label === "string" ? action.label : action.label(items);
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Menu.Item, { disabled: action.disabled, onClick, children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Menu.ItemLabel, { children: label }) });
}
function ActionModal({
  action,
  items,
  closeModal
}) {
  const label = typeof action.label === "string" ? action.label : action.label(items);
  const modalHeader = typeof action.modalHeader === "function" ? action.modalHeader(items) : action.modalHeader;
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    import_components3.Modal,
    {
      title: modalHeader || label,
      __experimentalHideHeader: !!action.hideModalHeader,
      onRequestClose: closeModal,
      focusOnMount: action.modalFocusOnMount ?? true,
      size: action.modalSize || "medium",
      overlayClassName: `dataviews-action-modal dataviews-action-modal__${kebabCase(
        action.id
      )}`,
      children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(action.RenderModal, { items, closeModal })
    }
  );
}
function ActionsMenuGroup({
  actions,
  item,
  registry,
  setActiveModalAction
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Menu.Group, { children: actions.map((action) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    MenuItemTrigger,
    {
      action,
      onClick: () => {
        if ("RenderModal" in action) {
          setActiveModalAction(action);
          return;
        }
        action.callback([item], { registry });
      },
      items: [item]
    },
    action.id
  )) });
}
function ItemActions({
  item,
  actions,
  isCompact
}) {
  const registry = (0, import_data.useRegistry)();
  const { primaryActions, eligibleActions } = (0, import_element3.useMemo)(() => {
    const _eligibleActions = actions.filter(
      (action) => !action.isEligible || action.isEligible(item)
    );
    const _primaryActions = _eligibleActions.filter(
      (action) => action.isPrimary
    );
    return {
      primaryActions: _primaryActions,
      eligibleActions: _eligibleActions
    };
  }, [actions, item]);
  if (isCompact) {
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      CompactItemActions,
      {
        item,
        actions: eligibleActions,
        isSmall: true,
        registry
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(
    import_components3.__experimentalHStack,
    {
      spacing: 0,
      justify: "flex-end",
      className: "dataviews-item-actions",
      style: {
        flexShrink: 0,
        width: "auto"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
          PrimaryActions,
          {
            item,
            actions: primaryActions,
            registry
          }
        ),
        primaryActions.length < eligibleActions.length && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
          CompactItemActions,
          {
            item,
            actions: eligibleActions,
            registry
          }
        )
      ]
    }
  );
}
function CompactItemActions({
  item,
  actions,
  isSmall,
  registry
}) {
  const [activeModalAction, setActiveModalAction] = (0, import_element3.useState)(
    null
  );
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(Menu, { placement: "bottom-end", children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        Menu.TriggerButton,
        {
          render: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
            import_components3.Button,
            {
              size: isSmall ? "small" : "compact",
              icon: more_vertical_default,
              label: (0, import_i18n3.__)("Actions"),
              accessibleWhenDisabled: true,
              disabled: !actions.length,
              className: "dataviews-all-actions-button"
            }
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(Menu.Popover, { children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        ActionsMenuGroup,
        {
          actions,
          item,
          registry,
          setActiveModalAction
        }
      ) })
    ] }),
    !!activeModalAction && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      ActionModal,
      {
        action: activeModalAction,
        items: [item],
        closeModal: () => setActiveModalAction(null)
      }
    )
  ] });
}
function PrimaryActions({
  item,
  actions,
  registry
}) {
  const [activeModalAction, setActiveModalAction] = (0, import_element3.useState)(null);
  const isMobileViewport = (0, import_compose.useViewportMatch)("medium", "<");
  if (isMobileViewport) {
    return null;
  }
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(import_jsx_runtime32.Fragment, { children: [
    actions.map((action) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      ButtonTrigger,
      {
        action,
        onClick: () => {
          if ("RenderModal" in action) {
            setActiveModalAction(action);
            return;
          }
          action.callback([item], { registry });
        },
        items: [item]
      },
      action.id
    )),
    !!activeModalAction && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      ActionModal,
      {
        action: activeModalAction,
        items: [item],
        closeModal: () => setActiveModalAction(null)
      }
    )
  ] });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-bulk-actions/index.js
var import_jsx_runtime33 = __toESM(require_jsx_runtime(), 1);
var import_components4 = __toESM(require_components(), 1);
var import_i18n4 = __toESM(require_i18n(), 1);
var import_element4 = __toESM(require_element(), 1);
var import_data2 = __toESM(require_data(), 1);
var import_compose2 = __toESM(require_compose(), 1);
function ActionWithModal({
  action,
  items,
  ActionTriggerComponent
}) {
  const [isModalOpen, setIsModalOpen] = (0, import_element4.useState)(false);
  const actionTriggerProps = {
    action,
    onClick: () => {
      setIsModalOpen(true);
    },
    items
  };
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(import_jsx_runtime33.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(ActionTriggerComponent, { ...actionTriggerProps }),
    isModalOpen && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      ActionModal,
      {
        action,
        items,
        closeModal: () => setIsModalOpen(false)
      }
    )
  ] });
}
function useHasAPossibleBulkAction(actions, item) {
  return (0, import_element4.useMemo)(() => {
    return actions.some((action) => {
      return action.supportsBulk && (!action.isEligible || action.isEligible(item));
    });
  }, [actions, item]);
}
function useSomeItemHasAPossibleBulkAction(actions, data) {
  return (0, import_element4.useMemo)(() => {
    return data.some((item) => {
      return actions.some((action) => {
        return action.supportsBulk && (!action.isEligible || action.isEligible(item));
      });
    });
  }, [actions, data]);
}
function BulkSelectionCheckbox({
  selection,
  onChangeSelection,
  data,
  actions,
  getItemId: getItemId2
}) {
  const selectableItems = (0, import_element4.useMemo)(() => {
    return data.filter((item) => {
      return actions.some(
        (action) => action.supportsBulk && (!action.isEligible || action.isEligible(item))
      );
    });
  }, [data, actions]);
  const selectedItems = data.filter(
    (item) => selection.includes(getItemId2(item)) && selectableItems.includes(item)
  );
  const areAllSelected = selectedItems.length === selectableItems.length;
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
    import_components4.CheckboxControl,
    {
      className: "dataviews-view-table-selection-checkbox",
      __nextHasNoMarginBottom: true,
      checked: areAllSelected,
      indeterminate: !areAllSelected && !!selectedItems.length,
      onChange: () => {
        if (areAllSelected) {
          onChangeSelection([]);
        } else {
          onChangeSelection(
            selectableItems.map((item) => getItemId2(item))
          );
        }
      },
      "aria-label": areAllSelected ? (0, import_i18n4.__)("Deselect all") : (0, import_i18n4.__)("Select all")
    }
  );
}
function ActionTrigger({
  action,
  onClick,
  isBusy,
  items
}) {
  const label = typeof action.label === "string" ? action.label : action.label(items);
  const isMobile = (0, import_compose2.useViewportMatch)("medium", "<");
  if (isMobile) {
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      import_components4.Button,
      {
        disabled: isBusy,
        accessibleWhenDisabled: true,
        label,
        icon: action.icon,
        size: "compact",
        onClick,
        isBusy
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
    import_components4.Button,
    {
      disabled: isBusy,
      accessibleWhenDisabled: true,
      size: "compact",
      onClick,
      isBusy,
      children: label
    }
  );
}
var EMPTY_ARRAY = [];
function ActionButton({
  action,
  selectedItems,
  actionInProgress,
  setActionInProgress
}) {
  const registry = (0, import_data2.useRegistry)();
  const selectedEligibleItems = (0, import_element4.useMemo)(() => {
    return selectedItems.filter((item) => {
      return !action.isEligible || action.isEligible(item);
    });
  }, [action, selectedItems]);
  if ("RenderModal" in action) {
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      ActionWithModal,
      {
        action,
        items: selectedEligibleItems,
        ActionTriggerComponent: ActionTrigger
      },
      action.id
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
    ActionTrigger,
    {
      action,
      onClick: async () => {
        setActionInProgress(action.id);
        await action.callback(selectedItems, {
          registry
        });
        setActionInProgress(null);
      },
      items: selectedEligibleItems,
      isBusy: actionInProgress === action.id
    },
    action.id
  );
}
function renderFooterContent(data, actions, getItemId2, selection, actionsToShow, selectedItems, actionInProgress, setActionInProgress, onChangeSelection) {
  const message2 = selectedItems.length > 0 ? (0, import_i18n4.sprintf)(
    /* translators: %d: number of items. */
    (0, import_i18n4._n)(
      "%d Item selected",
      "%d Items selected",
      selectedItems.length
    ),
    selectedItems.length
  ) : (0, import_i18n4.sprintf)(
    /* translators: %d: number of items. */
    (0, import_i18n4._n)("%d Item", "%d Items", data.length),
    data.length
  );
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(
    import_components4.__experimentalHStack,
    {
      expanded: false,
      className: "dataviews-bulk-actions-footer__container",
      spacing: 3,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
          BulkSelectionCheckbox,
          {
            selection,
            onChangeSelection,
            data,
            actions,
            getItemId: getItemId2
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("span", { className: "dataviews-bulk-actions-footer__item-count", children: message2 }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(
          import_components4.__experimentalHStack,
          {
            className: "dataviews-bulk-actions-footer__action-buttons",
            expanded: false,
            spacing: 1,
            children: [
              actionsToShow.map((action) => {
                return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
                  ActionButton,
                  {
                    action,
                    selectedItems,
                    actionInProgress,
                    setActionInProgress
                  },
                  action.id
                );
              }),
              selectedItems.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
                import_components4.Button,
                {
                  icon: close_small_default,
                  showTooltip: true,
                  tooltipPosition: "top",
                  size: "compact",
                  label: (0, import_i18n4.__)("Cancel"),
                  disabled: !!actionInProgress,
                  accessibleWhenDisabled: false,
                  onClick: () => {
                    onChangeSelection(EMPTY_ARRAY);
                  }
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function FooterContent({
  selection,
  actions,
  onChangeSelection,
  data,
  getItemId: getItemId2
}) {
  const [actionInProgress, setActionInProgress] = (0, import_element4.useState)(
    null
  );
  const footerContentRef = (0, import_element4.useRef)(null);
  const isMobile = (0, import_compose2.useViewportMatch)("medium", "<");
  const bulkActions = (0, import_element4.useMemo)(
    () => actions.filter((action) => action.supportsBulk),
    [actions]
  );
  const selectableItems = (0, import_element4.useMemo)(() => {
    return data.filter((item) => {
      return bulkActions.some(
        (action) => !action.isEligible || action.isEligible(item)
      );
    });
  }, [data, bulkActions]);
  const selectedItems = (0, import_element4.useMemo)(() => {
    return data.filter(
      (item) => selection.includes(getItemId2(item)) && selectableItems.includes(item)
    );
  }, [selection, data, getItemId2, selectableItems]);
  const actionsToShow = (0, import_element4.useMemo)(
    () => actions.filter((action) => {
      return action.supportsBulk && (!isMobile || action.icon) && selectedItems.some(
        (item) => !action.isEligible || action.isEligible(item)
      );
    }),
    [actions, selectedItems, isMobile]
  );
  if (!actionInProgress) {
    if (footerContentRef.current) {
      footerContentRef.current = null;
    }
    return renderFooterContent(
      data,
      actions,
      getItemId2,
      selection,
      actionsToShow,
      selectedItems,
      actionInProgress,
      setActionInProgress,
      onChangeSelection
    );
  } else if (!footerContentRef.current) {
    footerContentRef.current = renderFooterContent(
      data,
      actions,
      getItemId2,
      selection,
      actionsToShow,
      selectedItems,
      actionInProgress,
      setActionInProgress,
      onChangeSelection
    );
  }
  return footerContentRef.current;
}
function BulkActionsFooter() {
  const {
    data,
    selection,
    actions = EMPTY_ARRAY,
    onChangeSelection,
    getItemId: getItemId2
  } = (0, import_element4.useContext)(dataviews_context_default);
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
    FooterContent,
    {
      selection,
      onChangeSelection,
      data,
      actions,
      getItemId: getItemId2
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/column-header-menu.js
var import_jsx_runtime34 = __toESM(require_jsx_runtime(), 1);
var import_i18n5 = __toESM(require_i18n(), 1);
var import_components5 = __toESM(require_components(), 1);
var import_element5 = __toESM(require_element(), 1);
var { Menu: Menu2 } = unlock(import_components5.privateApis);
function WithMenuSeparators({ children }) {
  return import_element5.Children.toArray(children).filter(Boolean).map((child, i2) => /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_element5.Fragment, { children: [
    i2 > 0 && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.Separator, {}),
    child
  ] }, i2));
}
var _HeaderMenu = (0, import_element5.forwardRef)(function HeaderMenu({
  fieldId,
  view,
  fields,
  onChangeView,
  onHide,
  setOpenedFilter,
  canMove = true
}, ref) {
  const visibleFieldIds = view.fields ?? [];
  const index = visibleFieldIds?.indexOf(fieldId);
  const isSorted = view.sort?.field === fieldId;
  let isHidable = false;
  let isSortable = false;
  let canAddFilter = false;
  let operators = [];
  const field = fields.find((f2) => f2.id === fieldId);
  if (!field) {
    return null;
  }
  isHidable = field.enableHiding !== false;
  isSortable = field.enableSorting !== false;
  const header = field.header;
  operators = !!field.filterBy && field.filterBy?.operators || [];
  canAddFilter = !view.filters?.some((_filter) => fieldId === _filter.field) && !!(field.hasElements || field.Edit) && field.filterBy !== false && !field.filterBy?.isPrimary;
  if (!isSortable && !canMove && !isHidable && !canAddFilter) {
    return header;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(Menu2, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
      Menu2.TriggerButton,
      {
        render: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
          import_components5.Button,
          {
            size: "compact",
            className: "dataviews-view-table-header-button",
            ref,
            variant: "tertiary"
          }
        ),
        children: [
          header,
          view.sort && isSorted && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("span", { "aria-hidden": "true", children: sortArrows[view.sort.direction] })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.Popover, { style: { minWidth: "240px" }, children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(WithMenuSeparators, { children: [
      isSortable && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.Group, { children: SORTING_DIRECTIONS.map(
        (direction) => {
          const isChecked = view.sort && isSorted && view.sort.direction === direction;
          const value = `${fieldId}-${direction}`;
          return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
            Menu2.RadioItem,
            {
              name: "view-table-sorting",
              value,
              checked: isChecked,
              onChange: () => {
                onChangeView({
                  ...view,
                  sort: {
                    field: fieldId,
                    direction
                  },
                  showLevels: false
                });
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.ItemLabel, { children: sortLabels[direction] })
            },
            value
          );
        }
      ) }),
      canAddFilter && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.Group, { children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
        Menu2.Item,
        {
          prefix: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_components5.Icon, { icon: funnel_default }),
          onClick: () => {
            setOpenedFilter(fieldId);
            onChangeView({
              ...view,
              page: 1,
              filters: [
                ...view.filters || [],
                {
                  field: fieldId,
                  value: void 0,
                  operator: operators[0]
                }
              ]
            });
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.ItemLabel, { children: (0, import_i18n5.__)("Add filter") })
        }
      ) }),
      (canMove || isHidable) && field && /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(Menu2.Group, { children: [
        canMove && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
          Menu2.Item,
          {
            prefix: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_components5.Icon, { icon: arrow_left_default }),
            disabled: index < 1,
            onClick: () => {
              onChangeView({
                ...view,
                fields: [
                  ...visibleFieldIds.slice(
                    0,
                    index - 1
                  ) ?? [],
                  fieldId,
                  visibleFieldIds[index - 1],
                  ...visibleFieldIds.slice(
                    index + 1
                  )
                ]
              });
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.ItemLabel, { children: (0, import_i18n5.__)("Move left") })
          }
        ),
        canMove && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
          Menu2.Item,
          {
            prefix: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_components5.Icon, { icon: arrow_right_default }),
            disabled: index >= visibleFieldIds.length - 1,
            onClick: () => {
              onChangeView({
                ...view,
                fields: [
                  ...visibleFieldIds.slice(
                    0,
                    index
                  ) ?? [],
                  visibleFieldIds[index + 1],
                  fieldId,
                  ...visibleFieldIds.slice(
                    index + 2
                  )
                ]
              });
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.ItemLabel, { children: (0, import_i18n5.__)("Move right") })
          }
        ),
        isHidable && field && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
          Menu2.Item,
          {
            prefix: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_components5.Icon, { icon: unseen_default }),
            onClick: () => {
              onHide(field);
              onChangeView({
                ...view,
                fields: visibleFieldIds.filter(
                  (id) => id !== fieldId
                )
              });
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(Menu2.ItemLabel, { children: (0, import_i18n5.__)("Hide column") })
          }
        )
      ] })
    ] }) })
  ] });
});
var ColumnHeaderMenu = _HeaderMenu;
var column_header_menu_default = ColumnHeaderMenu;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/column-primary.js
var import_jsx_runtime36 = __toESM(require_jsx_runtime(), 1);
var import_components6 = __toESM(require_components(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/utils/item-click-wrapper.js
var import_jsx_runtime35 = __toESM(require_jsx_runtime(), 1);
var import_element6 = __toESM(require_element(), 1);
function getClickableItemProps({
  item,
  isItemClickable,
  onClickItem,
  className
}) {
  if (!isItemClickable(item) || !onClickItem) {
    return { className };
  }
  return {
    className: className ? `${className} ${className}--clickable` : void 0,
    role: "button",
    tabIndex: 0,
    onClick: (event) => {
      event.stopPropagation();
      onClickItem(item);
    },
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === "" || event.key === " ") {
        event.stopPropagation();
        onClickItem(item);
      }
    }
  };
}
function ItemClickWrapper({
  item,
  isItemClickable,
  onClickItem,
  renderItemLink,
  className,
  children,
  ...extraProps
}) {
  if (!isItemClickable(item)) {
    return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { className, ...extraProps, children });
  }
  if (renderItemLink) {
    const renderedElement = renderItemLink({
      item,
      className: `${className} ${className}--clickable`,
      ...extraProps,
      children
    });
    return (0, import_element6.cloneElement)(renderedElement, {
      onClick: (event) => {
        event.stopPropagation();
        if (renderedElement.props.onClick) {
          renderedElement.props.onClick(event);
        }
      },
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === "" || event.key === " ") {
          event.stopPropagation();
          if (renderedElement.props.onKeyDown) {
            renderedElement.props.onKeyDown(event);
          }
        }
      }
    });
  }
  const clickProps = getClickableItemProps({
    item,
    isItemClickable,
    onClickItem,
    className
  });
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { ...clickProps, ...extraProps, children });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/column-primary.js
var import_i18n6 = __toESM(require_i18n(), 1);
function ColumnPrimary({
  item,
  level,
  titleField,
  mediaField,
  descriptionField,
  onClickItem,
  renderItemLink,
  isItemClickable
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_components6.__experimentalHStack, { spacing: 3, justify: "flex-start", children: [
    mediaField && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
      ItemClickWrapper,
      {
        item,
        isItemClickable,
        onClickItem,
        renderItemLink,
        className: "dataviews-view-table__cell-content-wrapper dataviews-column-primary__media",
        "aria-label": titleField ? (0, import_i18n6.sprintf)(
          // translators: %s is the item title.
          (0, import_i18n6.__)("Click item: %s"),
          titleField.getValue?.({ item })
        ) : void 0,
        children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
          mediaField.render,
          {
            item,
            field: mediaField,
            config: { sizes: "32px" }
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
      import_components6.__experimentalVStack,
      {
        spacing: 0,
        alignment: "flex-start",
        className: "dataviews-view-table__primary-column-content",
        children: [
          titleField && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
            ItemClickWrapper,
            {
              item,
              isItemClickable,
              onClickItem,
              renderItemLink,
              className: "dataviews-view-table__cell-content-wrapper dataviews-title-field",
              children: [
                level !== void 0 && level > 0 && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("span", { className: "dataviews-view-table__level", children: [
                  "\u2014".repeat(level),
                  "\xA0"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(titleField.render, { item, field: titleField })
              ]
            }
          ),
          descriptionField && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
            descriptionField.render,
            {
              item,
              field: descriptionField
            }
          )
        ]
      }
    )
  ] });
}
var column_primary_default = ColumnPrimary;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/use-is-horizontal-scroll-end.js
var import_compose3 = __toESM(require_compose(), 1);
var import_element7 = __toESM(require_element(), 1);
var import_i18n7 = __toESM(require_i18n(), 1);
var isScrolledToEnd = (element) => {
  if ((0, import_i18n7.isRTL)()) {
    const scrollLeft = Math.abs(element.scrollLeft);
    return scrollLeft <= 1;
  }
  return element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
};
function useIsHorizontalScrollEnd({
  scrollContainerRef,
  enabled = false
}) {
  const [isHorizontalScrollEnd, setIsHorizontalScrollEnd] = (0, import_element7.useState)(false);
  const handleIsHorizontalScrollEnd = (0, import_compose3.useDebounce)(
    (0, import_element7.useCallback)(() => {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        setIsHorizontalScrollEnd(isScrolledToEnd(scrollContainer));
      }
    }, [scrollContainerRef, setIsHorizontalScrollEnd]),
    200
  );
  (0, import_element7.useEffect)(() => {
    if (typeof window === "undefined" || !enabled || !scrollContainerRef.current) {
      return () => {
      };
    }
    handleIsHorizontalScrollEnd();
    scrollContainerRef.current.addEventListener(
      "scroll",
      handleIsHorizontalScrollEnd
    );
    window.addEventListener("resize", handleIsHorizontalScrollEnd);
    return () => {
      scrollContainerRef.current?.removeEventListener(
        "scroll",
        handleIsHorizontalScrollEnd
      );
      window.removeEventListener("resize", handleIsHorizontalScrollEnd);
    };
  }, [scrollContainerRef, enabled]);
  return isHorizontalScrollEnd;
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/utils/get-data-by-group.js
function getDataByGroup(data, groupByField) {
  return data.reduce((groups, item) => {
    const groupName = groupByField.getValue({ item });
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)?.push(item);
    return groups;
  }, /* @__PURE__ */ new Map());
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/index.js
function TableColumnField({
  item,
  fields,
  column,
  align
}) {
  const field = fields.find((f2) => f2.id === column);
  if (!field) {
    return null;
  }
  const className = clsx_default("dataviews-view-table__cell-content-wrapper", {
    "dataviews-view-table__cell-align-end": align === "end",
    "dataviews-view-table__cell-align-center": align === "center"
  });
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("div", { className, children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(field.render, { item, field }) });
}
function TableRow({
  hasBulkActions,
  item,
  level,
  actions,
  fields,
  id,
  view,
  titleField,
  mediaField,
  descriptionField,
  selection,
  getItemId: getItemId2,
  isItemClickable,
  onClickItem,
  renderItemLink,
  onChangeSelection,
  isActionsColumnSticky,
  posinset
}) {
  const { paginationInfo } = (0, import_element8.useContext)(dataviews_context_default);
  const hasPossibleBulkAction = useHasAPossibleBulkAction(actions, item);
  const isSelected2 = hasPossibleBulkAction && selection.includes(id);
  const [isHovered, setIsHovered] = (0, import_element8.useState)(false);
  const {
    showTitle = true,
    showMedia = true,
    showDescription = true,
    infiniteScrollEnabled
  } = view;
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  const isTouchDeviceRef = (0, import_element8.useRef)(false);
  const columns = view.fields ?? [];
  const hasPrimaryColumn = titleField && showTitle || mediaField && showMedia || descriptionField && showDescription;
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
    "tr",
    {
      className: clsx_default("dataviews-view-table__row", {
        "is-selected": hasPossibleBulkAction && isSelected2,
        "is-hovered": isHovered,
        "has-bulk-actions": hasPossibleBulkAction
      }),
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onTouchStart: () => {
        isTouchDeviceRef.current = true;
      },
      "aria-setsize": infiniteScrollEnabled ? paginationInfo.totalItems : void 0,
      "aria-posinset": posinset,
      role: infiniteScrollEnabled ? "article" : void 0,
      onClick: (event) => {
        if (!hasPossibleBulkAction) {
          return;
        }
        if (!isTouchDeviceRef.current && document.getSelection()?.type !== "Range") {
          if ((0, import_keycodes.isAppleOS)() ? event.metaKey : event.ctrlKey) {
            onChangeSelection(
              selection.includes(id) ? selection.filter(
                (itemId) => id !== itemId
              ) : [...selection, id]
            );
          } else {
            onChangeSelection(
              selection.includes(id) ? selection.filter(
                (itemId) => id !== itemId
              ) : [id]
            );
          }
        }
      },
      children: [
        hasBulkActions && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("td", { className: "dataviews-view-table__checkbox-column", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("div", { className: "dataviews-view-table__cell-content-wrapper", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
          DataViewsSelectionCheckbox,
          {
            item,
            selection,
            onChangeSelection,
            getItemId: getItemId2,
            titleField,
            disabled: !hasPossibleBulkAction
          }
        ) }) }),
        hasPrimaryColumn && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
          column_primary_default,
          {
            item,
            level,
            titleField: showTitle ? titleField : void 0,
            mediaField: showMedia ? mediaField : void 0,
            descriptionField: showDescription ? descriptionField : void 0,
            isItemClickable,
            onClickItem,
            renderItemLink
          }
        ) }),
        columns.map((column) => {
          const { width, maxWidth, minWidth, align } = view.layout?.styles?.[column] ?? {};
          return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
            "td",
            {
              style: {
                width,
                maxWidth,
                minWidth
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                TableColumnField,
                {
                  fields,
                  item,
                  column,
                  align
                }
              )
            },
            column
          );
        }),
        !!actions?.length && // Disable reason: we are not making the element interactive,
        // but preventing any click events from bubbling up to the
        // table row. This allows us to add a click handler to the row
        // itself (to toggle row selection) without erroneously
        // intercepting click events from ItemActions.
        /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
          "td",
          {
            className: clsx_default("dataviews-view-table__actions-column", {
              "dataviews-view-table__actions-column--sticky": true,
              "dataviews-view-table__actions-column--stuck": isActionsColumnSticky
            }),
            onClick: (e2) => e2.stopPropagation(),
            children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(ItemActions, { item, actions })
          }
        )
      ]
    }
  );
}
function ViewTable({
  actions,
  data,
  fields,
  getItemId: getItemId2,
  getItemLevel,
  isLoading = false,
  onChangeView,
  onChangeSelection,
  selection,
  setOpenedFilter,
  onClickItem,
  isItemClickable,
  renderItemLink,
  view,
  className,
  empty
}) {
  const { containerRef } = (0, import_element8.useContext)(dataviews_context_default);
  const headerMenuRefs = (0, import_element8.useRef)(/* @__PURE__ */ new Map());
  const headerMenuToFocusRef = (0, import_element8.useRef)();
  const [nextHeaderMenuToFocus, setNextHeaderMenuToFocus] = (0, import_element8.useState)();
  const hasBulkActions = useSomeItemHasAPossibleBulkAction(actions, data);
  (0, import_element8.useEffect)(() => {
    if (headerMenuToFocusRef.current) {
      headerMenuToFocusRef.current.focus();
      headerMenuToFocusRef.current = void 0;
    }
  });
  const tableNoticeId = (0, import_element8.useId)();
  const isHorizontalScrollEnd = useIsHorizontalScrollEnd({
    scrollContainerRef: containerRef,
    enabled: !!actions?.length
  });
  if (nextHeaderMenuToFocus) {
    headerMenuToFocusRef.current = nextHeaderMenuToFocus;
    setNextHeaderMenuToFocus(void 0);
    return;
  }
  const onHide = (field) => {
    const hidden = headerMenuRefs.current.get(field.id);
    const fallback = hidden ? headerMenuRefs.current.get(hidden.fallback) : void 0;
    setNextHeaderMenuToFocus(fallback?.node);
  };
  const hasData = !!data?.length;
  const titleField = fields.find((field) => field.id === view.titleField);
  const mediaField = fields.find((field) => field.id === view.mediaField);
  const descriptionField = fields.find(
    (field) => field.id === view.descriptionField
  );
  const groupField = view.groupByField ? fields.find((f2) => f2.id === view.groupByField) : null;
  const dataByGroup = groupField ? getDataByGroup(data, groupField) : null;
  const { showTitle = true, showMedia = true, showDescription = true } = view;
  const hasPrimaryColumn = titleField && showTitle || mediaField && showMedia || descriptionField && showDescription;
  const columns = view.fields ?? [];
  const headerMenuRef = (column, index) => (node) => {
    if (node) {
      headerMenuRefs.current.set(column, {
        node,
        fallback: columns[index > 0 ? index - 1 : 1]
      });
    } else {
      headerMenuRefs.current.delete(column);
    }
  };
  const isInfiniteScroll = view.infiniteScrollEnabled && !dataByGroup;
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(import_jsx_runtime37.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
      "table",
      {
        className: clsx_default("dataviews-view-table", className, {
          [`has-${view.layout?.density}-density`]: view.layout?.density && ["compact", "comfortable"].includes(
            view.layout.density
          )
        }),
        "aria-busy": isLoading,
        "aria-describedby": tableNoticeId,
        role: isInfiniteScroll ? "feed" : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("tr", { className: "dataviews-view-table__row", children: [
            hasBulkActions && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
              "th",
              {
                className: "dataviews-view-table__checkbox-column",
                scope: "col",
                children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                  BulkSelectionCheckbox,
                  {
                    selection,
                    onChangeSelection,
                    data,
                    actions,
                    getItemId: getItemId2
                  }
                )
              }
            ),
            hasPrimaryColumn && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("th", { scope: "col", children: titleField && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
              column_header_menu_default,
              {
                ref: headerMenuRef(
                  titleField.id,
                  0
                ),
                fieldId: titleField.id,
                view,
                fields,
                onChangeView,
                onHide,
                setOpenedFilter,
                canMove: false
              }
            ) }),
            columns.map((column, index) => {
              const { width, maxWidth, minWidth, align } = view.layout?.styles?.[column] ?? {};
              return /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                "th",
                {
                  style: {
                    width,
                    maxWidth,
                    minWidth,
                    textAlign: align
                  },
                  "aria-sort": view.sort?.direction && view.sort?.field === column ? sortValues[view.sort.direction] : void 0,
                  scope: "col",
                  children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                    column_header_menu_default,
                    {
                      ref: headerMenuRef(column, index),
                      fieldId: column,
                      view,
                      fields,
                      onChangeView,
                      onHide,
                      setOpenedFilter,
                      canMove: view.layout?.enableMoving ?? true
                    }
                  )
                },
                column
              );
            }),
            !!actions?.length && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
              "th",
              {
                className: clsx_default(
                  "dataviews-view-table__actions-column",
                  {
                    "dataviews-view-table__actions-column--sticky": true,
                    "dataviews-view-table__actions-column--stuck": !isHorizontalScrollEnd
                  }
                ),
                children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { className: "dataviews-view-table-header", children: (0, import_i18n8.__)("Actions") })
              }
            )
          ] }) }),
          hasData && groupField && dataByGroup ? Array.from(dataByGroup.entries()).map(
            ([groupName, groupItems]) => /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("tbody", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("tr", { className: "dataviews-view-table__group-header-row", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                "td",
                {
                  colSpan: columns.length + (hasPrimaryColumn ? 1 : 0) + (hasBulkActions ? 1 : 0) + (actions?.length ? 1 : 0),
                  className: "dataviews-view-table__group-header-cell",
                  children: (0, import_i18n8.sprintf)(
                    // translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
                    (0, import_i18n8.__)("%1$s: %2$s"),
                    groupField.label,
                    groupName
                  )
                }
              ) }),
              groupItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
                TableRow,
                {
                  item,
                  level: view.showLevels && typeof getItemLevel === "function" ? getItemLevel(item) : void 0,
                  hasBulkActions,
                  actions,
                  fields,
                  id: getItemId2(item) || index.toString(),
                  view,
                  titleField,
                  mediaField,
                  descriptionField,
                  selection,
                  getItemId: getItemId2,
                  onChangeSelection,
                  onClickItem,
                  renderItemLink,
                  isItemClickable,
                  isActionsColumnSticky: !isHorizontalScrollEnd
                },
                getItemId2(item)
              ))
            ] }, `group-${groupName}`)
          ) : /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("tbody", { children: hasData && data.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
            TableRow,
            {
              item,
              level: view.showLevels && typeof getItemLevel === "function" ? getItemLevel(item) : void 0,
              hasBulkActions,
              actions,
              fields,
              id: getItemId2(item) || index.toString(),
              view,
              titleField,
              mediaField,
              descriptionField,
              selection,
              getItemId: getItemId2,
              onChangeSelection,
              onClickItem,
              renderItemLink,
              isItemClickable,
              isActionsColumnSticky: !isHorizontalScrollEnd,
              posinset: isInfiniteScroll ? index + 1 : void 0
            },
            getItemId2(item)
          )) })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
      "div",
      {
        className: clsx_default({
          "dataviews-loading": isLoading,
          "dataviews-no-results": !hasData && !isLoading
        }),
        id: tableNoticeId,
        children: [
          !hasData && (isLoading ? /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_components7.Spinner, {}) }) : empty),
          hasData && isLoading && /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "dataviews-loading-more", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_components7.Spinner, {}) })
        ]
      }
    )
  ] });
}
var table_default = ViewTable;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/grid/index.js
var import_jsx_runtime39 = __toESM(require_jsx_runtime(), 1);
var import_components8 = __toESM(require_components(), 1);
var import_i18n9 = __toESM(require_i18n(), 1);
var import_compose4 = __toESM(require_compose(), 1);
var import_keycodes2 = __toESM(require_keycodes(), 1);
var import_element10 = __toESM(require_element(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/utils/grid-items.js
var import_jsx_runtime38 = __toESM(require_jsx_runtime(), 1);
var import_element9 = __toESM(require_element(), 1);
var GridItems = (0, import_element9.forwardRef)(({ className, previewSize, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
    "div",
    {
      ref,
      className: clsx_default("dataviews-view-grid-items", className),
      style: {
        gridTemplateColumns: previewSize && `repeat(auto-fill, minmax(${previewSize}px, 1fr))`
      },
      ...props
    }
  );
});

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/grid/index.js
var { Badge } = unlock(import_components8.privateApis);
function GridItem({
  view,
  selection,
  onChangeSelection,
  onClickItem,
  isItemClickable,
  renderItemLink,
  getItemId: getItemId2,
  item,
  actions,
  mediaField,
  titleField,
  descriptionField,
  regularFields,
  badgeFields,
  hasBulkActions,
  config,
  posinset
}) {
  const {
    showTitle = true,
    showMedia = true,
    showDescription = true,
    infiniteScrollEnabled
  } = view;
  const hasBulkAction = useHasAPossibleBulkAction(actions, item);
  const id = getItemId2(item);
  const instanceId = (0, import_compose4.useInstanceId)(GridItem);
  const isSelected2 = selection.includes(id);
  const renderedMediaField = mediaField?.render ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
    mediaField.render,
    {
      item,
      field: mediaField,
      config
    }
  ) : null;
  const renderedTitleField = showTitle && titleField?.render ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(titleField.render, { item, field: titleField }) : null;
  const shouldRenderMedia = showMedia && renderedMediaField;
  let mediaA11yProps;
  let titleA11yProps;
  if (isItemClickable(item) && onClickItem) {
    if (renderedTitleField) {
      mediaA11yProps = {
        "aria-labelledby": `dataviews-view-grid__title-field-${instanceId}`
      };
      titleA11yProps = {
        id: `dataviews-view-grid__title-field-${instanceId}`
      };
    } else {
      mediaA11yProps = {
        "aria-label": (0, import_i18n9.__)("Navigate to item")
      };
    }
  }
  const { paginationInfo } = (0, import_element10.useContext)(dataviews_context_default);
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
    import_components8.__experimentalVStack,
    {
      spacing: 0,
      className: clsx_default("dataviews-view-grid__card", {
        "is-selected": hasBulkAction && isSelected2
      }),
      onClickCapture: (event) => {
        if ((0, import_keycodes2.isAppleOS)() ? event.metaKey : event.ctrlKey) {
          event.stopPropagation();
          event.preventDefault();
          if (!hasBulkAction) {
            return;
          }
          onChangeSelection(
            selection.includes(id) ? selection.filter((itemId) => id !== itemId) : [...selection, id]
          );
        }
      },
      role: infiniteScrollEnabled ? "article" : void 0,
      "aria-setsize": infiniteScrollEnabled ? paginationInfo.totalItems : void 0,
      "aria-posinset": posinset,
      children: [
        shouldRenderMedia && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
          ItemClickWrapper,
          {
            item,
            isItemClickable,
            onClickItem,
            renderItemLink,
            className: "dataviews-view-grid__media",
            ...mediaA11yProps,
            children: renderedMediaField
          }
        ),
        hasBulkActions && shouldRenderMedia && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
          DataViewsSelectionCheckbox,
          {
            item,
            selection,
            onChangeSelection,
            getItemId: getItemId2,
            titleField,
            disabled: !hasBulkAction
          }
        ),
        !showTitle && shouldRenderMedia && !!actions?.length && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "dataviews-view-grid__media-actions", children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(ItemActions, { item, actions, isCompact: true }) }),
        showTitle && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
          import_components8.__experimentalHStack,
          {
            justify: "space-between",
            className: "dataviews-view-grid__title-actions",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                ItemClickWrapper,
                {
                  item,
                  isItemClickable,
                  onClickItem,
                  renderItemLink,
                  className: "dataviews-view-grid__title-field dataviews-title-field",
                  ...titleA11yProps,
                  children: renderedTitleField
                }
              ),
              !!actions?.length && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                ItemActions,
                {
                  item,
                  actions,
                  isCompact: true
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(import_components8.__experimentalVStack, { spacing: 1, children: [
          showDescription && descriptionField?.render && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
            descriptionField.render,
            {
              item,
              field: descriptionField
            }
          ),
          !!badgeFields?.length && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
            import_components8.__experimentalHStack,
            {
              className: "dataviews-view-grid__badge-fields",
              spacing: 2,
              wrap: true,
              alignment: "top",
              justify: "flex-start",
              children: badgeFields.map((field) => {
                return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                  Badge,
                  {
                    className: "dataviews-view-grid__field-value",
                    children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                      field.render,
                      {
                        item,
                        field
                      }
                    )
                  },
                  field.id
                );
              })
            }
          ),
          !!regularFields?.length && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
            import_components8.__experimentalVStack,
            {
              className: "dataviews-view-grid__fields",
              spacing: 1,
              children: regularFields.map((field) => {
                return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                  import_components8.Flex,
                  {
                    className: "dataviews-view-grid__field",
                    gap: 1,
                    justify: "flex-start",
                    expanded: true,
                    style: { height: "auto" },
                    direction: "row",
                    children: /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(import_jsx_runtime39.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_components8.Tooltip, { text: field.label, children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_components8.FlexItem, { className: "dataviews-view-grid__field-name", children: field.header }) }),
                      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                        import_components8.FlexItem,
                        {
                          className: "dataviews-view-grid__field-value",
                          style: { maxHeight: "none" },
                          children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                            field.render,
                            {
                              item,
                              field
                            }
                          )
                        }
                      )
                    ] })
                  },
                  field.id
                );
              })
            }
          )
        ] })
      ]
    },
    id
  );
}
function ViewGrid({
  actions,
  data,
  fields,
  getItemId: getItemId2,
  isLoading,
  onChangeSelection,
  onClickItem,
  isItemClickable,
  renderItemLink,
  selection,
  view,
  className,
  empty
}) {
  const { resizeObserverRef } = (0, import_element10.useContext)(dataviews_context_default);
  const titleField = fields.find(
    (field) => field.id === view?.titleField
  );
  const mediaField = fields.find(
    (field) => field.id === view?.mediaField
  );
  const descriptionField = fields.find(
    (field) => field.id === view?.descriptionField
  );
  const otherFields = view.fields ?? [];
  const { regularFields, badgeFields } = otherFields.reduce(
    (accumulator, fieldId) => {
      const field = fields.find((f2) => f2.id === fieldId);
      if (!field) {
        return accumulator;
      }
      const key = view.layout?.badgeFields?.includes(fieldId) ? "badgeFields" : "regularFields";
      accumulator[key].push(field);
      return accumulator;
    },
    { regularFields: [], badgeFields: [] }
  );
  const hasData = !!data?.length;
  const hasBulkActions = useSomeItemHasAPossibleBulkAction(actions, data);
  const usedPreviewSize = view.layout?.previewSize;
  const size = "900px";
  const groupField = view.groupByField ? fields.find((f2) => f2.id === view.groupByField) : null;
  const dataByGroup = groupField ? getDataByGroup(data, groupField) : null;
  const isInfiniteScroll = view.infiniteScrollEnabled && !dataByGroup;
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(import_jsx_runtime39.Fragment, {
    // Render multiple groups.
    children: [
      hasData && groupField && dataByGroup && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_components8.__experimentalVStack, { spacing: 4, children: Array.from(dataByGroup.entries()).map(
        ([groupName, groupItems]) => /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(import_components8.__experimentalVStack, { spacing: 2, children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { className: "dataviews-view-grid__group-header", children: (0, import_i18n9.sprintf)(
            // translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
            (0, import_i18n9.__)("%1$s: %2$s"),
            groupField.label,
            groupName
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
            GridItems,
            {
              className: clsx_default(
                "dataviews-view-grid",
                className
              ),
              previewSize: usedPreviewSize,
              "aria-busy": isLoading,
              ref: resizeObserverRef,
              children: groupItems.map((item) => {
                return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
                  GridItem,
                  {
                    view,
                    selection,
                    onChangeSelection,
                    onClickItem,
                    isItemClickable,
                    renderItemLink,
                    getItemId: getItemId2,
                    item,
                    actions,
                    mediaField,
                    titleField,
                    descriptionField,
                    regularFields,
                    badgeFields,
                    hasBulkActions,
                    config: {
                      sizes: size
                    }
                  },
                  getItemId2(item)
                );
              })
            }
          )
        ] }, groupName)
      ) }),
      // Render a single grid with all data.
      hasData && !dataByGroup && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
        GridItems,
        {
          className: clsx_default("dataviews-view-grid", className),
          previewSize: usedPreviewSize,
          "aria-busy": isLoading,
          ref: resizeObserverRef,
          role: isInfiniteScroll ? "feed" : void 0,
          children: data.map((item, index) => {
            return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
              GridItem,
              {
                view,
                selection,
                onChangeSelection,
                onClickItem,
                isItemClickable,
                renderItemLink,
                getItemId: getItemId2,
                item,
                actions,
                mediaField,
                titleField,
                descriptionField,
                regularFields,
                badgeFields,
                hasBulkActions,
                config: {
                  sizes: size
                },
                posinset: isInfiniteScroll ? index + 1 : void 0
              },
              getItemId2(item)
            );
          })
        }
      ),
      // Render empty state.
      !hasData && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
        "div",
        {
          className: clsx_default({
            "dataviews-loading": isLoading,
            "dataviews-no-results": !isLoading
          }),
          children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_components8.Spinner, {}) }) : empty
        }
      ),
      hasData && isLoading && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { className: "dataviews-loading-more", children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_components8.Spinner, {}) })
    ]
  });
}
var grid_default = ViewGrid;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/list/index.js
var import_jsx_runtime40 = __toESM(require_jsx_runtime(), 1);
var import_compose5 = __toESM(require_compose(), 1);
var import_components9 = __toESM(require_components(), 1);
var import_element11 = __toESM(require_element(), 1);
var import_i18n10 = __toESM(require_i18n(), 1);
var import_data3 = __toESM(require_data(), 1);
var { Menu: Menu3 } = unlock(import_components9.privateApis);
function generateItemWrapperCompositeId(idPrefix) {
  return `${idPrefix}-item-wrapper`;
}
function generatePrimaryActionCompositeId(idPrefix, primaryActionId) {
  return `${idPrefix}-primary-action-${primaryActionId}`;
}
function generateDropdownTriggerCompositeId(idPrefix) {
  return `${idPrefix}-dropdown`;
}
function PrimaryActionGridCell({
  idPrefix,
  primaryAction,
  item
}) {
  const registry = (0, import_data3.useRegistry)();
  const [isModalOpen, setIsModalOpen] = (0, import_element11.useState)(false);
  const compositeItemId = generatePrimaryActionCompositeId(
    idPrefix,
    primaryAction.id
  );
  const label = typeof primaryAction.label === "string" ? primaryAction.label : primaryAction.label([item]);
  return "RenderModal" in primaryAction ? /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { role: "gridcell", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
    import_components9.Composite.Item,
    {
      id: compositeItemId,
      render: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        import_components9.Button,
        {
          disabled: !!primaryAction.disabled,
          accessibleWhenDisabled: true,
          size: "small",
          onClick: () => setIsModalOpen(true),
          variant: "link",
          children: label
        }
      ),
      children: isModalOpen && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        ActionModal,
        {
          action: primaryAction,
          items: [item],
          closeModal: () => setIsModalOpen(false)
        }
      )
    }
  ) }, primaryAction.id) : /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { role: "gridcell", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
    import_components9.Composite.Item,
    {
      id: compositeItemId,
      render: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        import_components9.Button,
        {
          disabled: !!primaryAction.disabled,
          accessibleWhenDisabled: true,
          size: "small",
          onClick: () => {
            primaryAction.callback([item], { registry });
          },
          variant: "link",
          children: label
        }
      )
    }
  ) }, primaryAction.id);
}
function ListItem({
  view,
  actions,
  idPrefix,
  isSelected: isSelected2,
  item,
  titleField,
  mediaField,
  descriptionField,
  onSelect,
  otherFields,
  onDropdownTriggerKeyDown,
  posinset
}) {
  const {
    showTitle = true,
    showMedia = true,
    showDescription = true,
    infiniteScrollEnabled
  } = view;
  const itemRef = (0, import_element11.useRef)(null);
  const labelId = `${idPrefix}-label`;
  const descriptionId = `${idPrefix}-description`;
  const registry = (0, import_data3.useRegistry)();
  const [isHovered, setIsHovered] = (0, import_element11.useState)(false);
  const [activeModalAction, setActiveModalAction] = (0, import_element11.useState)(
    null
  );
  const handleHover = ({ type }) => {
    const isHover = type === "mouseenter";
    setIsHovered(isHover);
  };
  const { paginationInfo } = (0, import_element11.useContext)(dataviews_context_default);
  (0, import_element11.useEffect)(() => {
    if (isSelected2) {
      itemRef.current?.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [isSelected2]);
  const { primaryAction, eligibleActions } = (0, import_element11.useMemo)(() => {
    const _eligibleActions = actions.filter(
      (action) => !action.isEligible || action.isEligible(item)
    );
    const _primaryActions = _eligibleActions.filter(
      (action) => action.isPrimary
    );
    return {
      primaryAction: _primaryActions[0],
      eligibleActions: _eligibleActions
    };
  }, [actions, item]);
  const hasOnlyOnePrimaryAction = primaryAction && actions.length === 1;
  const renderedMediaField = showMedia && mediaField?.render ? /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { className: "dataviews-view-list__media-wrapper", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
    mediaField.render,
    {
      item,
      field: mediaField,
      config: { sizes: "52px" }
    }
  ) }) : null;
  const renderedTitleField = showTitle && titleField?.render ? /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(titleField.render, { item, field: titleField }) : null;
  const usedActions = eligibleActions?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_components9.__experimentalHStack, { spacing: 3, className: "dataviews-view-list__item-actions", children: [
    primaryAction && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
      PrimaryActionGridCell,
      {
        idPrefix,
        primaryAction,
        item
      }
    ),
    !hasOnlyOnePrimaryAction && /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)("div", { role: "gridcell", children: [
      /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(Menu3, { placement: "bottom-end", children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
          Menu3.TriggerButton,
          {
            render: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
              import_components9.Composite.Item,
              {
                id: generateDropdownTriggerCompositeId(
                  idPrefix
                ),
                render: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                  import_components9.Button,
                  {
                    size: "small",
                    icon: more_vertical_default,
                    label: (0, import_i18n10.__)("Actions"),
                    accessibleWhenDisabled: true,
                    disabled: !actions.length,
                    onKeyDown: onDropdownTriggerKeyDown
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(Menu3.Popover, { children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
          ActionsMenuGroup,
          {
            actions: eligibleActions,
            item,
            registry,
            setActiveModalAction
          }
        ) })
      ] }),
      !!activeModalAction && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        ActionModal,
        {
          action: activeModalAction,
          items: [item],
          closeModal: () => setActiveModalAction(null)
        }
      )
    ] })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
    import_components9.Composite.Row,
    {
      ref: itemRef,
      render: (
        /* aria-posinset breaks Composite.Row if passed to it directly. */
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
          "div",
          {
            "aria-posinset": posinset,
            "aria-setsize": infiniteScrollEnabled ? paginationInfo.totalItems : void 0
          }
        )
      ),
      role: infiniteScrollEnabled ? "article" : "row",
      className: clsx_default({
        "is-selected": isSelected2,
        "is-hovered": isHovered
      }),
      onMouseEnter: handleHover,
      onMouseLeave: handleHover,
      children: /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_components9.__experimentalHStack, { className: "dataviews-view-list__item-wrapper", spacing: 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { role: "gridcell", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
          import_components9.Composite.Item,
          {
            id: generateItemWrapperCompositeId(idPrefix),
            "aria-pressed": isSelected2,
            "aria-labelledby": labelId,
            "aria-describedby": descriptionId,
            className: "dataviews-view-list__item",
            onClick: () => onSelect(item)
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_components9.__experimentalHStack, { spacing: 3, justify: "start", alignment: "flex-start", children: [
          renderedMediaField,
          /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(
            import_components9.__experimentalVStack,
            {
              spacing: 1,
              className: "dataviews-view-list__field-wrapper",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_components9.__experimentalHStack, { spacing: 0, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                    "div",
                    {
                      className: "dataviews-title-field",
                      id: labelId,
                      children: renderedTitleField
                    }
                  ),
                  usedActions
                ] }),
                showDescription && descriptionField?.render && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { className: "dataviews-view-list__field", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                  descriptionField.render,
                  {
                    item,
                    field: descriptionField
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                  "div",
                  {
                    className: "dataviews-view-list__fields",
                    id: descriptionId,
                    children: otherFields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(
                      "div",
                      {
                        className: "dataviews-view-list__field",
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                            import_components9.VisuallyHidden,
                            {
                              as: "span",
                              className: "dataviews-view-list__field-label",
                              children: field.label
                            }
                          ),
                          /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("span", { className: "dataviews-view-list__field-value", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                            field.render,
                            {
                              item,
                              field
                            }
                          ) })
                        ]
                      },
                      field.id
                    ))
                  }
                )
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function isDefined(item) {
  return !!item;
}
function ViewList(props) {
  const {
    actions,
    data,
    fields,
    getItemId: getItemId2,
    isLoading,
    onChangeSelection,
    selection,
    view,
    className,
    empty
  } = props;
  const baseId = (0, import_compose5.useInstanceId)(ViewList, "view-list");
  const selectedItem = data?.findLast(
    (item) => selection.includes(getItemId2(item))
  );
  const titleField = fields.find((field) => field.id === view.titleField);
  const mediaField = fields.find((field) => field.id === view.mediaField);
  const descriptionField = fields.find(
    (field) => field.id === view.descriptionField
  );
  const otherFields = (view?.fields ?? []).map((fieldId) => fields.find((f2) => fieldId === f2.id)).filter(isDefined);
  const onSelect = (item) => onChangeSelection([getItemId2(item)]);
  const generateCompositeItemIdPrefix = (0, import_element11.useCallback)(
    (item) => `${baseId}-${getItemId2(item)}`,
    [baseId, getItemId2]
  );
  const isActiveCompositeItem = (0, import_element11.useCallback)(
    (item, idToCheck) => {
      return idToCheck.startsWith(
        generateCompositeItemIdPrefix(item)
      );
    },
    [generateCompositeItemIdPrefix]
  );
  const [activeCompositeId, setActiveCompositeId] = (0, import_element11.useState)(void 0);
  (0, import_element11.useEffect)(() => {
    if (selectedItem) {
      setActiveCompositeId(
        generateItemWrapperCompositeId(
          generateCompositeItemIdPrefix(selectedItem)
        )
      );
    }
  }, [selectedItem, generateCompositeItemIdPrefix]);
  const activeItemIndex = data.findIndex(
    (item) => isActiveCompositeItem(item, activeCompositeId ?? "")
  );
  const previousActiveItemIndex = (0, import_compose5.usePrevious)(activeItemIndex);
  const isActiveIdInList = activeItemIndex !== -1;
  const selectCompositeItem = (0, import_element11.useCallback)(
    (targetIndex, generateCompositeId) => {
      const clampedIndex = Math.min(
        data.length - 1,
        Math.max(0, targetIndex)
      );
      if (!data[clampedIndex]) {
        return;
      }
      const itemIdPrefix = generateCompositeItemIdPrefix(
        data[clampedIndex]
      );
      const targetCompositeItemId = generateCompositeId(itemIdPrefix);
      setActiveCompositeId(targetCompositeItemId);
      document.getElementById(targetCompositeItemId)?.focus();
    },
    [data, generateCompositeItemIdPrefix]
  );
  (0, import_element11.useEffect)(() => {
    const wasActiveIdInList = previousActiveItemIndex !== void 0 && previousActiveItemIndex !== -1;
    if (!isActiveIdInList && wasActiveIdInList) {
      selectCompositeItem(
        previousActiveItemIndex,
        generateItemWrapperCompositeId
      );
    }
  }, [isActiveIdInList, selectCompositeItem, previousActiveItemIndex]);
  const onDropdownTriggerKeyDown = (0, import_element11.useCallback)(
    (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectCompositeItem(
          activeItemIndex + 1,
          generateDropdownTriggerCompositeId
        );
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        selectCompositeItem(
          activeItemIndex - 1,
          generateDropdownTriggerCompositeId
        );
      }
    },
    [selectCompositeItem, activeItemIndex]
  );
  const hasData = data?.length;
  if (!hasData) {
    return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
      "div",
      {
        className: clsx_default({
          "dataviews-loading": isLoading,
          "dataviews-no-results": !hasData && !isLoading
        }),
        children: !hasData && (isLoading ? /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(import_components9.Spinner, {}) }) : empty)
      }
    );
  }
  const groupField = view.groupByField ? fields.find((field) => field.id === view.groupByField) : null;
  const dataByGroup = groupField ? getDataByGroup(data, groupField) : null;
  if (hasData && groupField && dataByGroup) {
    return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
      import_components9.Composite,
      {
        id: `${baseId}`,
        render: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", {}),
        className: "dataviews-view-list__group",
        role: "grid",
        activeId: activeCompositeId,
        setActiveId: setActiveCompositeId,
        children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
          import_components9.__experimentalVStack,
          {
            spacing: 4,
            className: clsx_default("dataviews-view-list", className),
            children: Array.from(dataByGroup.entries()).map(
              ([groupName, groupItems]) => /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_components9.__experimentalVStack, { spacing: 2, children: [
                /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("h3", { className: "dataviews-view-list__group-header", children: (0, import_i18n10.sprintf)(
                  // translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
                  (0, import_i18n10.__)("%1$s: %2$s"),
                  groupField.label,
                  groupName
                ) }),
                groupItems.map((item) => {
                  const id = generateCompositeItemIdPrefix(item);
                  return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
                    ListItem,
                    {
                      view,
                      idPrefix: id,
                      actions,
                      item,
                      isSelected: item === selectedItem,
                      onSelect,
                      mediaField,
                      titleField,
                      descriptionField,
                      otherFields,
                      onDropdownTriggerKeyDown
                    },
                    id
                  );
                })
              ] }, groupName)
            )
          }
        )
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
      import_components9.Composite,
      {
        id: baseId,
        render: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", {}),
        className: clsx_default("dataviews-view-list", className),
        role: view.infiniteScrollEnabled ? "feed" : "grid",
        activeId: activeCompositeId,
        setActiveId: setActiveCompositeId,
        children: data.map((item, index) => {
          const id = generateCompositeItemIdPrefix(item);
          return /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
            ListItem,
            {
              view,
              idPrefix: id,
              actions,
              item,
              isSelected: item === selectedItem,
              onSelect,
              mediaField,
              titleField,
              descriptionField,
              otherFields,
              onDropdownTriggerKeyDown,
              posinset: view.infiniteScrollEnabled ? index + 1 : void 0
            },
            id
          );
        })
      }
    ),
    hasData && isLoading && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("p", { className: "dataviews-loading-more", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(import_components9.Spinner, {}) })
  ] });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/picker-grid/index.js
var import_jsx_runtime43 = __toESM(require_jsx_runtime(), 1);
var import_components12 = __toESM(require_components(), 1);
var import_i18n13 = __toESM(require_i18n(), 1);
var import_compose6 = __toESM(require_compose(), 1);
var import_element14 = __toESM(require_element(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-picker/footer.js
var import_jsx_runtime42 = __toESM(require_jsx_runtime(), 1);
var import_components11 = __toESM(require_components(), 1);
var import_data4 = __toESM(require_data(), 1);
var import_element13 = __toESM(require_element(), 1);
var import_i18n12 = __toESM(require_i18n(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-pagination/index.js
var import_jsx_runtime41 = __toESM(require_jsx_runtime(), 1);
var import_components10 = __toESM(require_components(), 1);
var import_element12 = __toESM(require_element(), 1);
var import_i18n11 = __toESM(require_i18n(), 1);
function DataViewsPagination() {
  const {
    view,
    onChangeView,
    paginationInfo: { totalItems = 0, totalPages }
  } = (0, import_element12.useContext)(dataviews_context_default);
  if (!totalItems || !totalPages || view.infiniteScrollEnabled) {
    return null;
  }
  const currentPage = view.page ?? 1;
  const pageSelectOptions = Array.from(Array(totalPages)).map(
    (_, i2) => {
      const page = i2 + 1;
      return {
        value: page.toString(),
        label: page.toString(),
        "aria-label": currentPage === page ? (0, import_i18n11.sprintf)(
          // translators: 1: current page number. 2: total number of pages.
          (0, import_i18n11.__)("Page %1$d of %2$d"),
          currentPage,
          totalPages
        ) : page.toString()
      };
    }
  );
  return !!totalItems && totalPages !== 1 && /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(
    import_components10.__experimentalHStack,
    {
      expanded: false,
      className: "dataviews-pagination",
      justify: "end",
      spacing: 6,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
          import_components10.__experimentalHStack,
          {
            justify: "flex-start",
            expanded: false,
            spacing: 1,
            className: "dataviews-pagination__page-select",
            children: (0, import_element12.createInterpolateElement)(
              (0, import_i18n11.sprintf)(
                // translators: 1: Current page number, 2: Total number of pages.
                (0, import_i18n11._x)(
                  "<div>Page</div>%1$s<div>of %2$d</div>",
                  "paging"
                ),
                "<CurrentPage />",
                totalPages
              ),
              {
                div: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("div", { "aria-hidden": true }),
                CurrentPage: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
                  import_components10.SelectControl,
                  {
                    "aria-label": (0, import_i18n11.__)("Current page"),
                    value: currentPage.toString(),
                    options: pageSelectOptions,
                    onChange: (newValue) => {
                      onChangeView({
                        ...view,
                        page: +newValue
                      });
                    },
                    size: "small",
                    __nextHasNoMarginBottom: true,
                    variant: "minimal"
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)(import_components10.__experimentalHStack, { expanded: false, spacing: 1, children: [
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
            import_components10.Button,
            {
              onClick: () => onChangeView({
                ...view,
                page: currentPage - 1
              }),
              disabled: currentPage === 1,
              accessibleWhenDisabled: true,
              label: (0, import_i18n11.__)("Previous page"),
              icon: (0, import_i18n11.isRTL)() ? next_default : previous_default,
              showTooltip: true,
              size: "compact",
              tooltipPosition: "top"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
            import_components10.Button,
            {
              onClick: () => onChangeView({ ...view, page: currentPage + 1 }),
              disabled: currentPage >= totalPages,
              accessibleWhenDisabled: true,
              label: (0, import_i18n11.__)("Next page"),
              icon: (0, import_i18n11.isRTL)() ? previous_default : next_default,
              showTooltip: true,
              size: "compact",
              tooltipPosition: "top"
            }
          )
        ] })
      ]
    }
  );
}
var dataviews_pagination_default = (0, import_element12.memo)(DataViewsPagination);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-picker/footer.js
function useIsMultiselectPicker(actions) {
  return (0, import_element13.useMemo)(() => {
    return actions?.every((action) => action.supportsBulk);
  }, [actions]);
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/picker-grid/index.js
var { Badge: Badge2 } = unlock(import_components12.privateApis);
function GridItem2({
  view,
  multiselect,
  selection,
  onChangeSelection,
  getItemId: getItemId2,
  item,
  mediaField,
  titleField,
  descriptionField,
  regularFields,
  badgeFields,
  config,
  posinset,
  setsize
}) {
  const { showTitle = true, showMedia = true, showDescription = true } = view;
  const id = getItemId2(item);
  const isSelected2 = selection.includes(id);
  const renderedMediaField = mediaField?.render ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
    mediaField.render,
    {
      item,
      field: mediaField,
      config
    }
  ) : null;
  const renderedTitleField = showTitle && titleField?.render ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(titleField.render, { item, field: titleField }) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
    import_components12.Composite.Item,
    {
      "aria-label": titleField ? titleField.getValue({ item }) || (0, import_i18n13.__)("(no title)") : void 0,
      render: ({ children, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_components12.__experimentalVStack, { spacing: 0, children, ...props }),
      role: "option",
      "aria-posinset": posinset,
      "aria-setsize": setsize,
      className: clsx_default("dataviews-view-picker-grid__card", {
        "is-selected": isSelected2
      }),
      "aria-selected": isSelected2,
      onClick: () => {
        if (isSelected2) {
          onChangeSelection(
            selection.filter((itemId) => id !== itemId)
          );
        } else {
          const newSelection = multiselect ? [...selection, id] : [id];
          onChangeSelection(newSelection);
        }
      },
      children: [
        showMedia && renderedMediaField && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("div", { className: "dataviews-view-picker-grid__media", children: renderedMediaField }),
        showMedia && renderedMediaField && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
          DataViewsSelectionCheckbox,
          {
            item,
            selection,
            onChangeSelection,
            getItemId: getItemId2,
            titleField,
            disabled: false,
            "aria-hidden": true,
            tabIndex: -1
          }
        ),
        showTitle && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
          import_components12.__experimentalHStack,
          {
            justify: "space-between",
            className: "dataviews-view-picker-grid__title-actions",
            children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("div", { className: "dataviews-view-picker-grid__title-field dataviews-title-field", children: renderedTitleField })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_components12.__experimentalVStack, { spacing: 1, children: [
          showDescription && descriptionField?.render && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
            descriptionField.render,
            {
              item,
              field: descriptionField
            }
          ),
          !!badgeFields?.length && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
            import_components12.__experimentalHStack,
            {
              className: "dataviews-view-picker-grid__badge-fields",
              spacing: 2,
              wrap: true,
              alignment: "top",
              justify: "flex-start",
              children: badgeFields.map((field) => {
                return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                  Badge2,
                  {
                    className: "dataviews-view-picker-grid__field-value",
                    children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                      field.render,
                      {
                        item,
                        field
                      }
                    )
                  },
                  field.id
                );
              })
            }
          ),
          !!regularFields?.length && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
            import_components12.__experimentalVStack,
            {
              className: "dataviews-view-picker-grid__fields",
              spacing: 1,
              children: regularFields.map((field) => {
                return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                  import_components12.Flex,
                  {
                    className: "dataviews-view-picker-grid__field",
                    gap: 1,
                    justify: "flex-start",
                    expanded: true,
                    style: { height: "auto" },
                    direction: "row",
                    children: /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
                      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_components12.FlexItem, { className: "dataviews-view-picker-grid__field-name", children: field.header }),
                      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                        import_components12.FlexItem,
                        {
                          className: "dataviews-view-picker-grid__field-value",
                          style: { maxHeight: "none" },
                          children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                            field.render,
                            {
                              item,
                              field
                            }
                          )
                        }
                      )
                    ] })
                  },
                  field.id
                );
              })
            }
          )
        ] })
      ]
    },
    id
  );
}
function GridGroup({
  groupName,
  groupField,
  children
}) {
  const headerId = (0, import_compose6.useInstanceId)(
    GridGroup,
    "dataviews-view-picker-grid-group__header"
  );
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
    import_components12.__experimentalVStack,
    {
      spacing: 2,
      role: "group",
      "aria-labelledby": headerId,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
          "h3",
          {
            className: "dataviews-view-picker-grid-group__header",
            id: headerId,
            children: (0, import_i18n13.sprintf)(
              // translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
              (0, import_i18n13.__)("%1$s: %2$s"),
              groupField.label,
              groupName
            )
          }
        ),
        children
      ]
    },
    groupName
  );
}
function ViewPickerGrid({
  actions,
  data,
  fields,
  getItemId: getItemId2,
  isLoading,
  onChangeSelection,
  selection,
  view,
  className,
  empty
}) {
  const { resizeObserverRef, paginationInfo, itemListLabel } = (0, import_element14.useContext)(dataviews_context_default);
  const titleField = fields.find(
    (field) => field.id === view?.titleField
  );
  const mediaField = fields.find(
    (field) => field.id === view?.mediaField
  );
  const descriptionField = fields.find(
    (field) => field.id === view?.descriptionField
  );
  const otherFields = view.fields ?? [];
  const { regularFields, badgeFields } = otherFields.reduce(
    (accumulator, fieldId) => {
      const field = fields.find((f2) => f2.id === fieldId);
      if (!field) {
        return accumulator;
      }
      const key = view.layout?.badgeFields?.includes(fieldId) ? "badgeFields" : "regularFields";
      accumulator[key].push(field);
      return accumulator;
    },
    { regularFields: [], badgeFields: [] }
  );
  const hasData = !!data?.length;
  const usedPreviewSize = view.layout?.previewSize;
  const isMultiselect = useIsMultiselectPicker(actions);
  const size = "900px";
  const groupField = view.groupByField ? fields.find((f2) => f2.id === view.groupByField) : null;
  const dataByGroup = groupField ? getDataByGroup(data, groupField) : null;
  const isInfiniteScroll = view.infiniteScrollEnabled && !dataByGroup;
  const currentPage = view?.page ?? 1;
  const perPage = view?.perPage ?? 0;
  const setSize = isInfiniteScroll ? paginationInfo?.totalItems : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, {
    // Render multiple groups.
    children: [
      hasData && groupField && dataByGroup && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
        import_components12.Composite,
        {
          virtualFocus: true,
          orientation: "horizontal",
          role: "listbox",
          "aria-multiselectable": isMultiselect,
          className: clsx_default(
            "dataviews-view-picker-grid",
            className
          ),
          "aria-label": itemListLabel,
          render: ({ children, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
            import_components12.__experimentalVStack,
            {
              spacing: 4,
              children,
              ...props
            }
          ),
          children: Array.from(dataByGroup.entries()).map(
            ([groupName, groupItems]) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
              GridGroup,
              {
                groupName,
                groupField,
                children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                  GridItems,
                  {
                    previewSize: usedPreviewSize,
                    style: {
                      gridTemplateColumns: usedPreviewSize && `repeat(auto-fill, minmax(${usedPreviewSize}px, 1fr))`
                    },
                    "aria-busy": isLoading,
                    ref: resizeObserverRef,
                    children: groupItems.map((item) => {
                      const posInSet = (currentPage - 1) * perPage + data.indexOf(item) + 1;
                      return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
                        GridItem2,
                        {
                          view,
                          multiselect: isMultiselect,
                          selection,
                          onChangeSelection,
                          getItemId: getItemId2,
                          item,
                          mediaField,
                          titleField,
                          descriptionField,
                          regularFields,
                          badgeFields,
                          config: {
                            sizes: size
                          },
                          posinset: posInSet,
                          setsize: setSize
                        },
                        getItemId2(item)
                      );
                    })
                  }
                )
              },
              groupName
            )
          )
        }
      ),
      // Render a single grid with all data.
      hasData && !dataByGroup && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
        import_components12.Composite,
        {
          render: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
            GridItems,
            {
              className: clsx_default(
                "dataviews-view-picker-grid",
                className
              ),
              previewSize: usedPreviewSize,
              "aria-busy": isLoading,
              ref: resizeObserverRef
            }
          ),
          virtualFocus: true,
          orientation: "horizontal",
          role: "listbox",
          "aria-multiselectable": isMultiselect,
          "aria-label": itemListLabel,
          children: data.map((item, index) => {
            let posinset = isInfiniteScroll ? index + 1 : void 0;
            if (!isInfiniteScroll) {
              posinset = (currentPage - 1) * perPage + index + 1;
            }
            return /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
              GridItem2,
              {
                view,
                multiselect: isMultiselect,
                selection,
                onChangeSelection,
                getItemId: getItemId2,
                item,
                mediaField,
                titleField,
                descriptionField,
                regularFields,
                badgeFields,
                config: {
                  sizes: size
                },
                posinset,
                setsize: setSize
              },
              getItemId2(item)
            );
          })
        }
      ),
      // Render empty state.
      !hasData && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
        "div",
        {
          className: clsx_default({
            "dataviews-loading": isLoading,
            "dataviews-no-results": !isLoading
          }),
          children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_components12.Spinner, {}) }) : empty
        }
      ),
      hasData && isLoading && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { className: "dataviews-loading-more", children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_components12.Spinner, {}) })
    ]
  });
}
var picker_grid_default = ViewPickerGrid;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/utils/preview-size-picker.js
var import_jsx_runtime44 = __toESM(require_jsx_runtime(), 1);
var import_components13 = __toESM(require_components(), 1);
var import_i18n14 = __toESM(require_i18n(), 1);
var import_element15 = __toESM(require_element(), 1);
var imageSizes = [
  {
    value: 120,
    breakpoint: 1
  },
  {
    value: 170,
    breakpoint: 1
  },
  {
    value: 230,
    breakpoint: 1
  },
  {
    value: 290,
    breakpoint: 1112
    // at minimum image width, 4 images display at this container size
  },
  {
    value: 350,
    breakpoint: 1636
    // at minimum image width, 6 images display at this container size
  },
  {
    value: 430,
    breakpoint: 588
    // at minimum image width, 2 images display at this container size
  }
];
function PreviewSizePicker() {
  const context = (0, import_element15.useContext)(dataviews_context_default);
  const view = context.view;
  const breakValues = imageSizes.filter((size) => {
    return context.containerWidth >= size.breakpoint;
  });
  const layoutPreviewSize = view.layout?.previewSize ?? 230;
  const previewSizeToUse = breakValues.map((size, index) => ({ ...size, index })).filter((size) => size.value <= layoutPreviewSize).sort((a2, b2) => b2.value - a2.value)[0]?.index ?? 0;
  const marks = breakValues.map((size, index) => {
    return {
      value: index
    };
  });
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(
    import_components13.RangeControl,
    {
      __nextHasNoMarginBottom: true,
      __next40pxDefaultSize: true,
      showTooltip: false,
      label: (0, import_i18n14.__)("Preview size"),
      value: previewSizeToUse,
      min: 0,
      max: breakValues.length - 1,
      withInputField: false,
      onChange: (value = 0) => {
        context.onChangeView({
          ...view,
          layout: {
            ...view.layout,
            previewSize: breakValues[value].value
          }
        });
      },
      step: 1,
      marks
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/table/density-picker.js
var import_jsx_runtime45 = __toESM(require_jsx_runtime(), 1);
var import_components14 = __toESM(require_components(), 1);
var import_i18n15 = __toESM(require_i18n(), 1);
var import_element16 = __toESM(require_element(), 1);
function DensityPicker() {
  const context = (0, import_element16.useContext)(dataviews_context_default);
  const view = context.view;
  return /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(
    import_components14.__experimentalToggleGroupControl,
    {
      __nextHasNoMarginBottom: true,
      size: "__unstable-large",
      label: (0, import_i18n15.__)("Density"),
      value: view.layout?.density || "balanced",
      onChange: (value) => {
        context.onChangeView({
          ...view,
          layout: {
            ...view.layout,
            density: value
          }
        });
      },
      isBlock: true,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
          import_components14.__experimentalToggleGroupControlOption,
          {
            value: "comfortable",
            label: (0, import_i18n15._x)(
              "Comfortable",
              "Density option for DataView layout"
            )
          },
          "comfortable"
        ),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
          import_components14.__experimentalToggleGroupControlOption,
          {
            value: "balanced",
            label: (0, import_i18n15._x)("Balanced", "Density option for DataView layout")
          },
          "balanced"
        ),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
          import_components14.__experimentalToggleGroupControlOption,
          {
            value: "compact",
            label: (0, import_i18n15._x)("Compact", "Density option for DataView layout")
          },
          "compact"
        )
      ]
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataviews-layouts/index.js
var VIEW_LAYOUTS = [
  {
    type: LAYOUT_TABLE,
    label: (0, import_i18n16.__)("Table"),
    component: table_default,
    icon: block_table_default,
    viewConfigOptions: DensityPicker
  },
  {
    type: LAYOUT_GRID,
    label: (0, import_i18n16.__)("Grid"),
    component: grid_default,
    icon: category_default,
    viewConfigOptions: PreviewSizePicker
  },
  {
    type: LAYOUT_LIST,
    label: (0, import_i18n16.__)("List"),
    component: ViewList,
    icon: (0, import_i18n16.isRTL)() ? format_list_bullets_rtl_default : format_list_bullets_default
  },
  {
    type: LAYOUT_PICKER_GRID,
    label: (0, import_i18n16.__)("Grid"),
    component: picker_grid_default,
    icon: category_default,
    viewConfigOptions: PreviewSizePicker,
    isPicker: true
  }
];

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/filters.js
var import_jsx_runtime59 = __toESM(require_jsx_runtime(), 1);
var import_element23 = __toESM(require_element(), 1);
var import_components20 = __toESM(require_components(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/filter.js
var import_jsx_runtime56 = __toESM(require_jsx_runtime(), 1);
var import_components17 = __toESM(require_components(), 1);
var import_i18n18 = __toESM(require_i18n(), 1);
var import_element20 = __toESM(require_element(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/search-widget.js
var import_jsx_runtime54 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/3YLGPPWQ.js
var __defProp2 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp2.call(b2, prop))
      __defNormalProp(a2, prop, b2[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b2)) {
      if (__propIsEnum.call(b2, prop))
        __defNormalProp(a2, prop, b2[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b2) => __defProps(a2, __getOwnPropDescs(b2));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp2.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/3YLGPPWQ.js
var __defProp3 = Object.defineProperty;
var __defProps2 = Object.defineProperties;
var __getOwnPropDescs2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp3 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a2, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp3.call(b2, prop))
      __defNormalProp2(a2, prop, b2[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b2)) {
      if (__propIsEnum2.call(b2, prop))
        __defNormalProp2(a2, prop, b2[prop]);
    }
  return a2;
};
var __spreadProps2 = (a2, b2) => __defProps2(a2, __getOwnPropDescs2(b2));
var __objRest2 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp3.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum2.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/PBFD2E7P.js
function noop(..._) {
}
function applyState(argument, currentValue) {
  if (isUpdater(argument)) {
    const value = isLazyValue(currentValue) ? currentValue() : currentValue;
    return argument(value);
  }
  return argument;
}
function isUpdater(argument) {
  return typeof argument === "function";
}
function isLazyValue(value) {
  return typeof value === "function";
}
function hasOwnProperty(object, prop) {
  if (typeof Object.hasOwn === "function") {
    return Object.hasOwn(object, prop);
  }
  return Object.prototype.hasOwnProperty.call(object, prop);
}
function chain(...fns) {
  return (...args) => {
    for (const fn of fns) {
      if (typeof fn === "function") {
        fn(...args);
      }
    }
  };
}
function normalizeString(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function omit(object, keys) {
  const result = __spreadValues2({}, object);
  for (const key of keys) {
    if (hasOwnProperty(result, key)) {
      delete result[key];
    }
  }
  return result;
}
function pick(object, paths) {
  const result = {};
  for (const key of paths) {
    if (hasOwnProperty(object, key)) {
      result[key] = object[key];
    }
  }
  return result;
}
function identity(value) {
  return value;
}
function invariant2(condition, message2) {
  if (condition) return;
  if (typeof message2 !== "string") throw new Error("Invariant failed");
  throw new Error(message2);
}
function getKeys(obj) {
  return Object.keys(obj);
}
function isFalsyBooleanCallback(booleanOrCallback, ...args) {
  const result = typeof booleanOrCallback === "function" ? booleanOrCallback(...args) : booleanOrCallback;
  if (result == null) return false;
  return !result;
}
function disabledFromProps(props) {
  return props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
}
function removeUndefinedValues(obj) {
  const result = {};
  for (const key in obj) {
    if (obj[key] !== void 0) {
      result[key] = obj[key];
    }
  }
  return result;
}
function defaultValue(...values) {
  for (const value of values) {
    if (value !== void 0) return value;
  }
  return void 0;
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/SK3NAZA3.js
var import_react2 = __toESM(require_react(), 1);
function setRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}
function isValidElementWithRef(element) {
  if (!element) return false;
  if (!(0, import_react2.isValidElement)(element)) return false;
  if ("ref" in element.props) return true;
  if ("ref" in element) return true;
  return false;
}
function getRefProperty(element) {
  if (!isValidElementWithRef(element)) return null;
  const props = __spreadValues({}, element.props);
  return props.ref || element.ref;
}
function mergeProps(base, overrides) {
  const props = __spreadValues({}, base);
  for (const key in overrides) {
    if (!hasOwnProperty(overrides, key)) continue;
    if (key === "className") {
      const prop = "className";
      props[prop] = base[prop] ? `${base[prop]} ${overrides[prop]}` : overrides[prop];
      continue;
    }
    if (key === "style") {
      const prop = "style";
      props[prop] = base[prop] ? __spreadValues(__spreadValues({}, base[prop]), overrides[prop]) : overrides[prop];
      continue;
    }
    const overrideValue = overrides[key];
    if (typeof overrideValue === "function" && key.startsWith("on")) {
      const baseValue = base[key];
      if (typeof baseValue === "function") {
        props[key] = (...args) => {
          overrideValue(...args);
          baseValue(...args);
        };
        continue;
      }
    }
    props[key] = overrideValue;
  }
  return props;
}

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/37JWRFYW.js
var canUseDOM = checkIsBrowser();
function checkIsBrowser() {
  var _a;
  return typeof window !== "undefined" && !!((_a = window.document) == null ? void 0 : _a.createElement);
}
function getDocument(node) {
  if (!node) return document;
  if ("self" in node) return node.document;
  return node.ownerDocument || document;
}
function getActiveElement(node, activeDescendant = false) {
  const { activeElement: activeElement2 } = getDocument(node);
  if (!(activeElement2 == null ? void 0 : activeElement2.nodeName)) {
    return null;
  }
  if (isFrame(activeElement2) && activeElement2.contentDocument) {
    return getActiveElement(
      activeElement2.contentDocument.body,
      activeDescendant
    );
  }
  if (activeDescendant) {
    const id = activeElement2.getAttribute("aria-activedescendant");
    if (id) {
      const element = getDocument(activeElement2).getElementById(id);
      if (element) {
        return element;
      }
    }
  }
  return activeElement2;
}
function contains(parent, child) {
  return parent === child || parent.contains(child);
}
function isFrame(element) {
  return element.tagName === "IFRAME";
}
function isButton(element) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "button") return true;
  if (tagName === "input" && element.type) {
    return buttonInputTypes.indexOf(element.type) !== -1;
  }
  return false;
}
var buttonInputTypes = [
  "button",
  "color",
  "file",
  "image",
  "reset",
  "submit"
];
function isVisible(element) {
  if (typeof element.checkVisibility === "function") {
    return element.checkVisibility();
  }
  const htmlElement = element;
  return htmlElement.offsetWidth > 0 || htmlElement.offsetHeight > 0 || element.getClientRects().length > 0;
}
function isTextField(element) {
  try {
    const isTextInput = element instanceof HTMLInputElement && element.selectionStart !== null;
    const isTextArea = element.tagName === "TEXTAREA";
    return isTextInput || isTextArea || false;
  } catch (_error) {
    return false;
  }
}
function isTextbox(element) {
  return element.isContentEditable || isTextField(element);
}
function getTextboxValue(element) {
  if (isTextField(element)) {
    return element.value;
  }
  if (element.isContentEditable) {
    const range = getDocument(element).createRange();
    range.selectNodeContents(element);
    return range.toString();
  }
  return "";
}
function getTextboxSelection(element) {
  let start = 0;
  let end = 0;
  if (isTextField(element)) {
    start = element.selectionStart || 0;
    end = element.selectionEnd || 0;
  } else if (element.isContentEditable) {
    const selection = getDocument(element).getSelection();
    if ((selection == null ? void 0 : selection.rangeCount) && selection.anchorNode && contains(element, selection.anchorNode) && selection.focusNode && contains(element, selection.focusNode)) {
      const range = selection.getRangeAt(0);
      const nextRange = range.cloneRange();
      nextRange.selectNodeContents(element);
      nextRange.setEnd(range.startContainer, range.startOffset);
      start = nextRange.toString().length;
      nextRange.setEnd(range.endContainer, range.endOffset);
      end = nextRange.toString().length;
    }
  }
  return { start, end };
}
function getPopupRole(element, fallback) {
  const allowedPopupRoles = ["dialog", "menu", "listbox", "tree", "grid"];
  const role = element == null ? void 0 : element.getAttribute("role");
  if (role && allowedPopupRoles.indexOf(role) !== -1) {
    return role;
  }
  return fallback;
}
function getScrollingElement(element) {
  if (!element) return null;
  const isScrollableOverflow = (overflow) => {
    if (overflow === "auto") return true;
    if (overflow === "scroll") return true;
    return false;
  };
  if (element.clientHeight && element.scrollHeight > element.clientHeight) {
    const { overflowY } = getComputedStyle(element);
    if (isScrollableOverflow(overflowY)) return element;
  } else if (element.clientWidth && element.scrollWidth > element.clientWidth) {
    const { overflowX } = getComputedStyle(element);
    if (isScrollableOverflow(overflowX)) return element;
  }
  return getScrollingElement(element.parentElement) || document.scrollingElement || document.body;
}
function setSelectionRange(element, ...args) {
  if (/text|search|password|tel|url/i.test(element.type)) {
    element.setSelectionRange(...args);
  }
}
function sortBasedOnDOMPosition(items, getElement) {
  const pairs = items.map((item, index) => [index, item]);
  let isOrderDifferent = false;
  pairs.sort(([indexA, a2], [indexB, b2]) => {
    const elementA = getElement(a2);
    const elementB = getElement(b2);
    if (elementA === elementB) return 0;
    if (!elementA || !elementB) return 0;
    if (isElementPreceding(elementA, elementB)) {
      if (indexA > indexB) {
        isOrderDifferent = true;
      }
      return -1;
    }
    if (indexA < indexB) {
      isOrderDifferent = true;
    }
    return 1;
  });
  if (isOrderDifferent) {
    return pairs.map(([_, item]) => item);
  }
  return items;
}
function isElementPreceding(a2, b2) {
  return Boolean(
    b2.compareDocumentPosition(a2) & Node.DOCUMENT_POSITION_PRECEDING
  );
}

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/O6E4ZWCP.js
function isTouchDevice() {
  return canUseDOM && !!navigator.maxTouchPoints;
}
function isApple() {
  if (!canUseDOM) return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
}
function isSafari() {
  return canUseDOM && isApple() && /apple/i.test(navigator.vendor);
}
function isFirefox() {
  return canUseDOM && /firefox\//i.test(navigator.userAgent);
}

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/utils/events.js
function isPortalEvent(event) {
  return Boolean(
    event.currentTarget && !contains(event.currentTarget, event.target)
  );
}
function isSelfTarget(event) {
  return event.target === event.currentTarget;
}
function isOpeningInNewTab(event) {
  const element = event.currentTarget;
  if (!element) return false;
  const isAppleDevice = isApple();
  if (isAppleDevice && !event.metaKey) return false;
  if (!isAppleDevice && !event.ctrlKey) return false;
  const tagName = element.tagName.toLowerCase();
  if (tagName === "a") return true;
  if (tagName === "button" && element.type === "submit") return true;
  if (tagName === "input" && element.type === "submit") return true;
  return false;
}
function isDownloading(event) {
  const element = event.currentTarget;
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  if (!event.altKey) return false;
  if (tagName === "a") return true;
  if (tagName === "button" && element.type === "submit") return true;
  if (tagName === "input" && element.type === "submit") return true;
  return false;
}
function fireBlurEvent(element, eventInit) {
  const event = new FocusEvent("blur", eventInit);
  const defaultAllowed = element.dispatchEvent(event);
  const bubbleInit = __spreadProps2(__spreadValues2({}, eventInit), { bubbles: true });
  element.dispatchEvent(new FocusEvent("focusout", bubbleInit));
  return defaultAllowed;
}
function fireKeyboardEvent(element, type, eventInit) {
  const event = new KeyboardEvent(type, eventInit);
  return element.dispatchEvent(event);
}
function fireClickEvent(element, eventInit) {
  const event = new MouseEvent("click", eventInit);
  return element.dispatchEvent(event);
}
function isFocusEventOutside(event, container) {
  const containerElement = container || event.currentTarget;
  const relatedTarget = event.relatedTarget;
  return !relatedTarget || !contains(containerElement, relatedTarget);
}
function queueBeforeEvent(element, type, callback, timeout) {
  const createTimer = (callback2) => {
    if (timeout) {
      const timerId2 = setTimeout(callback2, timeout);
      return () => clearTimeout(timerId2);
    }
    const timerId = requestAnimationFrame(callback2);
    return () => cancelAnimationFrame(timerId);
  };
  const cancelTimer = createTimer(() => {
    element.removeEventListener(type, callSync, true);
    callback();
  });
  const callSync = () => {
    cancelTimer();
    callback();
  };
  element.addEventListener(type, callSync, { once: true, capture: true });
  return cancelTimer;
}
function addGlobalEventListener(type, listener, options, scope = window) {
  const children = [];
  try {
    scope.document.addEventListener(type, listener, options);
    for (const frame of Array.from(scope.frames)) {
      children.push(addGlobalEventListener(type, listener, options, frame));
    }
  } catch (e2) {
  }
  const removeEventListener = () => {
    try {
      scope.document.removeEventListener(type, listener, options);
    } catch (e2) {
    }
    for (const remove of children) {
      remove();
    }
  };
  return removeEventListener;
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/5GGHRIN3.js
var React6 = __toESM(require_react(), 1);
var import_react3 = __toESM(require_react(), 1);
var _React = __spreadValues({}, React6);
var useReactId = _React.useId;
var useReactDeferredValue = _React.useDeferredValue;
var useReactInsertionEffect = _React.useInsertionEffect;
var useSafeLayoutEffect = canUseDOM ? import_react3.useLayoutEffect : import_react3.useEffect;
function useInitialValue(value) {
  const [initialValue] = (0, import_react3.useState)(value);
  return initialValue;
}
function useLiveRef(value) {
  const ref = (0, import_react3.useRef)(value);
  useSafeLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
function useEvent(callback) {
  const ref = (0, import_react3.useRef)(() => {
    throw new Error("Cannot call an event handler while rendering.");
  });
  if (useReactInsertionEffect) {
    useReactInsertionEffect(() => {
      ref.current = callback;
    });
  } else {
    ref.current = callback;
  }
  return (0, import_react3.useCallback)((...args) => {
    var _a;
    return (_a = ref.current) == null ? void 0 : _a.call(ref, ...args);
  }, []);
}
function useTransactionState(callback) {
  const [state, setState] = (0, import_react3.useState)(null);
  useSafeLayoutEffect(() => {
    if (state == null) return;
    if (!callback) return;
    let prevState = null;
    callback((prev) => {
      prevState = prev;
      return state;
    });
    return () => {
      callback(prevState);
    };
  }, [state, callback]);
  return [state, setState];
}
function useMergeRefs(...refs) {
  return (0, import_react3.useMemo)(() => {
    if (!refs.some(Boolean)) return;
    return (value) => {
      for (const ref of refs) {
        setRef(ref, value);
      }
    };
  }, refs);
}
function useId2(defaultId) {
  if (useReactId) {
    const reactId = useReactId();
    if (defaultId) return defaultId;
    return reactId;
  }
  const [id, setId] = (0, import_react3.useState)(defaultId);
  useSafeLayoutEffect(() => {
    if (defaultId || id) return;
    const random = Math.random().toString(36).slice(2, 8);
    setId(`id-${random}`);
  }, [defaultId, id]);
  return defaultId || id;
}
function useTagName(refOrElement, type) {
  const stringOrUndefined = (type2) => {
    if (typeof type2 !== "string") return;
    return type2;
  };
  const [tagName, setTagName] = (0, import_react3.useState)(() => stringOrUndefined(type));
  useSafeLayoutEffect(() => {
    const element = refOrElement && "current" in refOrElement ? refOrElement.current : refOrElement;
    setTagName((element == null ? void 0 : element.tagName.toLowerCase()) || stringOrUndefined(type));
  }, [refOrElement, type]);
  return tagName;
}
function useAttribute(refOrElement, attributeName, defaultValue2) {
  const initialValue = useInitialValue(defaultValue2);
  const [attribute, setAttribute] = (0, import_react3.useState)(initialValue);
  (0, import_react3.useEffect)(() => {
    const element = refOrElement && "current" in refOrElement ? refOrElement.current : refOrElement;
    if (!element) return;
    const callback = () => {
      const value = element.getAttribute(attributeName);
      setAttribute(value == null ? initialValue : value);
    };
    const observer = new MutationObserver(callback);
    observer.observe(element, { attributeFilter: [attributeName] });
    callback();
    return () => observer.disconnect();
  }, [refOrElement, attributeName, initialValue]);
  return attribute;
}
function useUpdateEffect(effect, deps) {
  const mounted = (0, import_react3.useRef)(false);
  (0, import_react3.useEffect)(() => {
    if (mounted.current) {
      return effect();
    }
    mounted.current = true;
  }, deps);
  (0, import_react3.useEffect)(
    () => () => {
      mounted.current = false;
    },
    []
  );
}
function useUpdateLayoutEffect(effect, deps) {
  const mounted = (0, import_react3.useRef)(false);
  useSafeLayoutEffect(() => {
    if (mounted.current) {
      return effect();
    }
    mounted.current = true;
  }, deps);
  useSafeLayoutEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );
}
function useForceUpdate() {
  return (0, import_react3.useReducer)(() => [], []);
}
function useBooleanEvent(booleanOrCallback) {
  return useEvent(
    typeof booleanOrCallback === "function" ? booleanOrCallback : () => booleanOrCallback
  );
}
function useWrapElement(props, callback, deps = []) {
  const wrapElement = (0, import_react3.useCallback)(
    (element) => {
      if (props.wrapElement) {
        element = props.wrapElement(element);
      }
      return callback(element);
    },
    [...deps, props.wrapElement]
  );
  return __spreadProps(__spreadValues({}, props), { wrapElement });
}
function useMetadataProps(props, key, value) {
  const parent = props.onLoadedMetadataCapture;
  const onLoadedMetadataCapture = (0, import_react3.useMemo)(() => {
    return Object.assign(() => {
    }, __spreadProps(__spreadValues({}, parent), { [key]: value }));
  }, [parent, key, value]);
  return [parent == null ? void 0 : parent[key], { onLoadedMetadataCapture }];
}
var hasInstalledGlobalEventListeners = false;
function useIsMouseMoving() {
  (0, import_react3.useEffect)(() => {
    if (hasInstalledGlobalEventListeners) return;
    addGlobalEventListener("mousemove", setMouseMoving, true);
    addGlobalEventListener("mousedown", resetMouseMoving, true);
    addGlobalEventListener("mouseup", resetMouseMoving, true);
    addGlobalEventListener("keydown", resetMouseMoving, true);
    addGlobalEventListener("scroll", resetMouseMoving, true);
    hasInstalledGlobalEventListeners = true;
  }, []);
  const isMouseMoving = useEvent(() => mouseMoving);
  return isMouseMoving;
}
var mouseMoving = false;
var previousScreenX = 0;
var previousScreenY = 0;
function hasMouseMovement(event) {
  const movementX = event.movementX || event.screenX - previousScreenX;
  const movementY = event.movementY || event.screenY - previousScreenY;
  previousScreenX = event.screenX;
  previousScreenY = event.screenY;
  return movementX || movementY || false;
}
function setMouseMoving(event) {
  if (!hasMouseMovement(event)) return;
  mouseMoving = true;
}
function resetMouseMoving() {
  mouseMoving = false;
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/VOQWLFSQ.js
var React7 = __toESM(require_react(), 1);
var import_jsx_runtime46 = __toESM(require_jsx_runtime(), 1);
function forwardRef22(render2) {
  const Role = React7.forwardRef((props, ref) => render2(__spreadProps(__spreadValues({}, props), { ref })));
  Role.displayName = render2.displayName || render2.name;
  return Role;
}
function memo22(Component, propsAreEqual) {
  return React7.memo(Component, propsAreEqual);
}
function createElement(Type, props) {
  const _a = props, { wrapElement, render: render2 } = _a, rest = __objRest(_a, ["wrapElement", "render"]);
  const mergedRef = useMergeRefs(props.ref, getRefProperty(render2));
  let element;
  if (React7.isValidElement(render2)) {
    const renderProps = __spreadProps(__spreadValues({}, render2.props), { ref: mergedRef });
    element = React7.cloneElement(render2, mergeProps(rest, renderProps));
  } else if (render2) {
    element = render2(rest);
  } else {
    element = /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Type, __spreadValues({}, rest));
  }
  if (wrapElement) {
    return wrapElement(element);
  }
  return element;
}
function createHook(useProps) {
  const useRole = (props = {}) => {
    return useProps(props);
  };
  useRole.displayName = useProps.name;
  return useRole;
}
function createStoreContext(providers = [], scopedProviders = []) {
  const context = React7.createContext(void 0);
  const scopedContext = React7.createContext(void 0);
  const useContext210 = () => React7.useContext(context);
  const useScopedContext = (onlyScoped = false) => {
    const scoped = React7.useContext(scopedContext);
    const store = useContext210();
    if (onlyScoped) return scoped;
    return scoped || store;
  };
  const useProviderContext = () => {
    const scoped = React7.useContext(scopedContext);
    const store = useContext210();
    if (scoped && scoped === store) return;
    return store;
  };
  const ContextProvider = (props) => {
    return providers.reduceRight(
      (children, Provider) => /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Provider, __spreadProps(__spreadValues({}, props), { children })),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(context.Provider, __spreadValues({}, props))
    );
  };
  const ScopedContextProvider = (props) => {
    return /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(ContextProvider, __spreadProps(__spreadValues({}, props), { children: scopedProviders.reduceRight(
      (children, Provider) => /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Provider, __spreadProps(__spreadValues({}, props), { children })),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(scopedContext.Provider, __spreadValues({}, props))
    ) }));
  };
  return {
    context,
    scopedContext,
    useContext: useContext210,
    useScopedContext,
    useProviderContext,
    ContextProvider,
    ScopedContextProvider
  };
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/5CPL3B7G.js
var ctx = createStoreContext();
var useCollectionContext = ctx.useContext;
var useCollectionScopedContext = ctx.useScopedContext;
var useCollectionProviderContext = ctx.useProviderContext;
var CollectionContextProvider = ctx.ContextProvider;
var CollectionScopedContextProvider = ctx.ScopedContextProvider;

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/APTFW6PT.js
var import_react4 = __toESM(require_react(), 1);
var ctx2 = createStoreContext(
  [CollectionContextProvider],
  [CollectionScopedContextProvider]
);
var useCompositeContext = ctx2.useContext;
var useCompositeScopedContext = ctx2.useScopedContext;
var useCompositeProviderContext = ctx2.useProviderContext;
var CompositeContextProvider = ctx2.ContextProvider;
var CompositeScopedContextProvider = ctx2.ScopedContextProvider;
var CompositeItemContext = (0, import_react4.createContext)(
  void 0
);
var CompositeRowContext = (0, import_react4.createContext)(
  void 0
);

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/5VQZOHHZ.js
function findFirstEnabledItem(items, excludeId) {
  return items.find((item) => {
    if (excludeId) {
      return !item.disabled && item.id !== excludeId;
    }
    return !item.disabled;
  });
}
function getEnabledItem(store, id) {
  if (!id) return null;
  return store.item(id) || null;
}
function groupItemsByRows(items) {
  const rows = [];
  for (const item of items) {
    const row = rows.find((currentRow) => {
      var _a;
      return ((_a = currentRow[0]) == null ? void 0 : _a.rowId) === item.rowId;
    });
    if (row) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }
  return rows;
}
function selectTextField(element, collapseToEnd = false) {
  if (isTextField(element)) {
    element.setSelectionRange(
      collapseToEnd ? element.value.length : 0,
      element.value.length
    );
  } else if (element.isContentEditable) {
    const selection = getDocument(element).getSelection();
    selection == null ? void 0 : selection.selectAllChildren(element);
    if (collapseToEnd) {
      selection == null ? void 0 : selection.collapseToEnd();
    }
  }
}
var FOCUS_SILENTLY = Symbol("FOCUS_SILENTLY");
function focusSilently(element) {
  element[FOCUS_SILENTLY] = true;
  element.focus({ preventScroll: true });
}
function silentlyFocused(element) {
  const isSilentlyFocused = element[FOCUS_SILENTLY];
  delete element[FOCUS_SILENTLY];
  return isSilentlyFocused;
}
function isItem(store, element, exclude) {
  if (!element) return false;
  if (element === exclude) return false;
  const item = store.item(element.id);
  if (!item) return false;
  if (exclude && item.element === exclude) return false;
  return true;
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/Y62RTBST.js
var import_react5 = __toESM(require_react(), 1);
var TagName = "div";
var useCollectionItem = createHook(
  function useCollectionItem2(_a) {
    var _b = _a, {
      store,
      shouldRegisterItem = true,
      getItem = identity,
      element
    } = _b, props = __objRest(_b, [
      "store",
      "shouldRegisterItem",
      "getItem",
      // @ts-expect-error This prop may come from a collection renderer.
      "element"
    ]);
    const context = useCollectionContext();
    store = store || context;
    const id = useId2(props.id);
    const ref = (0, import_react5.useRef)(element);
    (0, import_react5.useEffect)(() => {
      const element2 = ref.current;
      if (!id) return;
      if (!element2) return;
      if (!shouldRegisterItem) return;
      const item = getItem({ id, element: element2 });
      return store == null ? void 0 : store.renderItem(item);
    }, [id, shouldRegisterItem, getItem, store]);
    props = __spreadProps(__spreadValues({}, props), {
      ref: useMergeRefs(ref, props.ref)
    });
    return removeUndefinedValues(props);
  }
);
var CollectionItem = forwardRef22(function CollectionItem2(props) {
  const htmlProps = useCollectionItem(props);
  return createElement(TagName, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/SWN3JYXT.js
var import_react6 = __toESM(require_react(), 1);
var FocusableContext = (0, import_react6.createContext)(true);

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/utils/focus.js
var selector = "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], button:not([disabled]), [tabindex], summary, iframe, object, embed, area[href], audio[controls], video[controls], [contenteditable]:not([contenteditable='false'])";
function isFocusable(element) {
  if (!element.matches(selector)) return false;
  if (!isVisible(element)) return false;
  if (element.closest("[inert]")) return false;
  return true;
}
function getClosestFocusable(element) {
  while (element && !isFocusable(element)) {
    element = element.closest(selector);
  }
  return element || null;
}
function hasFocus(element) {
  const activeElement2 = getActiveElement(element);
  if (!activeElement2) return false;
  if (activeElement2 === element) return true;
  const activeDescendant = activeElement2.getAttribute("aria-activedescendant");
  if (!activeDescendant) return false;
  return activeDescendant === element.id;
}
function hasFocusWithin(element) {
  const activeElement2 = getActiveElement(element);
  if (!activeElement2) return false;
  if (contains(element, activeElement2)) return true;
  const activeDescendant = activeElement2.getAttribute("aria-activedescendant");
  if (!activeDescendant) return false;
  if (!("id" in element)) return false;
  if (activeDescendant === element.id) return true;
  return !!element.querySelector(`#${CSS.escape(activeDescendant)}`);
}
function focusIfNeeded(element) {
  if (!hasFocusWithin(element) && isFocusable(element)) {
    element.focus();
  }
}
function focusIntoView(element, options) {
  if (!("scrollIntoView" in element)) {
    element.focus();
  } else {
    element.focus({ preventScroll: true });
    element.scrollIntoView(__spreadValues2({ block: "nearest", inline: "nearest" }, options));
  }
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/OE2EFRVA.js
var import_react7 = __toESM(require_react(), 1);
var TagName2 = "div";
var isSafariBrowser = isSafari();
var alwaysFocusVisibleInputTypes = [
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
  "date",
  "month",
  "week",
  "time",
  "datetime",
  "datetime-local"
];
var safariFocusAncestorSymbol = Symbol("safariFocusAncestor");
function markSafariFocusAncestor(element, value) {
  if (!element) return;
  element[safariFocusAncestorSymbol] = value;
}
function isAlwaysFocusVisible(element) {
  const { tagName, readOnly, type } = element;
  if (tagName === "TEXTAREA" && !readOnly) return true;
  if (tagName === "SELECT" && !readOnly) return true;
  if (tagName === "INPUT" && !readOnly) {
    return alwaysFocusVisibleInputTypes.includes(type);
  }
  if (element.isContentEditable) return true;
  const role = element.getAttribute("role");
  if (role === "combobox" && element.dataset.name) {
    return true;
  }
  return false;
}
function getLabels(element) {
  if ("labels" in element) {
    return element.labels;
  }
  return null;
}
function isNativeCheckboxOrRadio(element) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "input" && element.type) {
    return element.type === "radio" || element.type === "checkbox";
  }
  return false;
}
function isNativeTabbable(tagName) {
  if (!tagName) return true;
  return tagName === "button" || tagName === "summary" || tagName === "input" || tagName === "select" || tagName === "textarea" || tagName === "a";
}
function supportsDisabledAttribute(tagName) {
  if (!tagName) return true;
  return tagName === "button" || tagName === "input" || tagName === "select" || tagName === "textarea";
}
function getTabIndex(focusable, trulyDisabled, nativeTabbable, supportsDisabled, tabIndexProp) {
  if (!focusable) {
    return tabIndexProp;
  }
  if (trulyDisabled) {
    if (nativeTabbable && !supportsDisabled) {
      return -1;
    }
    return;
  }
  if (nativeTabbable) {
    return tabIndexProp;
  }
  return tabIndexProp || 0;
}
function useDisableEvent(onEvent, disabled) {
  return useEvent((event) => {
    onEvent == null ? void 0 : onEvent(event);
    if (event.defaultPrevented) return;
    if (disabled) {
      event.stopPropagation();
      event.preventDefault();
    }
  });
}
var hasInstalledGlobalEventListeners2 = false;
var isKeyboardModality = true;
function onGlobalMouseDown(event) {
  const target = event.target;
  if (target && "hasAttribute" in target) {
    if (!target.hasAttribute("data-focus-visible")) {
      isKeyboardModality = false;
    }
  }
}
function onGlobalKeyDown(event) {
  if (event.metaKey) return;
  if (event.ctrlKey) return;
  if (event.altKey) return;
  isKeyboardModality = true;
}
var useFocusable = createHook(
  function useFocusable2(_a) {
    var _b = _a, {
      focusable = true,
      accessibleWhenDisabled,
      autoFocus,
      onFocusVisible
    } = _b, props = __objRest(_b, [
      "focusable",
      "accessibleWhenDisabled",
      "autoFocus",
      "onFocusVisible"
    ]);
    const ref = (0, import_react7.useRef)(null);
    (0, import_react7.useEffect)(() => {
      if (!focusable) return;
      if (hasInstalledGlobalEventListeners2) return;
      addGlobalEventListener("mousedown", onGlobalMouseDown, true);
      addGlobalEventListener("keydown", onGlobalKeyDown, true);
      hasInstalledGlobalEventListeners2 = true;
    }, [focusable]);
    if (isSafariBrowser) {
      (0, import_react7.useEffect)(() => {
        if (!focusable) return;
        const element = ref.current;
        if (!element) return;
        if (!isNativeCheckboxOrRadio(element)) return;
        const labels = getLabels(element);
        if (!labels) return;
        const onMouseUp = () => queueMicrotask(() => element.focus());
        for (const label of labels) {
          label.addEventListener("mouseup", onMouseUp);
        }
        return () => {
          for (const label of labels) {
            label.removeEventListener("mouseup", onMouseUp);
          }
        };
      }, [focusable]);
    }
    const disabled = focusable && disabledFromProps(props);
    const trulyDisabled = !!disabled && !accessibleWhenDisabled;
    const [focusVisible, setFocusVisible] = (0, import_react7.useState)(false);
    (0, import_react7.useEffect)(() => {
      if (!focusable) return;
      if (trulyDisabled && focusVisible) {
        setFocusVisible(false);
      }
    }, [focusable, trulyDisabled, focusVisible]);
    (0, import_react7.useEffect)(() => {
      if (!focusable) return;
      if (!focusVisible) return;
      const element = ref.current;
      if (!element) return;
      if (typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(() => {
        if (!isFocusable(element)) {
          setFocusVisible(false);
        }
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, [focusable, focusVisible]);
    const onKeyPressCapture = useDisableEvent(
      props.onKeyPressCapture,
      disabled
    );
    const onMouseDownCapture = useDisableEvent(
      props.onMouseDownCapture,
      disabled
    );
    const onClickCapture = useDisableEvent(props.onClickCapture, disabled);
    const onMouseDownProp = props.onMouseDown;
    const onMouseDown = useEvent((event) => {
      onMouseDownProp == null ? void 0 : onMouseDownProp(event);
      if (event.defaultPrevented) return;
      if (!focusable) return;
      const element = event.currentTarget;
      if (!isSafariBrowser) return;
      if (isPortalEvent(event)) return;
      if (!isButton(element) && !isNativeCheckboxOrRadio(element)) return;
      let receivedFocus = false;
      const onFocus = () => {
        receivedFocus = true;
      };
      const options = { capture: true, once: true };
      element.addEventListener("focusin", onFocus, options);
      const focusableContainer = getClosestFocusable(element.parentElement);
      markSafariFocusAncestor(focusableContainer, true);
      queueBeforeEvent(element, "mouseup", () => {
        element.removeEventListener("focusin", onFocus, true);
        markSafariFocusAncestor(focusableContainer, false);
        if (receivedFocus) return;
        focusIfNeeded(element);
      });
    });
    const handleFocusVisible = (event, currentTarget) => {
      if (currentTarget) {
        event.currentTarget = currentTarget;
      }
      if (!focusable) return;
      const element = event.currentTarget;
      if (!element) return;
      if (!hasFocus(element)) return;
      onFocusVisible == null ? void 0 : onFocusVisible(event);
      if (event.defaultPrevented) return;
      element.dataset.focusVisible = "true";
      setFocusVisible(true);
    };
    const onKeyDownCaptureProp = props.onKeyDownCapture;
    const onKeyDownCapture = useEvent((event) => {
      onKeyDownCaptureProp == null ? void 0 : onKeyDownCaptureProp(event);
      if (event.defaultPrevented) return;
      if (!focusable) return;
      if (focusVisible) return;
      if (event.metaKey) return;
      if (event.altKey) return;
      if (event.ctrlKey) return;
      if (!isSelfTarget(event)) return;
      const element = event.currentTarget;
      const applyFocusVisible = () => handleFocusVisible(event, element);
      queueBeforeEvent(element, "focusout", applyFocusVisible);
    });
    const onFocusCaptureProp = props.onFocusCapture;
    const onFocusCapture = useEvent((event) => {
      onFocusCaptureProp == null ? void 0 : onFocusCaptureProp(event);
      if (event.defaultPrevented) return;
      if (!focusable) return;
      if (!isSelfTarget(event)) {
        setFocusVisible(false);
        return;
      }
      const element = event.currentTarget;
      const applyFocusVisible = () => handleFocusVisible(event, element);
      if (isKeyboardModality || isAlwaysFocusVisible(event.target)) {
        queueBeforeEvent(event.target, "focusout", applyFocusVisible);
      } else {
        setFocusVisible(false);
      }
    });
    const onBlurProp = props.onBlur;
    const onBlur = useEvent((event) => {
      onBlurProp == null ? void 0 : onBlurProp(event);
      if (!focusable) return;
      if (!isFocusEventOutside(event)) return;
      event.currentTarget.removeAttribute("data-focus-visible");
      setFocusVisible(false);
    });
    const autoFocusOnShow = (0, import_react7.useContext)(FocusableContext);
    const autoFocusRef = useEvent((element) => {
      if (!focusable) return;
      if (!autoFocus) return;
      if (!element) return;
      if (!autoFocusOnShow) return;
      queueMicrotask(() => {
        if (hasFocus(element)) return;
        if (!isFocusable(element)) return;
        element.focus();
      });
    });
    const tagName = useTagName(ref);
    const nativeTabbable = focusable && isNativeTabbable(tagName);
    const supportsDisabled = focusable && supportsDisabledAttribute(tagName);
    const styleProp = props.style;
    const style = (0, import_react7.useMemo)(() => {
      if (trulyDisabled) {
        return __spreadValues({ pointerEvents: "none" }, styleProp);
      }
      return styleProp;
    }, [trulyDisabled, styleProp]);
    props = __spreadProps(__spreadValues({
      "data-focus-visible": focusable && focusVisible || void 0,
      "data-autofocus": autoFocus || void 0,
      "aria-disabled": disabled || void 0
    }, props), {
      ref: useMergeRefs(ref, autoFocusRef, props.ref),
      style,
      tabIndex: getTabIndex(
        focusable,
        trulyDisabled,
        nativeTabbable,
        supportsDisabled,
        props.tabIndex
      ),
      disabled: supportsDisabled && trulyDisabled ? true : void 0,
      // TODO: Test Focusable contentEditable.
      contentEditable: disabled ? void 0 : props.contentEditable,
      onKeyPressCapture,
      onClickCapture,
      onMouseDownCapture,
      onMouseDown,
      onKeyDownCapture,
      onFocusCapture,
      onBlur
    });
    return removeUndefinedValues(props);
  }
);
var Focusable = forwardRef22(function Focusable2(props) {
  const htmlProps = useFocusable(props);
  return createElement(TagName2, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/2W3RN7C5.js
var import_react8 = __toESM(require_react(), 1);
var TagName3 = "button";
function isNativeClick(event) {
  if (!event.isTrusted) return false;
  const element = event.currentTarget;
  if (event.key === "Enter") {
    return isButton(element) || element.tagName === "SUMMARY" || element.tagName === "A";
  }
  if (event.key === " ") {
    return isButton(element) || element.tagName === "SUMMARY" || element.tagName === "INPUT" || element.tagName === "SELECT";
  }
  return false;
}
var symbol = Symbol("command");
var useCommand = createHook(
  function useCommand2(_a) {
    var _b = _a, { clickOnEnter = true, clickOnSpace = true } = _b, props = __objRest(_b, ["clickOnEnter", "clickOnSpace"]);
    const ref = (0, import_react8.useRef)(null);
    const [isNativeButton, setIsNativeButton] = (0, import_react8.useState)(false);
    (0, import_react8.useEffect)(() => {
      if (!ref.current) return;
      setIsNativeButton(isButton(ref.current));
    }, []);
    const [active, setActive] = (0, import_react8.useState)(false);
    const activeRef = (0, import_react8.useRef)(false);
    const disabled = disabledFromProps(props);
    const [isDuplicate, metadataProps] = useMetadataProps(props, symbol, true);
    const onKeyDownProp = props.onKeyDown;
    const onKeyDown = useEvent((event) => {
      onKeyDownProp == null ? void 0 : onKeyDownProp(event);
      const element = event.currentTarget;
      if (event.defaultPrevented) return;
      if (isDuplicate) return;
      if (disabled) return;
      if (!isSelfTarget(event)) return;
      if (isTextField(element)) return;
      if (element.isContentEditable) return;
      const isEnter = clickOnEnter && event.key === "Enter";
      const isSpace = clickOnSpace && event.key === " ";
      const shouldPreventEnter = event.key === "Enter" && !clickOnEnter;
      const shouldPreventSpace = event.key === " " && !clickOnSpace;
      if (shouldPreventEnter || shouldPreventSpace) {
        event.preventDefault();
        return;
      }
      if (isEnter || isSpace) {
        const nativeClick = isNativeClick(event);
        if (isEnter) {
          if (!nativeClick) {
            event.preventDefault();
            const _a2 = event, { view } = _a2, eventInit = __objRest(_a2, ["view"]);
            const click = () => fireClickEvent(element, eventInit);
            if (isFirefox()) {
              queueBeforeEvent(element, "keyup", click);
            } else {
              queueMicrotask(click);
            }
          }
        } else if (isSpace) {
          activeRef.current = true;
          if (!nativeClick) {
            event.preventDefault();
            setActive(true);
          }
        }
      }
    });
    const onKeyUpProp = props.onKeyUp;
    const onKeyUp = useEvent((event) => {
      onKeyUpProp == null ? void 0 : onKeyUpProp(event);
      if (event.defaultPrevented) return;
      if (isDuplicate) return;
      if (disabled) return;
      if (event.metaKey) return;
      const isSpace = clickOnSpace && event.key === " ";
      if (activeRef.current && isSpace) {
        activeRef.current = false;
        if (!isNativeClick(event)) {
          event.preventDefault();
          setActive(false);
          const element = event.currentTarget;
          const _a2 = event, { view } = _a2, eventInit = __objRest(_a2, ["view"]);
          queueMicrotask(() => fireClickEvent(element, eventInit));
        }
      }
    });
    props = __spreadProps(__spreadValues(__spreadValues({
      "data-active": active || void 0,
      type: isNativeButton ? "button" : void 0
    }, metadataProps), props), {
      ref: useMergeRefs(ref, props.ref),
      onKeyDown,
      onKeyUp
    });
    props = useFocusable(props);
    return props;
  }
);
var Command = forwardRef22(function Command2(props) {
  const htmlProps = useCommand(props);
  return createElement(TagName3, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/EWA2WL6G.js
function getInternal(store, key) {
  const internals = store.__unstableInternals;
  invariant2(internals, "Invalid store");
  return internals[key];
}
function createStore(initialState, ...stores) {
  let state = initialState;
  let prevStateBatch = state;
  let lastUpdate = Symbol();
  let destroy = noop;
  const instances = /* @__PURE__ */ new Set();
  const updatedKeys = /* @__PURE__ */ new Set();
  const setups = /* @__PURE__ */ new Set();
  const listeners = /* @__PURE__ */ new Set();
  const batchListeners = /* @__PURE__ */ new Set();
  const disposables = /* @__PURE__ */ new WeakMap();
  const listenerKeys = /* @__PURE__ */ new WeakMap();
  const storeSetup = (callback) => {
    setups.add(callback);
    return () => setups.delete(callback);
  };
  const storeInit = () => {
    const initialized = instances.size;
    const instance = Symbol();
    instances.add(instance);
    const maybeDestroy = () => {
      instances.delete(instance);
      if (instances.size) return;
      destroy();
    };
    if (initialized) return maybeDestroy;
    const desyncs = getKeys(state).map(
      (key) => chain(
        ...stores.map((store) => {
          var _a;
          const storeState = (_a = store == null ? void 0 : store.getState) == null ? void 0 : _a.call(store);
          if (!storeState) return;
          if (!hasOwnProperty(storeState, key)) return;
          return sync(store, [key], (state2) => {
            setState(
              key,
              state2[key],
              // @ts-expect-error - Not public API. This is just to prevent
              // infinite loops.
              true
            );
          });
        })
      )
    );
    const teardowns = [];
    for (const setup2 of setups) {
      teardowns.push(setup2());
    }
    const cleanups = stores.map(init);
    destroy = chain(...desyncs, ...teardowns, ...cleanups);
    return maybeDestroy;
  };
  const sub = (keys, listener, set2 = listeners) => {
    set2.add(listener);
    listenerKeys.set(listener, keys);
    return () => {
      var _a;
      (_a = disposables.get(listener)) == null ? void 0 : _a();
      disposables.delete(listener);
      listenerKeys.delete(listener);
      set2.delete(listener);
    };
  };
  const storeSubscribe = (keys, listener) => sub(keys, listener);
  const storeSync = (keys, listener) => {
    disposables.set(listener, listener(state, state));
    return sub(keys, listener);
  };
  const storeBatch = (keys, listener) => {
    disposables.set(listener, listener(state, prevStateBatch));
    return sub(keys, listener, batchListeners);
  };
  const storePick = (keys) => createStore(pick(state, keys), finalStore);
  const storeOmit = (keys) => createStore(omit(state, keys), finalStore);
  const getState = () => state;
  const setState = (key, value, fromStores = false) => {
    var _a;
    if (!hasOwnProperty(state, key)) return;
    const nextValue = applyState(value, state[key]);
    if (nextValue === state[key]) return;
    if (!fromStores) {
      for (const store of stores) {
        (_a = store == null ? void 0 : store.setState) == null ? void 0 : _a.call(store, key, nextValue);
      }
    }
    const prevState = state;
    state = __spreadProps2(__spreadValues2({}, state), { [key]: nextValue });
    const thisUpdate = Symbol();
    lastUpdate = thisUpdate;
    updatedKeys.add(key);
    const run = (listener, prev, uKeys) => {
      var _a2;
      const keys = listenerKeys.get(listener);
      const updated = (k) => uKeys ? uKeys.has(k) : k === key;
      if (!keys || keys.some(updated)) {
        (_a2 = disposables.get(listener)) == null ? void 0 : _a2();
        disposables.set(listener, listener(state, prev));
      }
    };
    for (const listener of listeners) {
      run(listener, prevState);
    }
    queueMicrotask(() => {
      if (lastUpdate !== thisUpdate) return;
      const snapshot = state;
      for (const listener of batchListeners) {
        run(listener, prevStateBatch, updatedKeys);
      }
      prevStateBatch = snapshot;
      updatedKeys.clear();
    });
  };
  const finalStore = {
    getState,
    setState,
    __unstableInternals: {
      setup: storeSetup,
      init: storeInit,
      subscribe: storeSubscribe,
      sync: storeSync,
      batch: storeBatch,
      pick: storePick,
      omit: storeOmit
    }
  };
  return finalStore;
}
function setup(store, ...args) {
  if (!store) return;
  return getInternal(store, "setup")(...args);
}
function init(store, ...args) {
  if (!store) return;
  return getInternal(store, "init")(...args);
}
function subscribe(store, ...args) {
  if (!store) return;
  return getInternal(store, "subscribe")(...args);
}
function sync(store, ...args) {
  if (!store) return;
  return getInternal(store, "sync")(...args);
}
function batch(store, ...args) {
  if (!store) return;
  return getInternal(store, "batch")(...args);
}
function omit2(store, ...args) {
  if (!store) return;
  return getInternal(store, "omit")(...args);
}
function pick2(store, ...args) {
  if (!store) return;
  return getInternal(store, "pick")(...args);
}
function mergeStore(...stores) {
  var _a;
  const initialState = {};
  for (const store2 of stores) {
    const nextState = (_a = store2 == null ? void 0 : store2.getState) == null ? void 0 : _a.call(store2);
    if (nextState) {
      Object.assign(initialState, nextState);
    }
  }
  const store = createStore(initialState, ...stores);
  return Object.assign({}, ...stores, store);
}
function throwOnConflictingProps(props, store) {
  if (false) return;
  if (!store) return;
  const defaultKeys = Object.entries(props).filter(([key, value]) => key.startsWith("default") && value !== void 0).map(([key]) => {
    var _a;
    const stateKey = key.replace("default", "");
    return `${((_a = stateKey[0]) == null ? void 0 : _a.toLowerCase()) || ""}${stateKey.slice(1)}`;
  });
  if (!defaultKeys.length) return;
  const storeState = store.getState();
  const conflictingProps = defaultKeys.filter(
    (key) => hasOwnProperty(storeState, key)
  );
  if (!conflictingProps.length) return;
  throw new Error(
    `Passing a store prop in conjunction with a default state is not supported.

const store = useSelectStore();
<SelectProvider store={store} defaultValue="Apple" />
                ^             ^

Instead, pass the default state to the topmost store:

const store = useSelectStore({ defaultValue: "Apple" });
<SelectProvider store={store} />

See https://github.com/ariakit/ariakit/pull/2745 for more details.

If there's a particular need for this, please submit a feature request at https://github.com/ariakit/ariakit
`
  );
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/RTNCFSKZ.js
var React8 = __toESM(require_react(), 1);
var import_shim = __toESM(require_shim(), 1);
var { useSyncExternalStore } = import_shim.default;
var noopSubscribe = () => () => {
};
function useStoreState(store, keyOrSelector = identity) {
  const storeSubscribe = React8.useCallback(
    (callback) => {
      if (!store) return noopSubscribe();
      return subscribe(store, null, callback);
    },
    [store]
  );
  const getSnapshot = () => {
    const key = typeof keyOrSelector === "string" ? keyOrSelector : null;
    const selector2 = typeof keyOrSelector === "function" ? keyOrSelector : null;
    const state = store == null ? void 0 : store.getState();
    if (selector2) return selector2(state);
    if (!state) return;
    if (!key) return;
    if (!hasOwnProperty(state, key)) return;
    return state[key];
  };
  return useSyncExternalStore(storeSubscribe, getSnapshot, getSnapshot);
}
function useStoreStateObject(store, object) {
  const objRef = React8.useRef(
    {}
  );
  const storeSubscribe = React8.useCallback(
    (callback) => {
      if (!store) return noopSubscribe();
      return subscribe(store, null, callback);
    },
    [store]
  );
  const getSnapshot = () => {
    const state = store == null ? void 0 : store.getState();
    let updated = false;
    const obj = objRef.current;
    for (const prop in object) {
      const keyOrSelector = object[prop];
      if (typeof keyOrSelector === "function") {
        const value = keyOrSelector(state);
        if (value !== obj[prop]) {
          obj[prop] = value;
          updated = true;
        }
      }
      if (typeof keyOrSelector === "string") {
        if (!state) continue;
        if (!hasOwnProperty(state, keyOrSelector)) continue;
        const value = state[keyOrSelector];
        if (value !== obj[prop]) {
          obj[prop] = value;
          updated = true;
        }
      }
    }
    if (updated) {
      objRef.current = __spreadValues({}, obj);
    }
    return objRef.current;
  };
  return useSyncExternalStore(storeSubscribe, getSnapshot, getSnapshot);
}
function useStoreProps(store, props, key, setKey) {
  const value = hasOwnProperty(props, key) ? props[key] : void 0;
  const setValue = setKey ? props[setKey] : void 0;
  const propsRef = useLiveRef({ value, setValue });
  useSafeLayoutEffect(() => {
    return sync(store, [key], (state, prev) => {
      const { value: value2, setValue: setValue2 } = propsRef.current;
      if (!setValue2) return;
      if (state[key] === prev[key]) return;
      if (state[key] === value2) return;
      setValue2(state[key]);
    });
  }, [store, key]);
  useSafeLayoutEffect(() => {
    if (value === void 0) return;
    store.setState(key, value);
    return batch(store, [key], () => {
      if (value === void 0) return;
      store.setState(key, value);
    });
  });
}
function useStore2(createStore2, props) {
  const [store, setStore] = React8.useState(() => createStore2(props));
  useSafeLayoutEffect(() => init(store), [store]);
  const useState210 = React8.useCallback(
    (keyOrSelector) => useStoreState(store, keyOrSelector),
    [store]
  );
  const memoizedStore = React8.useMemo(
    () => __spreadProps(__spreadValues({}, store), { useState: useState210 }),
    [store, useState210]
  );
  const updateStore = useEvent(() => {
    setStore((store2) => createStore2(__spreadValues(__spreadValues({}, props), store2.getState())));
  });
  return [memoizedStore, updateStore];
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/SBSPVDDI.js
var import_react9 = __toESM(require_react(), 1);
var import_jsx_runtime47 = __toESM(require_jsx_runtime(), 1);
var TagName4 = "button";
function isEditableElement(element) {
  if (isTextbox(element)) return true;
  return element.tagName === "INPUT" && !isButton(element);
}
function getNextPageOffset(scrollingElement, pageUp = false) {
  const height = scrollingElement.clientHeight;
  const { top } = scrollingElement.getBoundingClientRect();
  const pageSize = Math.max(height * 0.875, height - 40) * 1.5;
  const pageOffset = pageUp ? height - pageSize + top : pageSize + top;
  if (scrollingElement.tagName === "HTML") {
    return pageOffset + scrollingElement.scrollTop;
  }
  return pageOffset;
}
function getItemOffset(itemElement, pageUp = false) {
  const { top } = itemElement.getBoundingClientRect();
  if (pageUp) {
    return top + itemElement.clientHeight;
  }
  return top;
}
function findNextPageItemId(element, store, next, pageUp = false) {
  var _a;
  if (!store) return;
  if (!next) return;
  const { renderedItems } = store.getState();
  const scrollingElement = getScrollingElement(element);
  if (!scrollingElement) return;
  const nextPageOffset = getNextPageOffset(scrollingElement, pageUp);
  let id;
  let prevDifference;
  for (let i2 = 0; i2 < renderedItems.length; i2 += 1) {
    const previousId = id;
    id = next(i2);
    if (!id) break;
    if (id === previousId) continue;
    const itemElement = (_a = getEnabledItem(store, id)) == null ? void 0 : _a.element;
    if (!itemElement) continue;
    const itemOffset = getItemOffset(itemElement, pageUp);
    const difference = itemOffset - nextPageOffset;
    const absDifference = Math.abs(difference);
    if (pageUp && difference <= 0 || !pageUp && difference >= 0) {
      if (prevDifference !== void 0 && prevDifference < absDifference) {
        id = previousId;
      }
      break;
    }
    prevDifference = absDifference;
  }
  return id;
}
function targetIsAnotherItem(event, store) {
  if (isSelfTarget(event)) return false;
  return isItem(store, event.target);
}
var useCompositeItem = createHook(
  function useCompositeItem2(_a) {
    var _b = _a, {
      store,
      rowId: rowIdProp,
      preventScrollOnKeyDown = false,
      moveOnKeyPress = true,
      tabbable = false,
      getItem: getItemProp,
      "aria-setsize": ariaSetSizeProp,
      "aria-posinset": ariaPosInSetProp
    } = _b, props = __objRest(_b, [
      "store",
      "rowId",
      "preventScrollOnKeyDown",
      "moveOnKeyPress",
      "tabbable",
      "getItem",
      "aria-setsize",
      "aria-posinset"
    ]);
    const context = useCompositeContext();
    store = store || context;
    const id = useId2(props.id);
    const ref = (0, import_react9.useRef)(null);
    const row = (0, import_react9.useContext)(CompositeRowContext);
    const disabled = disabledFromProps(props);
    const trulyDisabled = disabled && !props.accessibleWhenDisabled;
    const {
      rowId,
      baseElement,
      isActiveItem,
      ariaSetSize,
      ariaPosInSet,
      isTabbable
    } = useStoreStateObject(store, {
      rowId(state) {
        if (rowIdProp) return rowIdProp;
        if (!state) return;
        if (!(row == null ? void 0 : row.baseElement)) return;
        if (row.baseElement !== state.baseElement) return;
        return row.id;
      },
      baseElement(state) {
        return (state == null ? void 0 : state.baseElement) || void 0;
      },
      isActiveItem(state) {
        return !!state && state.activeId === id;
      },
      ariaSetSize(state) {
        if (ariaSetSizeProp != null) return ariaSetSizeProp;
        if (!state) return;
        if (!(row == null ? void 0 : row.ariaSetSize)) return;
        if (row.baseElement !== state.baseElement) return;
        return row.ariaSetSize;
      },
      ariaPosInSet(state) {
        if (ariaPosInSetProp != null) return ariaPosInSetProp;
        if (!state) return;
        if (!(row == null ? void 0 : row.ariaPosInSet)) return;
        if (row.baseElement !== state.baseElement) return;
        const itemsInRow = state.renderedItems.filter(
          (item) => item.rowId === rowId
        );
        return row.ariaPosInSet + itemsInRow.findIndex((item) => item.id === id);
      },
      isTabbable(state) {
        if (!(state == null ? void 0 : state.renderedItems.length)) return true;
        if (state.virtualFocus) return false;
        if (tabbable) return true;
        if (state.activeId === null) return false;
        const item = store == null ? void 0 : store.item(state.activeId);
        if (item == null ? void 0 : item.disabled) return true;
        if (!(item == null ? void 0 : item.element)) return true;
        return state.activeId === id;
      }
    });
    const getItem = (0, import_react9.useCallback)(
      (item) => {
        var _a2;
        const nextItem = __spreadProps(__spreadValues({}, item), {
          id: id || item.id,
          rowId,
          disabled: !!trulyDisabled,
          children: (_a2 = item.element) == null ? void 0 : _a2.textContent
        });
        if (getItemProp) {
          return getItemProp(nextItem);
        }
        return nextItem;
      },
      [id, rowId, trulyDisabled, getItemProp]
    );
    const onFocusProp = props.onFocus;
    const hasFocusedComposite = (0, import_react9.useRef)(false);
    const onFocus = useEvent((event) => {
      onFocusProp == null ? void 0 : onFocusProp(event);
      if (event.defaultPrevented) return;
      if (isPortalEvent(event)) return;
      if (!id) return;
      if (!store) return;
      if (targetIsAnotherItem(event, store)) return;
      const { virtualFocus, baseElement: baseElement2 } = store.getState();
      store.setActiveId(id);
      if (isTextbox(event.currentTarget)) {
        selectTextField(event.currentTarget);
      }
      if (!virtualFocus) return;
      if (!isSelfTarget(event)) return;
      if (isEditableElement(event.currentTarget)) return;
      if (!(baseElement2 == null ? void 0 : baseElement2.isConnected)) return;
      if (isSafari() && event.currentTarget.hasAttribute("data-autofocus")) {
        event.currentTarget.scrollIntoView({
          block: "nearest",
          inline: "nearest"
        });
      }
      hasFocusedComposite.current = true;
      const fromComposite = event.relatedTarget === baseElement2 || isItem(store, event.relatedTarget);
      if (fromComposite) {
        focusSilently(baseElement2);
      } else {
        baseElement2.focus();
      }
    });
    const onBlurCaptureProp = props.onBlurCapture;
    const onBlurCapture = useEvent((event) => {
      onBlurCaptureProp == null ? void 0 : onBlurCaptureProp(event);
      if (event.defaultPrevented) return;
      const state = store == null ? void 0 : store.getState();
      if ((state == null ? void 0 : state.virtualFocus) && hasFocusedComposite.current) {
        hasFocusedComposite.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    });
    const onKeyDownProp = props.onKeyDown;
    const preventScrollOnKeyDownProp = useBooleanEvent(preventScrollOnKeyDown);
    const moveOnKeyPressProp = useBooleanEvent(moveOnKeyPress);
    const onKeyDown = useEvent((event) => {
      onKeyDownProp == null ? void 0 : onKeyDownProp(event);
      if (event.defaultPrevented) return;
      if (!isSelfTarget(event)) return;
      if (!store) return;
      const { currentTarget } = event;
      const state = store.getState();
      const item = store.item(id);
      const isGrid2 = !!(item == null ? void 0 : item.rowId);
      const isVertical = state.orientation !== "horizontal";
      const isHorizontal = state.orientation !== "vertical";
      const canHomeEnd = () => {
        if (isGrid2) return true;
        if (isHorizontal) return true;
        if (!state.baseElement) return true;
        if (!isTextField(state.baseElement)) return true;
        return false;
      };
      const keyMap = {
        ArrowUp: (isGrid2 || isVertical) && store.up,
        ArrowRight: (isGrid2 || isHorizontal) && store.next,
        ArrowDown: (isGrid2 || isVertical) && store.down,
        ArrowLeft: (isGrid2 || isHorizontal) && store.previous,
        Home: () => {
          if (!canHomeEnd()) return;
          if (!isGrid2 || event.ctrlKey) {
            return store == null ? void 0 : store.first();
          }
          return store == null ? void 0 : store.previous(-1);
        },
        End: () => {
          if (!canHomeEnd()) return;
          if (!isGrid2 || event.ctrlKey) {
            return store == null ? void 0 : store.last();
          }
          return store == null ? void 0 : store.next(-1);
        },
        PageUp: () => {
          return findNextPageItemId(currentTarget, store, store == null ? void 0 : store.up, true);
        },
        PageDown: () => {
          return findNextPageItemId(currentTarget, store, store == null ? void 0 : store.down);
        }
      };
      const action = keyMap[event.key];
      if (action) {
        if (isTextbox(currentTarget)) {
          const selection = getTextboxSelection(currentTarget);
          const isLeft = isHorizontal && event.key === "ArrowLeft";
          const isRight = isHorizontal && event.key === "ArrowRight";
          const isUp = isVertical && event.key === "ArrowUp";
          const isDown = isVertical && event.key === "ArrowDown";
          if (isRight || isDown) {
            const { length: valueLength } = getTextboxValue(currentTarget);
            if (selection.end !== valueLength) return;
          } else if ((isLeft || isUp) && selection.start !== 0) return;
        }
        const nextId = action();
        if (preventScrollOnKeyDownProp(event) || nextId !== void 0) {
          if (!moveOnKeyPressProp(event)) return;
          event.preventDefault();
          store.move(nextId);
        }
      }
    });
    const providerValue = (0, import_react9.useMemo)(
      () => ({ id, baseElement }),
      [id, baseElement]
    );
    props = useWrapElement(
      props,
      (element) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(CompositeItemContext.Provider, { value: providerValue, children: element }),
      [providerValue]
    );
    props = __spreadProps(__spreadValues({
      id,
      "data-active-item": isActiveItem || void 0
    }, props), {
      ref: useMergeRefs(ref, props.ref),
      tabIndex: isTabbable ? props.tabIndex : -1,
      onFocus,
      onBlurCapture,
      onKeyDown
    });
    props = useCommand(props);
    props = useCollectionItem(__spreadProps(__spreadValues({
      store
    }, props), {
      getItem,
      shouldRegisterItem: id ? props.shouldRegisterItem : false
    }));
    return removeUndefinedValues(__spreadProps(__spreadValues({}, props), {
      "aria-setsize": ariaSetSize,
      "aria-posinset": ariaPosInSet
    }));
  }
);
var CompositeItem = memo22(
  forwardRef22(function CompositeItem2(props) {
    const htmlProps = useCompositeItem(props);
    return createElement(TagName4, htmlProps);
  })
);

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/7PRQYBBV.js
function toArray(arg) {
  if (Array.isArray(arg)) {
    return arg;
  }
  return typeof arg !== "undefined" ? [arg] : [];
}
function flatten2DArray(array) {
  const flattened = [];
  for (const row of array) {
    flattened.push(...row);
  }
  return flattened;
}
function reverseArray(array) {
  return array.slice().reverse();
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/NSTBQJLB.js
var import_react10 = __toESM(require_react(), 1);
var import_jsx_runtime48 = __toESM(require_jsx_runtime(), 1);
var TagName5 = "div";
function isGrid(items) {
  return items.some((item) => !!item.rowId);
}
function isPrintableKey(event) {
  const target = event.target;
  if (target && !isTextField(target)) return false;
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey;
}
function isModifierKey(event) {
  return event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta";
}
function useKeyboardEventProxy(store, onKeyboardEvent, previousElementRef) {
  return useEvent((event) => {
    var _a;
    onKeyboardEvent == null ? void 0 : onKeyboardEvent(event);
    if (event.defaultPrevented) return;
    if (event.isPropagationStopped()) return;
    if (!isSelfTarget(event)) return;
    if (isModifierKey(event)) return;
    if (isPrintableKey(event)) return;
    const state = store.getState();
    const activeElement2 = (_a = getEnabledItem(store, state.activeId)) == null ? void 0 : _a.element;
    if (!activeElement2) return;
    const _b = event, { view } = _b, eventInit = __objRest(_b, ["view"]);
    const previousElement = previousElementRef == null ? void 0 : previousElementRef.current;
    if (activeElement2 !== previousElement) {
      activeElement2.focus();
    }
    if (!fireKeyboardEvent(activeElement2, event.type, eventInit)) {
      event.preventDefault();
    }
    if (event.currentTarget.contains(activeElement2)) {
      event.stopPropagation();
    }
  });
}
function findFirstEnabledItemInTheLastRow(items) {
  return findFirstEnabledItem(
    flatten2DArray(reverseArray(groupItemsByRows(items)))
  );
}
function useScheduleFocus(store) {
  const [scheduled, setScheduled] = (0, import_react10.useState)(false);
  const schedule = (0, import_react10.useCallback)(() => setScheduled(true), []);
  const activeItem = store.useState(
    (state) => getEnabledItem(store, state.activeId)
  );
  (0, import_react10.useEffect)(() => {
    const activeElement2 = activeItem == null ? void 0 : activeItem.element;
    if (!scheduled) return;
    if (!activeElement2) return;
    setScheduled(false);
    activeElement2.focus({ preventScroll: true });
  }, [activeItem, scheduled]);
  return schedule;
}
var useComposite = createHook(
  function useComposite2(_a) {
    var _b = _a, {
      store,
      composite = true,
      focusOnMove = composite,
      moveOnKeyPress = true
    } = _b, props = __objRest(_b, [
      "store",
      "composite",
      "focusOnMove",
      "moveOnKeyPress"
    ]);
    const context = useCompositeProviderContext();
    store = store || context;
    invariant2(
      store,
      "Composite must receive a `store` prop or be wrapped in a CompositeProvider component."
    );
    const ref = (0, import_react10.useRef)(null);
    const previousElementRef = (0, import_react10.useRef)(null);
    const scheduleFocus = useScheduleFocus(store);
    const moves = store.useState("moves");
    const [, setBaseElement] = useTransactionState(
      composite ? store.setBaseElement : null
    );
    (0, import_react10.useEffect)(() => {
      var _a2;
      if (!store) return;
      if (!moves) return;
      if (!composite) return;
      if (!focusOnMove) return;
      const { activeId: activeId2 } = store.getState();
      const itemElement = (_a2 = getEnabledItem(store, activeId2)) == null ? void 0 : _a2.element;
      if (!itemElement) return;
      focusIntoView(itemElement);
    }, [store, moves, composite, focusOnMove]);
    useSafeLayoutEffect(() => {
      if (!store) return;
      if (!moves) return;
      if (!composite) return;
      const { baseElement, activeId: activeId2 } = store.getState();
      const isSelfAcive = activeId2 === null;
      if (!isSelfAcive) return;
      if (!baseElement) return;
      const previousElement = previousElementRef.current;
      previousElementRef.current = null;
      if (previousElement) {
        fireBlurEvent(previousElement, { relatedTarget: baseElement });
      }
      if (!hasFocus(baseElement)) {
        baseElement.focus();
      }
    }, [store, moves, composite]);
    const activeId = store.useState("activeId");
    const virtualFocus = store.useState("virtualFocus");
    useSafeLayoutEffect(() => {
      var _a2;
      if (!store) return;
      if (!composite) return;
      if (!virtualFocus) return;
      const previousElement = previousElementRef.current;
      previousElementRef.current = null;
      if (!previousElement) return;
      const activeElement2 = (_a2 = getEnabledItem(store, activeId)) == null ? void 0 : _a2.element;
      const relatedTarget = activeElement2 || getActiveElement(previousElement);
      if (relatedTarget === previousElement) return;
      fireBlurEvent(previousElement, { relatedTarget });
    }, [store, activeId, virtualFocus, composite]);
    const onKeyDownCapture = useKeyboardEventProxy(
      store,
      props.onKeyDownCapture,
      previousElementRef
    );
    const onKeyUpCapture = useKeyboardEventProxy(
      store,
      props.onKeyUpCapture,
      previousElementRef
    );
    const onFocusCaptureProp = props.onFocusCapture;
    const onFocusCapture = useEvent((event) => {
      onFocusCaptureProp == null ? void 0 : onFocusCaptureProp(event);
      if (event.defaultPrevented) return;
      if (!store) return;
      const { virtualFocus: virtualFocus2 } = store.getState();
      if (!virtualFocus2) return;
      const previousActiveElement = event.relatedTarget;
      const isSilentlyFocused = silentlyFocused(event.currentTarget);
      if (isSelfTarget(event) && isSilentlyFocused) {
        event.stopPropagation();
        previousElementRef.current = previousActiveElement;
      }
    });
    const onFocusProp = props.onFocus;
    const onFocus = useEvent((event) => {
      onFocusProp == null ? void 0 : onFocusProp(event);
      if (event.defaultPrevented) return;
      if (!composite) return;
      if (!store) return;
      const { relatedTarget } = event;
      const { virtualFocus: virtualFocus2 } = store.getState();
      if (virtualFocus2) {
        if (isSelfTarget(event) && !isItem(store, relatedTarget)) {
          queueMicrotask(scheduleFocus);
        }
      } else if (isSelfTarget(event)) {
        store.setActiveId(null);
      }
    });
    const onBlurCaptureProp = props.onBlurCapture;
    const onBlurCapture = useEvent((event) => {
      var _a2;
      onBlurCaptureProp == null ? void 0 : onBlurCaptureProp(event);
      if (event.defaultPrevented) return;
      if (!store) return;
      const { virtualFocus: virtualFocus2, activeId: activeId2 } = store.getState();
      if (!virtualFocus2) return;
      const activeElement2 = (_a2 = getEnabledItem(store, activeId2)) == null ? void 0 : _a2.element;
      const nextActiveElement = event.relatedTarget;
      const nextActiveElementIsItem = isItem(store, nextActiveElement);
      const previousElement = previousElementRef.current;
      previousElementRef.current = null;
      if (isSelfTarget(event) && nextActiveElementIsItem) {
        if (nextActiveElement === activeElement2) {
          if (previousElement && previousElement !== nextActiveElement) {
            fireBlurEvent(previousElement, event);
          }
        } else if (activeElement2) {
          fireBlurEvent(activeElement2, event);
        } else if (previousElement) {
          fireBlurEvent(previousElement, event);
        }
        event.stopPropagation();
      } else {
        const targetIsItem = isItem(store, event.target);
        if (!targetIsItem && activeElement2) {
          fireBlurEvent(activeElement2, event);
        }
      }
    });
    const onKeyDownProp = props.onKeyDown;
    const moveOnKeyPressProp = useBooleanEvent(moveOnKeyPress);
    const onKeyDown = useEvent((event) => {
      var _a2;
      onKeyDownProp == null ? void 0 : onKeyDownProp(event);
      if (event.nativeEvent.isComposing) return;
      if (event.defaultPrevented) return;
      if (!store) return;
      if (!isSelfTarget(event)) return;
      const { orientation, renderedItems, activeId: activeId2 } = store.getState();
      const activeItem = getEnabledItem(store, activeId2);
      if ((_a2 = activeItem == null ? void 0 : activeItem.element) == null ? void 0 : _a2.isConnected) return;
      const isVertical = orientation !== "horizontal";
      const isHorizontal = orientation !== "vertical";
      const grid = isGrid(renderedItems);
      const isHorizontalKey = event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End";
      if (isHorizontalKey && isTextField(event.currentTarget)) return;
      const up = () => {
        if (grid) {
          const item = findFirstEnabledItemInTheLastRow(renderedItems);
          return item == null ? void 0 : item.id;
        }
        return store == null ? void 0 : store.last();
      };
      const keyMap = {
        ArrowUp: (grid || isVertical) && up,
        ArrowRight: (grid || isHorizontal) && store.first,
        ArrowDown: (grid || isVertical) && store.first,
        ArrowLeft: (grid || isHorizontal) && store.last,
        Home: store.first,
        End: store.last,
        PageUp: store.first,
        PageDown: store.last
      };
      const action = keyMap[event.key];
      if (action) {
        const id = action();
        if (id !== void 0) {
          if (!moveOnKeyPressProp(event)) return;
          event.preventDefault();
          store.move(id);
        }
      }
    });
    props = useWrapElement(
      props,
      (element) => /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(CompositeContextProvider, { value: store, children: element }),
      [store]
    );
    const activeDescendant = store.useState((state) => {
      var _a2;
      if (!store) return;
      if (!composite) return;
      if (!state.virtualFocus) return;
      return (_a2 = getEnabledItem(store, state.activeId)) == null ? void 0 : _a2.id;
    });
    props = __spreadProps(__spreadValues({
      "aria-activedescendant": activeDescendant
    }, props), {
      ref: useMergeRefs(ref, setBaseElement, props.ref),
      onKeyDownCapture,
      onKeyUpCapture,
      onFocusCapture,
      onFocus,
      onBlurCapture,
      onKeyDown
    });
    const focusable = store.useState(
      (state) => composite && (state.virtualFocus || state.activeId === null)
    );
    props = useFocusable(__spreadValues({ focusable }, props));
    return props;
  }
);
var Composite3 = forwardRef22(function Composite22(props) {
  const htmlProps = useComposite(props);
  return createElement(TagName5, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/ABN76PSX.js
var ctx3 = createStoreContext();
var useDisclosureContext = ctx3.useContext;
var useDisclosureScopedContext = ctx3.useScopedContext;
var useDisclosureProviderContext = ctx3.useProviderContext;
var DisclosureContextProvider = ctx3.ContextProvider;
var DisclosureScopedContextProvider = ctx3.ScopedContextProvider;

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/T2AZQXQU.js
var import_react11 = __toESM(require_react(), 1);
var ctx4 = createStoreContext(
  [DisclosureContextProvider],
  [DisclosureScopedContextProvider]
);
var useDialogContext = ctx4.useContext;
var useDialogScopedContext = ctx4.useScopedContext;
var useDialogProviderContext = ctx4.useProviderContext;
var DialogContextProvider = ctx4.ContextProvider;
var DialogScopedContextProvider = ctx4.ScopedContextProvider;
var DialogHeadingContext = (0, import_react11.createContext)(void 0);
var DialogDescriptionContext = (0, import_react11.createContext)(void 0);

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/K4R5DNTX.js
var import_react12 = __toESM(require_react(), 1);
var import_react_dom = __toESM(require_react_dom(), 1);
var import_jsx_runtime49 = __toESM(require_jsx_runtime(), 1);
var TagName6 = "div";
function afterTimeout(timeoutMs, cb) {
  const timeoutId = setTimeout(cb, timeoutMs);
  return () => clearTimeout(timeoutId);
}
function afterPaint2(cb) {
  let raf = requestAnimationFrame(() => {
    raf = requestAnimationFrame(cb);
  });
  return () => cancelAnimationFrame(raf);
}
function parseCSSTime(...times) {
  return times.join(", ").split(", ").reduce((longestTime, currentTimeString) => {
    const multiplier = currentTimeString.endsWith("ms") ? 1 : 1e3;
    const currentTime = Number.parseFloat(currentTimeString || "0s") * multiplier;
    if (currentTime > longestTime) return currentTime;
    return longestTime;
  }, 0);
}
function isHidden(mounted, hidden, alwaysVisible) {
  return !alwaysVisible && hidden !== false && (!mounted || !!hidden);
}
var useDisclosureContent = createHook(function useDisclosureContent2(_a) {
  var _b = _a, { store, alwaysVisible } = _b, props = __objRest(_b, ["store", "alwaysVisible"]);
  const context = useDisclosureProviderContext();
  store = store || context;
  invariant2(
    store,
    "DisclosureContent must receive a `store` prop or be wrapped in a DisclosureProvider component."
  );
  const ref = (0, import_react12.useRef)(null);
  const id = useId2(props.id);
  const [transition, setTransition] = (0, import_react12.useState)(null);
  const open = store.useState("open");
  const mounted = store.useState("mounted");
  const animated = store.useState("animated");
  const contentElement = store.useState("contentElement");
  const otherElement = useStoreState(store.disclosure, "contentElement");
  useSafeLayoutEffect(() => {
    if (!ref.current) return;
    store == null ? void 0 : store.setContentElement(ref.current);
  }, [store]);
  useSafeLayoutEffect(() => {
    let previousAnimated;
    store == null ? void 0 : store.setState("animated", (animated2) => {
      previousAnimated = animated2;
      return true;
    });
    return () => {
      if (previousAnimated === void 0) return;
      store == null ? void 0 : store.setState("animated", previousAnimated);
    };
  }, [store]);
  useSafeLayoutEffect(() => {
    if (!animated) return;
    if (!(contentElement == null ? void 0 : contentElement.isConnected)) {
      setTransition(null);
      return;
    }
    return afterPaint2(() => {
      setTransition(open ? "enter" : mounted ? "leave" : null);
    });
  }, [animated, contentElement, open, mounted]);
  useSafeLayoutEffect(() => {
    if (!store) return;
    if (!animated) return;
    if (!transition) return;
    if (!contentElement) return;
    const stopAnimation = () => store == null ? void 0 : store.setState("animating", false);
    const stopAnimationSync = () => (0, import_react_dom.flushSync)(stopAnimation);
    if (transition === "leave" && open) return;
    if (transition === "enter" && !open) return;
    if (typeof animated === "number") {
      const timeout2 = animated;
      return afterTimeout(timeout2, stopAnimationSync);
    }
    const {
      transitionDuration,
      animationDuration,
      transitionDelay,
      animationDelay
    } = getComputedStyle(contentElement);
    const {
      transitionDuration: transitionDuration2 = "0",
      animationDuration: animationDuration2 = "0",
      transitionDelay: transitionDelay2 = "0",
      animationDelay: animationDelay2 = "0"
    } = otherElement ? getComputedStyle(otherElement) : {};
    const delay = parseCSSTime(
      transitionDelay,
      animationDelay,
      transitionDelay2,
      animationDelay2
    );
    const duration = parseCSSTime(
      transitionDuration,
      animationDuration,
      transitionDuration2,
      animationDuration2
    );
    const timeout = delay + duration;
    if (!timeout) {
      if (transition === "enter") {
        store.setState("animated", false);
      }
      stopAnimation();
      return;
    }
    const frameRate = 1e3 / 60;
    const maxTimeout = Math.max(timeout - frameRate, 0);
    return afterTimeout(maxTimeout, stopAnimationSync);
  }, [store, animated, contentElement, otherElement, open, transition]);
  props = useWrapElement(
    props,
    (element) => /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(DialogScopedContextProvider, { value: store, children: element }),
    [store]
  );
  const hidden = isHidden(mounted, props.hidden, alwaysVisible);
  const styleProp = props.style;
  const style = (0, import_react12.useMemo)(() => {
    if (hidden) {
      return __spreadProps(__spreadValues({}, styleProp), { display: "none" });
    }
    return styleProp;
  }, [hidden, styleProp]);
  props = __spreadProps(__spreadValues({
    id,
    "data-open": open || void 0,
    "data-enter": transition === "enter" || void 0,
    "data-leave": transition === "leave" || void 0,
    hidden
  }, props), {
    ref: useMergeRefs(id ? store.setContentElement : null, ref, props.ref),
    style
  });
  return removeUndefinedValues(props);
});
var DisclosureContentImpl = forwardRef22(function DisclosureContentImpl2(props) {
  const htmlProps = useDisclosureContent(props);
  return createElement(TagName6, htmlProps);
});
var DisclosureContent = forwardRef22(function DisclosureContent2(_a) {
  var _b = _a, {
    unmountOnHide
  } = _b, props = __objRest(_b, [
    "unmountOnHide"
  ]);
  const context = useDisclosureProviderContext();
  const store = props.store || context;
  const mounted = useStoreState(
    store,
    (state) => !unmountOnHide || (state == null ? void 0 : state.mounted)
  );
  if (mounted === false) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(DisclosureContentImpl, __spreadValues({}, props));
});

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/43IPP2F4.js
function createDisclosureStore(props = {}) {
  const store = mergeStore(
    props.store,
    omit2(props.disclosure, ["contentElement", "disclosureElement"])
  );
  throwOnConflictingProps(props, store);
  const syncState = store == null ? void 0 : store.getState();
  const open = defaultValue(
    props.open,
    syncState == null ? void 0 : syncState.open,
    props.defaultOpen,
    false
  );
  const animated = defaultValue(props.animated, syncState == null ? void 0 : syncState.animated, false);
  const initialState = {
    open,
    animated,
    animating: !!animated && open,
    mounted: open,
    contentElement: defaultValue(syncState == null ? void 0 : syncState.contentElement, null),
    disclosureElement: defaultValue(syncState == null ? void 0 : syncState.disclosureElement, null)
  };
  const disclosure = createStore(initialState, store);
  setup(
    disclosure,
    () => sync(disclosure, ["animated", "animating"], (state) => {
      if (state.animated) return;
      disclosure.setState("animating", false);
    })
  );
  setup(
    disclosure,
    () => subscribe(disclosure, ["open"], () => {
      if (!disclosure.getState().animated) return;
      disclosure.setState("animating", true);
    })
  );
  setup(
    disclosure,
    () => sync(disclosure, ["open", "animating"], (state) => {
      disclosure.setState("mounted", state.open || state.animating);
    })
  );
  return __spreadProps2(__spreadValues2({}, disclosure), {
    disclosure: props.disclosure,
    setOpen: (value) => disclosure.setState("open", value),
    show: () => disclosure.setState("open", true),
    hide: () => disclosure.setState("open", false),
    toggle: () => disclosure.setState("open", (open2) => !open2),
    stopAnimation: () => disclosure.setState("animating", false),
    setContentElement: (value) => disclosure.setState("contentElement", value),
    setDisclosureElement: (value) => disclosure.setState("disclosureElement", value)
  });
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/T22PY7TE.js
function useDisclosureStoreProps(store, update2, props) {
  useUpdateEffect(update2, [props.store, props.disclosure]);
  useStoreProps(store, props, "open", "setOpen");
  useStoreProps(store, props, "mounted", "setMounted");
  useStoreProps(store, props, "animated");
  return Object.assign(store, { disclosure: props.disclosure });
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/Y67KZUMI.js
var ctx5 = createStoreContext(
  [DialogContextProvider],
  [DialogScopedContextProvider]
);
var usePopoverContext = ctx5.useContext;
var usePopoverScopedContext = ctx5.useScopedContext;
var usePopoverProviderContext = ctx5.useProviderContext;
var PopoverContextProvider = ctx5.ContextProvider;
var PopoverScopedContextProvider = ctx5.ScopedContextProvider;

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/K2KIGYQU.js
function getCommonParent(items) {
  var _a;
  const firstItem = items.find((item) => !!item.element);
  const lastItem = [...items].reverse().find((item) => !!item.element);
  let parentElement = (_a = firstItem == null ? void 0 : firstItem.element) == null ? void 0 : _a.parentElement;
  while (parentElement && (lastItem == null ? void 0 : lastItem.element)) {
    const parent = parentElement;
    if (lastItem && parent.contains(lastItem.element)) {
      return parentElement;
    }
    parentElement = parentElement.parentElement;
  }
  return getDocument(parentElement).body;
}
function getPrivateStore(store) {
  return store == null ? void 0 : store.__unstablePrivateStore;
}
function createCollectionStore(props = {}) {
  var _a;
  throwOnConflictingProps(props, props.store);
  const syncState = (_a = props.store) == null ? void 0 : _a.getState();
  const items = defaultValue(
    props.items,
    syncState == null ? void 0 : syncState.items,
    props.defaultItems,
    []
  );
  const itemsMap = new Map(items.map((item) => [item.id, item]));
  const initialState = {
    items,
    renderedItems: defaultValue(syncState == null ? void 0 : syncState.renderedItems, [])
  };
  const syncPrivateStore = getPrivateStore(props.store);
  const privateStore = createStore(
    { items, renderedItems: initialState.renderedItems },
    syncPrivateStore
  );
  const collection = createStore(initialState, props.store);
  const sortItems = (renderedItems) => {
    const sortedItems = sortBasedOnDOMPosition(renderedItems, (i2) => i2.element);
    privateStore.setState("renderedItems", sortedItems);
    collection.setState("renderedItems", sortedItems);
  };
  setup(collection, () => init(privateStore));
  setup(privateStore, () => {
    return batch(privateStore, ["items"], (state) => {
      collection.setState("items", state.items);
    });
  });
  setup(privateStore, () => {
    return batch(privateStore, ["renderedItems"], (state) => {
      let firstRun = true;
      let raf = requestAnimationFrame(() => {
        const { renderedItems } = collection.getState();
        if (state.renderedItems === renderedItems) return;
        sortItems(state.renderedItems);
      });
      if (typeof IntersectionObserver !== "function") {
        return () => cancelAnimationFrame(raf);
      }
      const ioCallback = () => {
        if (firstRun) {
          firstRun = false;
          return;
        }
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => sortItems(state.renderedItems));
      };
      const root = getCommonParent(state.renderedItems);
      const observer = new IntersectionObserver(ioCallback, { root });
      for (const item of state.renderedItems) {
        if (!item.element) continue;
        observer.observe(item.element);
      }
      return () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
      };
    });
  });
  const mergeItem = (item, setItems, canDeleteFromMap = false) => {
    let prevItem;
    setItems((items2) => {
      const index = items2.findIndex(({ id }) => id === item.id);
      const nextItems = items2.slice();
      if (index !== -1) {
        prevItem = items2[index];
        const nextItem = __spreadValues2(__spreadValues2({}, prevItem), item);
        nextItems[index] = nextItem;
        itemsMap.set(item.id, nextItem);
      } else {
        nextItems.push(item);
        itemsMap.set(item.id, item);
      }
      return nextItems;
    });
    const unmergeItem = () => {
      setItems((items2) => {
        if (!prevItem) {
          if (canDeleteFromMap) {
            itemsMap.delete(item.id);
          }
          return items2.filter(({ id }) => id !== item.id);
        }
        const index = items2.findIndex(({ id }) => id === item.id);
        if (index === -1) return items2;
        const nextItems = items2.slice();
        nextItems[index] = prevItem;
        itemsMap.set(item.id, prevItem);
        return nextItems;
      });
    };
    return unmergeItem;
  };
  const registerItem = (item) => mergeItem(
    item,
    (getItems) => privateStore.setState("items", getItems),
    true
  );
  return __spreadProps2(__spreadValues2({}, collection), {
    registerItem,
    renderItem: (item) => chain(
      registerItem(item),
      mergeItem(
        item,
        (getItems) => privateStore.setState("renderedItems", getItems)
      )
    ),
    item: (id) => {
      if (!id) return null;
      let item = itemsMap.get(id);
      if (!item) {
        const { items: items2 } = privateStore.getState();
        item = items2.find((item2) => item2.id === id);
        if (item) {
          itemsMap.set(id, item);
        }
      }
      return item || null;
    },
    // @ts-expect-error Internal
    __unstablePrivateStore: privateStore
  });
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/AMMIPFT4.js
function useCollectionStoreProps(store, update2, props) {
  useUpdateEffect(update2, [props.store]);
  useStoreProps(store, props, "items", "setItems");
  return store;
}

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/C34RJTDU.js
var NULL_ITEM = { id: null };
function findFirstEnabledItem2(items, excludeId) {
  return items.find((item) => {
    if (excludeId) {
      return !item.disabled && item.id !== excludeId;
    }
    return !item.disabled;
  });
}
function getEnabledItems(items, excludeId) {
  return items.filter((item) => {
    if (excludeId) {
      return !item.disabled && item.id !== excludeId;
    }
    return !item.disabled;
  });
}
function getItemsInRow(items, rowId) {
  return items.filter((item) => item.rowId === rowId);
}
function flipItems(items, activeId, shouldInsertNullItem = false) {
  const index = items.findIndex((item) => item.id === activeId);
  return [
    ...items.slice(index + 1),
    ...shouldInsertNullItem ? [NULL_ITEM] : [],
    ...items.slice(0, index)
  ];
}
function groupItemsByRows2(items) {
  const rows = [];
  for (const item of items) {
    const row = rows.find((currentRow) => {
      var _a;
      return ((_a = currentRow[0]) == null ? void 0 : _a.rowId) === item.rowId;
    });
    if (row) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }
  return rows;
}
function getMaxRowLength(array) {
  let maxLength = 0;
  for (const { length } of array) {
    if (length > maxLength) {
      maxLength = length;
    }
  }
  return maxLength;
}
function createEmptyItem(rowId) {
  return {
    id: "__EMPTY_ITEM__",
    disabled: true,
    rowId
  };
}
function normalizeRows(rows, activeId, focusShift) {
  const maxLength = getMaxRowLength(rows);
  for (const row of rows) {
    for (let i2 = 0; i2 < maxLength; i2 += 1) {
      const item = row[i2];
      if (!item || focusShift && item.disabled) {
        const isFirst = i2 === 0;
        const previousItem = isFirst && focusShift ? findFirstEnabledItem2(row) : row[i2 - 1];
        row[i2] = previousItem && activeId !== previousItem.id && focusShift ? previousItem : createEmptyItem(previousItem == null ? void 0 : previousItem.rowId);
      }
    }
  }
  return rows;
}
function verticalizeItems(items) {
  const rows = groupItemsByRows2(items);
  const maxLength = getMaxRowLength(rows);
  const verticalized = [];
  for (let i2 = 0; i2 < maxLength; i2 += 1) {
    for (const row of rows) {
      const item = row[i2];
      if (item) {
        verticalized.push(__spreadProps2(__spreadValues2({}, item), {
          // If there's no rowId, it means that it's not a grid composite, but
          // a single row instead. So, instead of verticalizing it, that is,
          // assigning a different rowId based on the column index, we keep it
          // undefined so they will be part of the same row. This is useful
          // when using up/down on one-dimensional composites.
          rowId: item.rowId ? `${i2}` : void 0
        }));
      }
    }
  }
  return verticalized;
}
function createCompositeStore(props = {}) {
  var _a;
  const syncState = (_a = props.store) == null ? void 0 : _a.getState();
  const collection = createCollectionStore(props);
  const activeId = defaultValue(
    props.activeId,
    syncState == null ? void 0 : syncState.activeId,
    props.defaultActiveId
  );
  const initialState = __spreadProps2(__spreadValues2({}, collection.getState()), {
    id: defaultValue(
      props.id,
      syncState == null ? void 0 : syncState.id,
      `id-${Math.random().toString(36).slice(2, 8)}`
    ),
    activeId,
    baseElement: defaultValue(syncState == null ? void 0 : syncState.baseElement, null),
    includesBaseElement: defaultValue(
      props.includesBaseElement,
      syncState == null ? void 0 : syncState.includesBaseElement,
      activeId === null
    ),
    moves: defaultValue(syncState == null ? void 0 : syncState.moves, 0),
    orientation: defaultValue(
      props.orientation,
      syncState == null ? void 0 : syncState.orientation,
      "both"
    ),
    rtl: defaultValue(props.rtl, syncState == null ? void 0 : syncState.rtl, false),
    virtualFocus: defaultValue(
      props.virtualFocus,
      syncState == null ? void 0 : syncState.virtualFocus,
      false
    ),
    focusLoop: defaultValue(props.focusLoop, syncState == null ? void 0 : syncState.focusLoop, false),
    focusWrap: defaultValue(props.focusWrap, syncState == null ? void 0 : syncState.focusWrap, false),
    focusShift: defaultValue(props.focusShift, syncState == null ? void 0 : syncState.focusShift, false)
  });
  const composite = createStore(initialState, collection, props.store);
  setup(
    composite,
    () => sync(composite, ["renderedItems", "activeId"], (state) => {
      composite.setState("activeId", (activeId2) => {
        var _a2;
        if (activeId2 !== void 0) return activeId2;
        return (_a2 = findFirstEnabledItem2(state.renderedItems)) == null ? void 0 : _a2.id;
      });
    })
  );
  const getNextId = (direction = "next", options = {}) => {
    var _a2, _b;
    const defaultState = composite.getState();
    const {
      skip = 0,
      activeId: activeId2 = defaultState.activeId,
      focusShift = defaultState.focusShift,
      focusLoop = defaultState.focusLoop,
      focusWrap = defaultState.focusWrap,
      includesBaseElement = defaultState.includesBaseElement,
      renderedItems = defaultState.renderedItems,
      rtl = defaultState.rtl
    } = options;
    const isVerticalDirection = direction === "up" || direction === "down";
    const isNextDirection = direction === "next" || direction === "down";
    const canReverse = isNextDirection ? rtl && !isVerticalDirection : !rtl || isVerticalDirection;
    const canShift = focusShift && !skip;
    let items = !isVerticalDirection ? renderedItems : flatten2DArray(
      normalizeRows(groupItemsByRows2(renderedItems), activeId2, canShift)
    );
    items = canReverse ? reverseArray(items) : items;
    items = isVerticalDirection ? verticalizeItems(items) : items;
    if (activeId2 == null) {
      return (_a2 = findFirstEnabledItem2(items)) == null ? void 0 : _a2.id;
    }
    const activeItem = items.find((item) => item.id === activeId2);
    if (!activeItem) {
      return (_b = findFirstEnabledItem2(items)) == null ? void 0 : _b.id;
    }
    const isGrid2 = items.some((item) => item.rowId);
    const activeIndex = items.indexOf(activeItem);
    const nextItems = items.slice(activeIndex + 1);
    const nextItemsInRow = getItemsInRow(nextItems, activeItem.rowId);
    if (skip) {
      const nextEnabledItemsInRow = getEnabledItems(nextItemsInRow, activeId2);
      const nextItem2 = nextEnabledItemsInRow.slice(skip)[0] || // If we can't find an item, just return the last one.
      nextEnabledItemsInRow[nextEnabledItemsInRow.length - 1];
      return nextItem2 == null ? void 0 : nextItem2.id;
    }
    const canLoop = focusLoop && (isVerticalDirection ? focusLoop !== "horizontal" : focusLoop !== "vertical");
    const canWrap = isGrid2 && focusWrap && (isVerticalDirection ? focusWrap !== "horizontal" : focusWrap !== "vertical");
    const hasNullItem = isNextDirection ? (!isGrid2 || isVerticalDirection) && canLoop && includesBaseElement : isVerticalDirection ? includesBaseElement : false;
    if (canLoop) {
      const loopItems = canWrap && !hasNullItem ? items : getItemsInRow(items, activeItem.rowId);
      const sortedItems = flipItems(loopItems, activeId2, hasNullItem);
      const nextItem2 = findFirstEnabledItem2(sortedItems, activeId2);
      return nextItem2 == null ? void 0 : nextItem2.id;
    }
    if (canWrap) {
      const nextItem2 = findFirstEnabledItem2(
        // We can use nextItems, which contains all the next items, including
        // items from other rows, to wrap between rows. However, if there is a
        // null item (the composite container), we'll only use the next items in
        // the row. So moving next from the last item will focus on the
        // composite container. On grid composites, horizontal navigation never
        // focuses on the composite container, only vertical.
        hasNullItem ? nextItemsInRow : nextItems,
        activeId2
      );
      const nextId = hasNullItem ? (nextItem2 == null ? void 0 : nextItem2.id) || null : nextItem2 == null ? void 0 : nextItem2.id;
      return nextId;
    }
    const nextItem = findFirstEnabledItem2(nextItemsInRow, activeId2);
    if (!nextItem && hasNullItem) {
      return null;
    }
    return nextItem == null ? void 0 : nextItem.id;
  };
  return __spreadProps2(__spreadValues2(__spreadValues2({}, collection), composite), {
    setBaseElement: (element) => composite.setState("baseElement", element),
    setActiveId: (id) => composite.setState("activeId", id),
    move: (id) => {
      if (id === void 0) return;
      composite.setState("activeId", id);
      composite.setState("moves", (moves) => moves + 1);
    },
    first: () => {
      var _a2;
      return (_a2 = findFirstEnabledItem2(composite.getState().renderedItems)) == null ? void 0 : _a2.id;
    },
    last: () => {
      var _a2;
      return (_a2 = findFirstEnabledItem2(reverseArray(composite.getState().renderedItems))) == null ? void 0 : _a2.id;
    },
    next: (options) => {
      if (options !== void 0 && typeof options === "number") {
        options = { skip: options };
      }
      return getNextId("next", options);
    },
    previous: (options) => {
      if (options !== void 0 && typeof options === "number") {
        options = { skip: options };
      }
      return getNextId("previous", options);
    },
    down: (options) => {
      if (options !== void 0 && typeof options === "number") {
        options = { skip: options };
      }
      return getNextId("down", options);
    },
    up: (options) => {
      if (options !== void 0 && typeof options === "number") {
        options = { skip: options };
      }
      return getNextId("up", options);
    }
  });
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/B7UTNDHN.js
function useCompositeStoreOptions(props) {
  const id = useId2(props.id);
  return __spreadValues({ id }, props);
}
function useCompositeStoreProps(store, update2, props) {
  store = useCollectionStoreProps(store, update2, props);
  useStoreProps(store, props, "activeId", "setActiveId");
  useStoreProps(store, props, "includesBaseElement");
  useStoreProps(store, props, "virtualFocus");
  useStoreProps(store, props, "orientation");
  useStoreProps(store, props, "rtl");
  useStoreProps(store, props, "focusLoop");
  useStoreProps(store, props, "focusWrap");
  useStoreProps(store, props, "focusShift");
  return store;
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/OLVWQA7U.js
var import_react13 = __toESM(require_react(), 1);
var ComboboxListRoleContext = (0, import_react13.createContext)(
  void 0
);
var ctx6 = createStoreContext(
  [PopoverContextProvider, CompositeContextProvider],
  [PopoverScopedContextProvider, CompositeScopedContextProvider]
);
var useComboboxContext = ctx6.useContext;
var useComboboxScopedContext = ctx6.useScopedContext;
var useComboboxProviderContext = ctx6.useProviderContext;
var ComboboxContextProvider = ctx6.ContextProvider;
var ComboboxScopedContextProvider = ctx6.ScopedContextProvider;
var ComboboxItemValueContext = (0, import_react13.createContext)(
  void 0
);
var ComboboxItemCheckedContext = (0, import_react13.createContext)(false);

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/RZDDWCDV.js
function createDialogStore(props = {}) {
  return createDisclosureStore(props);
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/Y2U4BRIM.js
function useDialogStoreProps(store, update2, props) {
  return useDisclosureStoreProps(store, update2, props);
}

// ../../../node_modules/.pnpm/@floating-ui+utils@0.2.10/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var floor = Math.floor;

// ../../../node_modules/.pnpm/@floating-ui+utils@0.2.10/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getWindow2(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow2(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow2(value).ShadowRoot;
}

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/__chunks/MD3RIO2T.js
function createPopoverStore(_a = {}) {
  var _b = _a, {
    popover: otherPopover
  } = _b, props = __objRest2(_b, [
    "popover"
  ]);
  const store = mergeStore(
    props.store,
    omit2(otherPopover, [
      "arrowElement",
      "anchorElement",
      "contentElement",
      "popoverElement",
      "disclosureElement"
    ])
  );
  throwOnConflictingProps(props, store);
  const syncState = store == null ? void 0 : store.getState();
  const dialog = createDialogStore(__spreadProps2(__spreadValues2({}, props), { store }));
  const placement = defaultValue(
    props.placement,
    syncState == null ? void 0 : syncState.placement,
    "bottom"
  );
  const initialState = __spreadProps2(__spreadValues2({}, dialog.getState()), {
    placement,
    currentPlacement: placement,
    anchorElement: defaultValue(syncState == null ? void 0 : syncState.anchorElement, null),
    popoverElement: defaultValue(syncState == null ? void 0 : syncState.popoverElement, null),
    arrowElement: defaultValue(syncState == null ? void 0 : syncState.arrowElement, null),
    rendered: Symbol("rendered")
  });
  const popover = createStore(initialState, dialog, store);
  return __spreadProps2(__spreadValues2(__spreadValues2({}, dialog), popover), {
    setAnchorElement: (element) => popover.setState("anchorElement", element),
    setPopoverElement: (element) => popover.setState("popoverElement", element),
    setArrowElement: (element) => popover.setState("arrowElement", element),
    render: () => popover.setState("rendered", Symbol("rendered"))
  });
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/RUY5BUJG.js
function usePopoverStoreProps(store, update2, props) {
  useUpdateEffect(update2, [props.popover]);
  useStoreProps(store, props, "placement");
  return useDialogStoreProps(store, update2, props);
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/HMCFFQCB.js
var TagName7 = "div";
var usePopoverAnchor = createHook(
  function usePopoverAnchor2(_a) {
    var _b = _a, { store } = _b, props = __objRest(_b, ["store"]);
    const context = usePopoverProviderContext();
    store = store || context;
    props = __spreadProps(__spreadValues({}, props), {
      ref: useMergeRefs(store == null ? void 0 : store.setAnchorElement, props.ref)
    });
    return props;
  }
);
var PopoverAnchor = forwardRef22(function PopoverAnchor2(props) {
  const htmlProps = usePopoverAnchor(props);
  return createElement(TagName7, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/IABE5EV2.js
var import_react14 = __toESM(require_react(), 1);
var TagName8 = "div";
function getMouseDestination(event) {
  const relatedTarget = event.relatedTarget;
  if ((relatedTarget == null ? void 0 : relatedTarget.nodeType) === Node.ELEMENT_NODE) {
    return relatedTarget;
  }
  return null;
}
function hoveringInside(event) {
  const nextElement = getMouseDestination(event);
  if (!nextElement) return false;
  return contains(event.currentTarget, nextElement);
}
var symbol2 = Symbol("composite-hover");
function movingToAnotherItem(event) {
  let dest = getMouseDestination(event);
  if (!dest) return false;
  do {
    if (hasOwnProperty(dest, symbol2) && dest[symbol2]) return true;
    dest = dest.parentElement;
  } while (dest);
  return false;
}
var useCompositeHover = createHook(
  function useCompositeHover2(_a) {
    var _b = _a, {
      store,
      focusOnHover = true,
      blurOnHoverEnd = !!focusOnHover
    } = _b, props = __objRest(_b, [
      "store",
      "focusOnHover",
      "blurOnHoverEnd"
    ]);
    const context = useCompositeContext();
    store = store || context;
    invariant2(
      store,
      "CompositeHover must be wrapped in a Composite component."
    );
    const isMouseMoving = useIsMouseMoving();
    const onMouseMoveProp = props.onMouseMove;
    const focusOnHoverProp = useBooleanEvent(focusOnHover);
    const onMouseMove = useEvent((event) => {
      onMouseMoveProp == null ? void 0 : onMouseMoveProp(event);
      if (event.defaultPrevented) return;
      if (!isMouseMoving()) return;
      if (!focusOnHoverProp(event)) return;
      if (!hasFocusWithin(event.currentTarget)) {
        const baseElement = store == null ? void 0 : store.getState().baseElement;
        if (baseElement && !hasFocus(baseElement)) {
          baseElement.focus();
        }
      }
      store == null ? void 0 : store.setActiveId(event.currentTarget.id);
    });
    const onMouseLeaveProp = props.onMouseLeave;
    const blurOnHoverEndProp = useBooleanEvent(blurOnHoverEnd);
    const onMouseLeave = useEvent((event) => {
      var _a2;
      onMouseLeaveProp == null ? void 0 : onMouseLeaveProp(event);
      if (event.defaultPrevented) return;
      if (!isMouseMoving()) return;
      if (hoveringInside(event)) return;
      if (movingToAnotherItem(event)) return;
      if (!focusOnHoverProp(event)) return;
      if (!blurOnHoverEndProp(event)) return;
      store == null ? void 0 : store.setActiveId(null);
      (_a2 = store == null ? void 0 : store.getState().baseElement) == null ? void 0 : _a2.focus();
    });
    const ref = (0, import_react14.useCallback)((element) => {
      if (!element) return;
      element[symbol2] = true;
    }, []);
    props = __spreadProps(__spreadValues({}, props), {
      ref: useMergeRefs(ref, props.ref),
      onMouseMove,
      onMouseLeave
    });
    return removeUndefinedValues(props);
  }
);
var CompositeHover = memo22(
  forwardRef22(function CompositeHover2(props) {
    const htmlProps = useCompositeHover(props);
    return createElement(TagName8, htmlProps);
  })
);

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/combobox/combobox.js
var import_react15 = __toESM(require_react(), 1);
var TagName9 = "input";
function isFirstItemAutoSelected(items, activeValue, autoSelect) {
  if (!autoSelect) return false;
  const firstItem = items.find((item) => !item.disabled && item.value);
  return (firstItem == null ? void 0 : firstItem.value) === activeValue;
}
function hasCompletionString(value, activeValue) {
  if (!activeValue) return false;
  if (value == null) return false;
  value = normalizeString(value);
  return activeValue.length > value.length && activeValue.toLowerCase().indexOf(value.toLowerCase()) === 0;
}
function isInputEvent(event) {
  return event.type === "input";
}
function isAriaAutoCompleteValue(value) {
  return value === "inline" || value === "list" || value === "both" || value === "none";
}
function getDefaultAutoSelectId(items) {
  const item = items.find((item2) => {
    var _a;
    if (item2.disabled) return false;
    return ((_a = item2.element) == null ? void 0 : _a.getAttribute("role")) !== "tab";
  });
  return item == null ? void 0 : item.id;
}
var useCombobox = createHook(
  function useCombobox2(_a) {
    var _b = _a, {
      store,
      focusable = true,
      autoSelect: autoSelectProp = false,
      getAutoSelectId,
      setValueOnChange,
      showMinLength = 0,
      showOnChange,
      showOnMouseDown,
      showOnClick = showOnMouseDown,
      showOnKeyDown,
      showOnKeyPress = showOnKeyDown,
      blurActiveItemOnClick,
      setValueOnClick = true,
      moveOnKeyPress = true,
      autoComplete = "list"
    } = _b, props = __objRest(_b, [
      "store",
      "focusable",
      "autoSelect",
      "getAutoSelectId",
      "setValueOnChange",
      "showMinLength",
      "showOnChange",
      "showOnMouseDown",
      "showOnClick",
      "showOnKeyDown",
      "showOnKeyPress",
      "blurActiveItemOnClick",
      "setValueOnClick",
      "moveOnKeyPress",
      "autoComplete"
    ]);
    const context = useComboboxProviderContext();
    store = store || context;
    invariant2(
      store,
      "Combobox must receive a `store` prop or be wrapped in a ComboboxProvider component."
    );
    const ref = (0, import_react15.useRef)(null);
    const [valueUpdated, forceValueUpdate] = useForceUpdate();
    const canAutoSelectRef = (0, import_react15.useRef)(false);
    const composingRef = (0, import_react15.useRef)(false);
    const autoSelect = store.useState(
      (state) => state.virtualFocus && autoSelectProp
    );
    const inline = autoComplete === "inline" || autoComplete === "both";
    const [canInline, setCanInline] = (0, import_react15.useState)(inline);
    useUpdateLayoutEffect(() => {
      if (!inline) return;
      setCanInline(true);
    }, [inline]);
    const storeValue = store.useState("value");
    const prevSelectedValueRef = (0, import_react15.useRef)();
    (0, import_react15.useEffect)(() => {
      return sync(store, ["selectedValue", "activeId"], (_, prev) => {
        prevSelectedValueRef.current = prev.selectedValue;
      });
    }, []);
    const inlineActiveValue = store.useState((state) => {
      var _a2;
      if (!inline) return;
      if (!canInline) return;
      if (state.activeValue && Array.isArray(state.selectedValue)) {
        if (state.selectedValue.includes(state.activeValue)) return;
        if ((_a2 = prevSelectedValueRef.current) == null ? void 0 : _a2.includes(state.activeValue)) return;
      }
      return state.activeValue;
    });
    const items = store.useState("renderedItems");
    const open = store.useState("open");
    const contentElement = store.useState("contentElement");
    const value = (0, import_react15.useMemo)(() => {
      if (!inline) return storeValue;
      if (!canInline) return storeValue;
      const firstItemAutoSelected = isFirstItemAutoSelected(
        items,
        inlineActiveValue,
        autoSelect
      );
      if (firstItemAutoSelected) {
        if (hasCompletionString(storeValue, inlineActiveValue)) {
          const slice = (inlineActiveValue == null ? void 0 : inlineActiveValue.slice(storeValue.length)) || "";
          return storeValue + slice;
        }
        return storeValue;
      }
      return inlineActiveValue || storeValue;
    }, [inline, canInline, items, inlineActiveValue, autoSelect, storeValue]);
    (0, import_react15.useEffect)(() => {
      const element = ref.current;
      if (!element) return;
      const onCompositeItemMove = () => setCanInline(true);
      element.addEventListener("combobox-item-move", onCompositeItemMove);
      return () => {
        element.removeEventListener("combobox-item-move", onCompositeItemMove);
      };
    }, []);
    (0, import_react15.useEffect)(() => {
      if (!inline) return;
      if (!canInline) return;
      if (!inlineActiveValue) return;
      const firstItemAutoSelected = isFirstItemAutoSelected(
        items,
        inlineActiveValue,
        autoSelect
      );
      if (!firstItemAutoSelected) return;
      if (!hasCompletionString(storeValue, inlineActiveValue)) return;
      let cleanup = noop;
      queueMicrotask(() => {
        const element = ref.current;
        if (!element) return;
        const { start: prevStart, end: prevEnd } = getTextboxSelection(element);
        const nextStart = storeValue.length;
        const nextEnd = inlineActiveValue.length;
        setSelectionRange(element, nextStart, nextEnd);
        cleanup = () => {
          if (!hasFocus(element)) return;
          const { start, end } = getTextboxSelection(element);
          if (start !== nextStart) return;
          if (end !== nextEnd) return;
          setSelectionRange(element, prevStart, prevEnd);
        };
      });
      return () => cleanup();
    }, [
      valueUpdated,
      inline,
      canInline,
      inlineActiveValue,
      items,
      autoSelect,
      storeValue
    ]);
    const scrollingElementRef = (0, import_react15.useRef)(null);
    const getAutoSelectIdProp = useEvent(getAutoSelectId);
    const autoSelectIdRef = (0, import_react15.useRef)(null);
    (0, import_react15.useEffect)(() => {
      if (!open) return;
      if (!contentElement) return;
      const scrollingElement = getScrollingElement(contentElement);
      if (!scrollingElement) return;
      scrollingElementRef.current = scrollingElement;
      const onUserScroll = () => {
        canAutoSelectRef.current = false;
      };
      const onScroll = () => {
        if (!store) return;
        if (!canAutoSelectRef.current) return;
        const { activeId } = store.getState();
        if (activeId === null) return;
        if (activeId === autoSelectIdRef.current) return;
        canAutoSelectRef.current = false;
      };
      const options = { passive: true, capture: true };
      scrollingElement.addEventListener("wheel", onUserScroll, options);
      scrollingElement.addEventListener("touchmove", onUserScroll, options);
      scrollingElement.addEventListener("scroll", onScroll, options);
      return () => {
        scrollingElement.removeEventListener("wheel", onUserScroll, true);
        scrollingElement.removeEventListener("touchmove", onUserScroll, true);
        scrollingElement.removeEventListener("scroll", onScroll, true);
      };
    }, [open, contentElement, store]);
    useSafeLayoutEffect(() => {
      if (!storeValue) return;
      if (composingRef.current) return;
      canAutoSelectRef.current = true;
    }, [storeValue]);
    useSafeLayoutEffect(() => {
      if (autoSelect !== "always" && open) return;
      canAutoSelectRef.current = open;
    }, [autoSelect, open]);
    const resetValueOnSelect = store.useState("resetValueOnSelect");
    useUpdateEffect(() => {
      var _a2, _b2;
      const canAutoSelect = canAutoSelectRef.current;
      if (!store) return;
      if (!open) return;
      if (!canAutoSelect && !resetValueOnSelect) return;
      const { baseElement, contentElement: contentElement2, activeId } = store.getState();
      if (baseElement && !hasFocus(baseElement)) return;
      if (contentElement2 == null ? void 0 : contentElement2.hasAttribute("data-placing")) {
        const observer = new MutationObserver(forceValueUpdate);
        observer.observe(contentElement2, { attributeFilter: ["data-placing"] });
        return () => observer.disconnect();
      }
      if (autoSelect && canAutoSelect) {
        const userAutoSelectId = getAutoSelectIdProp(items);
        const autoSelectId = userAutoSelectId !== void 0 ? userAutoSelectId : (_a2 = getDefaultAutoSelectId(items)) != null ? _a2 : store.first();
        autoSelectIdRef.current = autoSelectId;
        store.move(autoSelectId != null ? autoSelectId : null);
      } else {
        const element = (_b2 = store.item(activeId || store.first())) == null ? void 0 : _b2.element;
        if (element && "scrollIntoView" in element) {
          element.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }
      return;
    }, [
      store,
      open,
      valueUpdated,
      storeValue,
      autoSelect,
      resetValueOnSelect,
      getAutoSelectIdProp,
      items
    ]);
    (0, import_react15.useEffect)(() => {
      if (!inline) return;
      const combobox = ref.current;
      if (!combobox) return;
      const elements = [combobox, contentElement].filter(
        (value2) => !!value2
      );
      const onBlur2 = (event) => {
        if (elements.every((el) => isFocusEventOutside(event, el))) {
          store == null ? void 0 : store.setValue(value);
        }
      };
      for (const element of elements) {
        element.addEventListener("focusout", onBlur2);
      }
      return () => {
        for (const element of elements) {
          element.removeEventListener("focusout", onBlur2);
        }
      };
    }, [inline, contentElement, store, value]);
    const canShow = (event) => {
      const currentTarget = event.currentTarget;
      return currentTarget.value.length >= showMinLength;
    };
    const onChangeProp = props.onChange;
    const showOnChangeProp = useBooleanEvent(showOnChange != null ? showOnChange : canShow);
    const setValueOnChangeProp = useBooleanEvent(
      // If the combobox is combined with tags, the value will be set by the tag
      // input component.
      setValueOnChange != null ? setValueOnChange : !store.tag
    );
    const onChange = useEvent((event) => {
      onChangeProp == null ? void 0 : onChangeProp(event);
      if (event.defaultPrevented) return;
      if (!store) return;
      const currentTarget = event.currentTarget;
      const { value: value2, selectionStart, selectionEnd } = currentTarget;
      const nativeEvent = event.nativeEvent;
      canAutoSelectRef.current = true;
      if (isInputEvent(nativeEvent)) {
        if (nativeEvent.isComposing) {
          canAutoSelectRef.current = false;
          composingRef.current = true;
        }
        if (inline) {
          const textInserted = nativeEvent.inputType === "insertText" || nativeEvent.inputType === "insertCompositionText";
          const caretAtEnd = selectionStart === value2.length;
          setCanInline(textInserted && caretAtEnd);
        }
      }
      if (setValueOnChangeProp(event)) {
        const isSameValue = value2 === store.getState().value;
        store.setValue(value2);
        queueMicrotask(() => {
          setSelectionRange(currentTarget, selectionStart, selectionEnd);
        });
        if (inline && autoSelect && isSameValue) {
          forceValueUpdate();
        }
      }
      if (showOnChangeProp(event)) {
        store.show();
      }
      if (!autoSelect || !canAutoSelectRef.current) {
        store.setActiveId(null);
      }
    });
    const onCompositionEndProp = props.onCompositionEnd;
    const onCompositionEnd = useEvent((event) => {
      canAutoSelectRef.current = true;
      composingRef.current = false;
      onCompositionEndProp == null ? void 0 : onCompositionEndProp(event);
      if (event.defaultPrevented) return;
      if (!autoSelect) return;
      forceValueUpdate();
    });
    const onMouseDownProp = props.onMouseDown;
    const blurActiveItemOnClickProp = useBooleanEvent(
      blurActiveItemOnClick != null ? blurActiveItemOnClick : () => !!(store == null ? void 0 : store.getState().includesBaseElement)
    );
    const setValueOnClickProp = useBooleanEvent(setValueOnClick);
    const showOnClickProp = useBooleanEvent(showOnClick != null ? showOnClick : canShow);
    const onMouseDown = useEvent((event) => {
      onMouseDownProp == null ? void 0 : onMouseDownProp(event);
      if (event.defaultPrevented) return;
      if (event.button) return;
      if (event.ctrlKey) return;
      if (!store) return;
      if (blurActiveItemOnClickProp(event)) {
        store.setActiveId(null);
      }
      if (setValueOnClickProp(event)) {
        store.setValue(value);
      }
      if (showOnClickProp(event)) {
        queueBeforeEvent(event.currentTarget, "mouseup", store.show);
      }
    });
    const onKeyDownProp = props.onKeyDown;
    const showOnKeyPressProp = useBooleanEvent(showOnKeyPress != null ? showOnKeyPress : canShow);
    const onKeyDown = useEvent((event) => {
      onKeyDownProp == null ? void 0 : onKeyDownProp(event);
      if (!event.repeat) {
        canAutoSelectRef.current = false;
      }
      if (event.defaultPrevented) return;
      if (event.ctrlKey) return;
      if (event.altKey) return;
      if (event.shiftKey) return;
      if (event.metaKey) return;
      if (!store) return;
      const { open: open2 } = store.getState();
      if (open2) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (showOnKeyPressProp(event)) {
          event.preventDefault();
          store.show();
        }
      }
    });
    const onBlurProp = props.onBlur;
    const onBlur = useEvent((event) => {
      canAutoSelectRef.current = false;
      onBlurProp == null ? void 0 : onBlurProp(event);
      if (event.defaultPrevented) return;
    });
    const id = useId2(props.id);
    const ariaAutoComplete = isAriaAutoCompleteValue(autoComplete) ? autoComplete : void 0;
    const isActiveItem = store.useState((state) => state.activeId === null);
    props = __spreadProps(__spreadValues({
      id,
      role: "combobox",
      "aria-autocomplete": ariaAutoComplete,
      "aria-haspopup": getPopupRole(contentElement, "listbox"),
      "aria-expanded": open,
      "aria-controls": contentElement == null ? void 0 : contentElement.id,
      "data-active-item": isActiveItem || void 0,
      value
    }, props), {
      ref: useMergeRefs(ref, props.ref),
      onChange,
      onCompositionEnd,
      onMouseDown,
      onKeyDown,
      onBlur
    });
    props = useComposite(__spreadProps(__spreadValues({
      store,
      focusable
    }, props), {
      // Enable inline autocomplete when the user moves from the combobox input
      // to an item.
      moveOnKeyPress: (event) => {
        if (isFalsyBooleanCallback(moveOnKeyPress, event)) return false;
        if (inline) setCanInline(true);
        return true;
      }
    }));
    props = usePopoverAnchor(__spreadValues({ store }, props));
    return __spreadValues({ autoComplete: "off" }, props);
  }
);
var Combobox = forwardRef22(function Combobox2(props) {
  const htmlProps = useCombobox(props);
  return createElement(TagName9, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/D7FSM5GC.js
var import_react16 = __toESM(require_react(), 1);
var import_jsx_runtime50 = __toESM(require_jsx_runtime(), 1);
var TagName10 = "div";
function isSelected(storeValue, itemValue) {
  if (itemValue == null) return;
  if (storeValue == null) return false;
  if (Array.isArray(storeValue)) {
    return storeValue.includes(itemValue);
  }
  return storeValue === itemValue;
}
function getItemRole(popupRole) {
  var _a;
  const itemRoleByPopupRole = {
    menu: "menuitem",
    listbox: "option",
    tree: "treeitem"
  };
  const key = popupRole;
  return (_a = itemRoleByPopupRole[key]) != null ? _a : "option";
}
var useComboboxItem = createHook(
  function useComboboxItem2(_a) {
    var _b = _a, {
      store,
      value,
      hideOnClick,
      setValueOnClick,
      selectValueOnClick = true,
      resetValueOnSelect,
      focusOnHover = false,
      moveOnKeyPress = true,
      getItem: getItemProp
    } = _b, props = __objRest(_b, [
      "store",
      "value",
      "hideOnClick",
      "setValueOnClick",
      "selectValueOnClick",
      "resetValueOnSelect",
      "focusOnHover",
      "moveOnKeyPress",
      "getItem"
    ]);
    var _a2;
    const context = useComboboxScopedContext();
    store = store || context;
    invariant2(
      store,
      "ComboboxItem must be wrapped in a ComboboxList or ComboboxPopover component."
    );
    const { resetValueOnSelectState, multiSelectable, selected } = useStoreStateObject(store, {
      resetValueOnSelectState: "resetValueOnSelect",
      multiSelectable(state) {
        return Array.isArray(state.selectedValue);
      },
      selected(state) {
        return isSelected(state.selectedValue, value);
      }
    });
    const getItem = (0, import_react16.useCallback)(
      (item) => {
        const nextItem = __spreadProps(__spreadValues({}, item), { value });
        if (getItemProp) {
          return getItemProp(nextItem);
        }
        return nextItem;
      },
      [value, getItemProp]
    );
    setValueOnClick = setValueOnClick != null ? setValueOnClick : !multiSelectable;
    hideOnClick = hideOnClick != null ? hideOnClick : value != null && !multiSelectable;
    const onClickProp = props.onClick;
    const setValueOnClickProp = useBooleanEvent(setValueOnClick);
    const selectValueOnClickProp = useBooleanEvent(selectValueOnClick);
    const resetValueOnSelectProp = useBooleanEvent(
      (_a2 = resetValueOnSelect != null ? resetValueOnSelect : resetValueOnSelectState) != null ? _a2 : multiSelectable
    );
    const hideOnClickProp = useBooleanEvent(hideOnClick);
    const onClick = useEvent((event) => {
      onClickProp == null ? void 0 : onClickProp(event);
      if (event.defaultPrevented) return;
      if (isDownloading(event)) return;
      if (isOpeningInNewTab(event)) return;
      if (value != null) {
        if (selectValueOnClickProp(event)) {
          if (resetValueOnSelectProp(event)) {
            store == null ? void 0 : store.resetValue();
          }
          store == null ? void 0 : store.setSelectedValue((prevValue) => {
            if (!Array.isArray(prevValue)) return value;
            if (prevValue.includes(value)) {
              return prevValue.filter((v2) => v2 !== value);
            }
            return [...prevValue, value];
          });
        }
        if (setValueOnClickProp(event)) {
          store == null ? void 0 : store.setValue(value);
        }
      }
      if (hideOnClickProp(event)) {
        store == null ? void 0 : store.hide();
      }
    });
    const onKeyDownProp = props.onKeyDown;
    const onKeyDown = useEvent((event) => {
      onKeyDownProp == null ? void 0 : onKeyDownProp(event);
      if (event.defaultPrevented) return;
      const baseElement = store == null ? void 0 : store.getState().baseElement;
      if (!baseElement) return;
      if (hasFocus(baseElement)) return;
      const printable = event.key.length === 1;
      if (printable || event.key === "Backspace" || event.key === "Delete") {
        queueMicrotask(() => baseElement.focus());
        if (isTextField(baseElement)) {
          store == null ? void 0 : store.setValue(baseElement.value);
        }
      }
    });
    if (multiSelectable && selected != null) {
      props = __spreadValues({
        "aria-selected": selected
      }, props);
    }
    props = useWrapElement(
      props,
      (element) => /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(ComboboxItemValueContext.Provider, { value, children: /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(ComboboxItemCheckedContext.Provider, { value: selected != null ? selected : false, children: element }) }),
      [value, selected]
    );
    const popupRole = (0, import_react16.useContext)(ComboboxListRoleContext);
    props = __spreadProps(__spreadValues({
      role: getItemRole(popupRole),
      children: value
    }, props), {
      onClick,
      onKeyDown
    });
    const moveOnKeyPressProp = useBooleanEvent(moveOnKeyPress);
    props = useCompositeItem(__spreadProps(__spreadValues({
      store
    }, props), {
      getItem,
      // Dispatch a custom event on the combobox input when moving to an item
      // with the keyboard so the Combobox component can enable inline
      // autocompletion.
      moveOnKeyPress: (event) => {
        if (!moveOnKeyPressProp(event)) return false;
        const moveEvent = new Event("combobox-item-move");
        const baseElement = store == null ? void 0 : store.getState().baseElement;
        baseElement == null ? void 0 : baseElement.dispatchEvent(moveEvent);
        return true;
      }
    }));
    props = useCompositeHover(__spreadValues({ store, focusOnHover }, props));
    return props;
  }
);
var ComboboxItem = memo22(
  forwardRef22(function ComboboxItem2(props) {
    const htmlProps = useComboboxItem(props);
    return createElement(TagName10, htmlProps);
  })
);

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/combobox/combobox-item-value.js
var import_react17 = __toESM(require_react(), 1);
var import_jsx_runtime51 = __toESM(require_jsx_runtime(), 1);
var TagName11 = "span";
function normalizeValue(value) {
  return normalizeString(value).toLowerCase();
}
function getOffsets(string, values) {
  const offsets = [];
  for (const value of values) {
    let pos = 0;
    const length = value.length;
    while (string.indexOf(value, pos) !== -1) {
      const index = string.indexOf(value, pos);
      if (index !== -1) {
        offsets.push([index, length]);
      }
      pos = index + 1;
    }
  }
  return offsets;
}
function filterOverlappingOffsets(offsets) {
  return offsets.filter(([offset, length], i2, arr) => {
    return !arr.some(
      ([o2, l2], j2) => j2 !== i2 && o2 <= offset && o2 + l2 >= offset + length
    );
  });
}
function sortOffsets(offsets) {
  return offsets.sort(([a2], [b2]) => a2 - b2);
}
function splitValue(itemValue, userValue) {
  if (!itemValue) return itemValue;
  if (!userValue) return itemValue;
  const userValues = toArray(userValue).filter(Boolean).map(normalizeValue);
  const parts = [];
  const span = (value, autocomplete = false) => /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
    "span",
    {
      "data-autocomplete-value": autocomplete ? "" : void 0,
      "data-user-value": autocomplete ? void 0 : "",
      children: value
    },
    parts.length
  );
  const offsets = sortOffsets(
    filterOverlappingOffsets(
      // Convert userValues into a set to avoid duplicates
      getOffsets(normalizeValue(itemValue), new Set(userValues))
    )
  );
  if (!offsets.length) {
    parts.push(span(itemValue, true));
    return parts;
  }
  const [firstOffset] = offsets[0];
  const values = [
    itemValue.slice(0, firstOffset),
    ...offsets.flatMap(([offset, length], i2) => {
      var _a;
      const value = itemValue.slice(offset, offset + length);
      const nextOffset = (_a = offsets[i2 + 1]) == null ? void 0 : _a[0];
      const nextValue = itemValue.slice(offset + length, nextOffset);
      return [value, nextValue];
    })
  ];
  values.forEach((value, i2) => {
    if (!value) return;
    parts.push(span(value, i2 % 2 === 0));
  });
  return parts;
}
var useComboboxItemValue = createHook(function useComboboxItemValue2(_a) {
  var _b = _a, { store, value, userValue } = _b, props = __objRest(_b, ["store", "value", "userValue"]);
  const context = useComboboxScopedContext();
  store = store || context;
  const itemContext = (0, import_react17.useContext)(ComboboxItemValueContext);
  const itemValue = value != null ? value : itemContext;
  const inputValue = useStoreState(store, (state) => userValue != null ? userValue : state == null ? void 0 : state.value);
  const children = (0, import_react17.useMemo)(() => {
    if (!itemValue) return;
    if (!inputValue) return itemValue;
    return splitValue(itemValue, inputValue);
  }, [itemValue, inputValue]);
  props = __spreadValues({
    children
  }, props);
  return removeUndefinedValues(props);
});
var ComboboxItemValue = forwardRef22(function ComboboxItemValue2(props) {
  const htmlProps = useComboboxItemValue(props);
  return createElement(TagName11, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/combobox/combobox-label.js
var TagName12 = "label";
var useComboboxLabel = createHook(
  function useComboboxLabel2(_a) {
    var _b = _a, { store } = _b, props = __objRest(_b, ["store"]);
    const context = useComboboxProviderContext();
    store = store || context;
    invariant2(
      store,
      "ComboboxLabel must receive a `store` prop or be wrapped in a ComboboxProvider component."
    );
    const comboboxId = store.useState((state) => {
      var _a2;
      return (_a2 = state.baseElement) == null ? void 0 : _a2.id;
    });
    props = __spreadValues({
      htmlFor: comboboxId
    }, props);
    return removeUndefinedValues(props);
  }
);
var ComboboxLabel = memo22(
  forwardRef22(function ComboboxLabel2(props) {
    const htmlProps = useComboboxLabel(props);
    return createElement(TagName12, htmlProps);
  })
);

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/MNJRSAAC.js
var import_react18 = __toESM(require_react(), 1);
var import_jsx_runtime52 = __toESM(require_jsx_runtime(), 1);
var TagName13 = "div";
var useComboboxList = createHook(
  function useComboboxList2(_a) {
    var _b = _a, { store, alwaysVisible } = _b, props = __objRest(_b, ["store", "alwaysVisible"]);
    const scopedContext = useComboboxScopedContext(true);
    const context = useComboboxContext();
    store = store || context;
    const scopedContextSameStore = !!store && store === scopedContext;
    invariant2(
      store,
      "ComboboxList must receive a `store` prop or be wrapped in a ComboboxProvider component."
    );
    const ref = (0, import_react18.useRef)(null);
    const id = useId2(props.id);
    const mounted = store.useState("mounted");
    const hidden = isHidden(mounted, props.hidden, alwaysVisible);
    const style = hidden ? __spreadProps(__spreadValues({}, props.style), { display: "none" }) : props.style;
    const multiSelectable = store.useState(
      (state) => Array.isArray(state.selectedValue)
    );
    const role = useAttribute(ref, "role", props.role);
    const isCompositeRole = role === "listbox" || role === "tree" || role === "grid";
    const ariaMultiSelectable = isCompositeRole ? multiSelectable || void 0 : void 0;
    const [hasListboxInside, setHasListboxInside] = (0, import_react18.useState)(false);
    const contentElement = store.useState("contentElement");
    useSafeLayoutEffect(() => {
      if (!mounted) return;
      const element = ref.current;
      if (!element) return;
      if (contentElement !== element) return;
      const callback = () => {
        setHasListboxInside(!!element.querySelector("[role='listbox']"));
      };
      const observer = new MutationObserver(callback);
      observer.observe(element, {
        subtree: true,
        childList: true,
        attributeFilter: ["role"]
      });
      callback();
      return () => observer.disconnect();
    }, [mounted, contentElement]);
    if (!hasListboxInside) {
      props = __spreadValues({
        role: "listbox",
        "aria-multiselectable": ariaMultiSelectable
      }, props);
    }
    props = useWrapElement(
      props,
      (element) => /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ComboboxScopedContextProvider, { value: store, children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(ComboboxListRoleContext.Provider, { value: role, children: element }) }),
      [store, role]
    );
    const setContentElement = id && (!scopedContext || !scopedContextSameStore) ? store.setContentElement : null;
    props = __spreadProps(__spreadValues({
      id,
      hidden
    }, props), {
      ref: useMergeRefs(setContentElement, ref, props.ref),
      style
    });
    return removeUndefinedValues(props);
  }
);
var ComboboxList = forwardRef22(function ComboboxList2(props) {
  const htmlProps = useComboboxList(props);
  return createElement(TagName13, htmlProps);
});

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/VJQU3YUE.js
var import_react19 = __toESM(require_react(), 1);
var TagValueContext = (0, import_react19.createContext)(null);
var TagRemoveIdContext = (0, import_react19.createContext)(
  null
);
var ctx7 = createStoreContext(
  [CompositeContextProvider],
  [CompositeScopedContextProvider]
);
var useTagContext = ctx7.useContext;
var useTagScopedContext = ctx7.useScopedContext;
var useTagProviderContext = ctx7.useProviderContext;
var TagContextProvider = ctx7.ContextProvider;
var TagScopedContextProvider = ctx7.ScopedContextProvider;

// ../../../node_modules/.pnpm/@ariakit+core@0.4.16/node_modules/@ariakit/core/esm/combobox/combobox-store.js
var isTouchSafari = isSafari() && isTouchDevice();
function createComboboxStore(_a = {}) {
  var _b = _a, {
    tag
  } = _b, props = __objRest2(_b, [
    "tag"
  ]);
  const store = mergeStore(props.store, pick2(tag, ["value", "rtl"]));
  throwOnConflictingProps(props, store);
  const tagState = tag == null ? void 0 : tag.getState();
  const syncState = store == null ? void 0 : store.getState();
  const activeId = defaultValue(
    props.activeId,
    syncState == null ? void 0 : syncState.activeId,
    props.defaultActiveId,
    null
  );
  const composite = createCompositeStore(__spreadProps2(__spreadValues2({}, props), {
    activeId,
    includesBaseElement: defaultValue(
      props.includesBaseElement,
      syncState == null ? void 0 : syncState.includesBaseElement,
      true
    ),
    orientation: defaultValue(
      props.orientation,
      syncState == null ? void 0 : syncState.orientation,
      "vertical"
    ),
    focusLoop: defaultValue(props.focusLoop, syncState == null ? void 0 : syncState.focusLoop, true),
    focusWrap: defaultValue(props.focusWrap, syncState == null ? void 0 : syncState.focusWrap, true),
    virtualFocus: defaultValue(
      props.virtualFocus,
      syncState == null ? void 0 : syncState.virtualFocus,
      true
    )
  }));
  const popover = createPopoverStore(__spreadProps2(__spreadValues2({}, props), {
    placement: defaultValue(
      props.placement,
      syncState == null ? void 0 : syncState.placement,
      "bottom-start"
    )
  }));
  const value = defaultValue(
    props.value,
    syncState == null ? void 0 : syncState.value,
    props.defaultValue,
    ""
  );
  const selectedValue = defaultValue(
    props.selectedValue,
    syncState == null ? void 0 : syncState.selectedValue,
    tagState == null ? void 0 : tagState.values,
    props.defaultSelectedValue,
    ""
  );
  const multiSelectable = Array.isArray(selectedValue);
  const initialState = __spreadProps2(__spreadValues2(__spreadValues2({}, composite.getState()), popover.getState()), {
    value,
    selectedValue,
    resetValueOnSelect: defaultValue(
      props.resetValueOnSelect,
      syncState == null ? void 0 : syncState.resetValueOnSelect,
      multiSelectable
    ),
    resetValueOnHide: defaultValue(
      props.resetValueOnHide,
      syncState == null ? void 0 : syncState.resetValueOnHide,
      multiSelectable && !tag
    ),
    activeValue: syncState == null ? void 0 : syncState.activeValue
  });
  const combobox = createStore(initialState, composite, popover, store);
  if (isTouchSafari) {
    setup(
      combobox,
      () => sync(combobox, ["virtualFocus"], () => {
        combobox.setState("virtualFocus", false);
      })
    );
  }
  setup(combobox, () => {
    if (!tag) return;
    return chain(
      sync(combobox, ["selectedValue"], (state) => {
        if (!Array.isArray(state.selectedValue)) return;
        tag.setValues(state.selectedValue);
      }),
      sync(tag, ["values"], (state) => {
        combobox.setState("selectedValue", state.values);
      })
    );
  });
  setup(
    combobox,
    () => sync(combobox, ["resetValueOnHide", "mounted"], (state) => {
      if (!state.resetValueOnHide) return;
      if (state.mounted) return;
      combobox.setState("value", value);
    })
  );
  setup(
    combobox,
    () => sync(combobox, ["open"], (state) => {
      if (state.open) return;
      combobox.setState("activeId", activeId);
      combobox.setState("moves", 0);
    })
  );
  setup(
    combobox,
    () => sync(combobox, ["moves", "activeId"], (state, prevState) => {
      if (state.moves === prevState.moves) {
        combobox.setState("activeValue", void 0);
      }
    })
  );
  setup(
    combobox,
    () => batch(combobox, ["moves", "renderedItems"], (state, prev) => {
      if (state.moves === prev.moves) return;
      const { activeId: activeId2 } = combobox.getState();
      const activeItem = composite.item(activeId2);
      combobox.setState("activeValue", activeItem == null ? void 0 : activeItem.value);
    })
  );
  return __spreadProps2(__spreadValues2(__spreadValues2(__spreadValues2({}, popover), composite), combobox), {
    tag,
    setValue: (value2) => combobox.setState("value", value2),
    resetValue: () => combobox.setState("value", initialState.value),
    setSelectedValue: (selectedValue2) => combobox.setState("selectedValue", selectedValue2)
  });
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/__chunks/HI6DYBVE.js
function useComboboxStoreOptions(props) {
  const tag = useTagContext();
  props = __spreadProps(__spreadValues({}, props), {
    tag: props.tag !== void 0 ? props.tag : tag
  });
  return useCompositeStoreOptions(props);
}
function useComboboxStoreProps(store, update2, props) {
  useUpdateEffect(update2, [props.tag]);
  useStoreProps(store, props, "value", "setValue");
  useStoreProps(store, props, "selectedValue", "setSelectedValue");
  useStoreProps(store, props, "resetValueOnHide");
  useStoreProps(store, props, "resetValueOnSelect");
  return Object.assign(
    useCompositeStoreProps(
      usePopoverStoreProps(store, update2, props),
      update2,
      props
    ),
    { tag: props.tag }
  );
}
function useComboboxStore(props = {}) {
  props = useComboboxStoreOptions(props);
  const [store, update2] = useStore2(createComboboxStore, props);
  return useComboboxStoreProps(store, update2, props);
}

// ../../../node_modules/.pnpm/@ariakit+react-core@0.4.19_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@ariakit/react-core/esm/combobox/combobox-provider.js
var import_jsx_runtime53 = __toESM(require_jsx_runtime(), 1);
function ComboboxProvider(props = {}) {
  const store = useComboboxStore(props);
  return /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(ComboboxContextProvider, { value: store, children: props.children });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/search-widget.js
var import_remove_accents = __toESM(require_remove_accents(), 1);
var import_compose7 = __toESM(require_compose(), 1);
var import_i18n17 = __toESM(require_i18n(), 1);
var import_element18 = __toESM(require_element(), 1);
var import_components15 = __toESM(require_components(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/utils.js
var EMPTY_ARRAY2 = [];
var getCurrentValue = (filterDefinition, currentFilter) => {
  if (filterDefinition.singleSelection) {
    return currentFilter?.value;
  }
  if (Array.isArray(currentFilter?.value)) {
    return currentFilter.value;
  }
  if (!Array.isArray(currentFilter?.value) && !!currentFilter?.value) {
    return [currentFilter.value];
  }
  return EMPTY_ARRAY2;
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/hooks/use-elements.js
var import_element17 = __toESM(require_element(), 1);
var EMPTY_ARRAY3 = [];
function useElements({
  elements,
  getElements
}) {
  const staticElements = Array.isArray(elements) && elements.length > 0 ? elements : EMPTY_ARRAY3;
  const [records, setRecords] = (0, import_element17.useState)(staticElements);
  const [isLoading, setIsLoading] = (0, import_element17.useState)(false);
  (0, import_element17.useEffect)(() => {
    if (!getElements) {
      setRecords(staticElements);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getElements().then((fetchedElements) => {
      if (!cancelled) {
        const dynamicElements = Array.isArray(fetchedElements) && fetchedElements.length > 0 ? fetchedElements : staticElements;
        setRecords(dynamicElements);
      }
    }).catch(() => {
      if (!cancelled) {
        setRecords(staticElements);
      }
    }).finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getElements, staticElements]);
  return {
    elements: records,
    isLoading
  };
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/search-widget.js
function normalizeSearchInput(input = "") {
  return (0, import_remove_accents.default)(input.trim().toLowerCase());
}
var getNewValue = (filterDefinition, currentFilter, value) => {
  if (filterDefinition.singleSelection) {
    return value;
  }
  if (Array.isArray(currentFilter?.value)) {
    return currentFilter.value.includes(value) ? currentFilter.value.filter((v2) => v2 !== value) : [...currentFilter.value, value];
  }
  return [value];
};
function generateFilterElementCompositeItemId(prefix2, filterElementValue) {
  return `${prefix2}-${filterElementValue}`;
}
var MultiSelectionOption = ({ selected }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
    "span",
    {
      className: clsx_default(
        "dataviews-filters__search-widget-listitem-multi-selection",
        { "is-selected": selected }
      ),
      children: selected && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(import_components15.Icon, { icon: check_default })
    }
  );
};
var SingleSelectionOption = ({ selected }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
    "span",
    {
      className: clsx_default(
        "dataviews-filters__search-widget-listitem-single-selection",
        { "is-selected": selected }
      )
    }
  );
};
function ListBox({ view, filter, onChangeView }) {
  const baseId = (0, import_compose7.useInstanceId)(ListBox, "dataviews-filter-list-box");
  const [activeCompositeId, setActiveCompositeId] = (0, import_element18.useState)(
    // When there are one or less operators, the first item is set as active
    // (by setting the initial `activeId` to `undefined`).
    // With 2 or more operators, the focus is moved on the operators control
    // (by setting the initial `activeId` to `null`), meaning that there won't
    // be an active item initially. Focus is then managed via the
    // `onFocusVisible` callback.
    filter.operators?.length === 1 ? void 0 : null
  );
  const currentFilter = view.filters?.find(
    (f2) => f2.field === filter.field
  );
  const currentValue = getCurrentValue(filter, currentFilter);
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
    import_components15.Composite,
    {
      virtualFocus: true,
      focusLoop: true,
      activeId: activeCompositeId,
      setActiveId: setActiveCompositeId,
      role: "listbox",
      className: "dataviews-filters__search-widget-listbox",
      "aria-label": (0, import_i18n17.sprintf)(
        /* translators: List of items for a filter. 1: Filter name. e.g.: "List of: Author". */
        (0, import_i18n17.__)("List of: %1$s"),
        filter.name
      ),
      onFocusVisible: () => {
        if (!activeCompositeId && filter.elements.length) {
          setActiveCompositeId(
            generateFilterElementCompositeItemId(
              baseId,
              filter.elements[0].value
            )
          );
        }
      },
      render: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(import_components15.Composite.Typeahead, {}),
      children: filter.elements.map((element) => /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)(
        import_components15.Composite.Hover,
        {
          render: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
            import_components15.Composite.Item,
            {
              id: generateFilterElementCompositeItemId(
                baseId,
                element.value
              ),
              render: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
                "div",
                {
                  "aria-label": element.label,
                  role: "option",
                  className: "dataviews-filters__search-widget-listitem"
                }
              ),
              onClick: () => {
                const newFilters = currentFilter ? [
                  ...(view.filters ?? []).map(
                    (_filter) => {
                      if (_filter.field === filter.field) {
                        return {
                          ..._filter,
                          operator: currentFilter.operator || filter.operators[0],
                          value: getNewValue(
                            filter,
                            currentFilter,
                            element.value
                          )
                        };
                      }
                      return _filter;
                    }
                  )
                ] : [
                  ...view.filters ?? [],
                  {
                    field: filter.field,
                    operator: filter.operators[0],
                    value: getNewValue(
                      filter,
                      currentFilter,
                      element.value
                    )
                  }
                ];
                onChangeView({
                  ...view,
                  page: 1,
                  filters: newFilters
                });
              }
            }
          ),
          children: [
            filter.singleSelection && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
              SingleSelectionOption,
              {
                selected: currentValue === element.value
              }
            ),
            !filter.singleSelection && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
              MultiSelectionOption,
              {
                selected: currentValue.includes(element.value)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("span", { children: element.label })
          ]
        },
        element.value
      ))
    }
  );
}
function ComboboxList3({ view, filter, onChangeView }) {
  const [searchValue, setSearchValue] = (0, import_element18.useState)("");
  const deferredSearchValue = (0, import_element18.useDeferredValue)(searchValue);
  const currentFilter = view.filters?.find(
    (_filter) => _filter.field === filter.field
  );
  const currentValue = getCurrentValue(filter, currentFilter);
  const matches = (0, import_element18.useMemo)(() => {
    const normalizedSearch = normalizeSearchInput(deferredSearchValue);
    return filter.elements.filter(
      (item) => normalizeSearchInput(item.label).includes(normalizedSearch)
    );
  }, [filter.elements, deferredSearchValue]);
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)(
    ComboboxProvider,
    {
      selectedValue: currentValue,
      setSelectedValue: (value) => {
        const newFilters = currentFilter ? [
          ...(view.filters ?? []).map((_filter) => {
            if (_filter.field === filter.field) {
              return {
                ..._filter,
                operator: currentFilter.operator || filter.operators[0],
                value
              };
            }
            return _filter;
          })
        ] : [
          ...view.filters ?? [],
          {
            field: filter.field,
            operator: filter.operators[0],
            value
          }
        ];
        onChangeView({
          ...view,
          page: 1,
          filters: newFilters
        });
      },
      setValue: setSearchValue,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", { className: "dataviews-filters__search-widget-filter-combobox__wrapper", children: [
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
            ComboboxLabel,
            {
              render: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(import_components15.VisuallyHidden, { children: (0, import_i18n17.__)("Search items") }),
              children: (0, import_i18n17.__)("Search items")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
            Combobox,
            {
              autoSelect: "always",
              placeholder: (0, import_i18n17.__)("Search"),
              className: "dataviews-filters__search-widget-filter-combobox__input"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("div", { className: "dataviews-filters__search-widget-filter-combobox__icon", children: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(import_components15.Icon, { icon: search_default }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)(
          ComboboxList,
          {
            className: "dataviews-filters__search-widget-filter-combobox-list",
            alwaysVisible: true,
            children: [
              matches.map((element) => {
                return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)(
                  ComboboxItem,
                  {
                    resetValueOnSelect: false,
                    value: element.value,
                    className: "dataviews-filters__search-widget-listitem",
                    hideOnClick: false,
                    setValueOnClick: false,
                    focusOnHover: true,
                    children: [
                      filter.singleSelection && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
                        SingleSelectionOption,
                        {
                          selected: currentValue === element.value
                        }
                      ),
                      !filter.singleSelection && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
                        MultiSelectionOption,
                        {
                          selected: currentValue.includes(
                            element.value
                          )
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("span", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
                          ComboboxItemValue,
                          {
                            className: "dataviews-filters__search-widget-filter-combobox-item-value",
                            value: element.label
                          }
                        ),
                        !!element.description && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("span", { className: "dataviews-filters__search-widget-listitem-description", children: element.description })
                      ] })
                    ]
                  },
                  element.value
                );
              }),
              !matches.length && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("p", { children: (0, import_i18n17.__)("No results found") })
            ]
          }
        )
      ]
    }
  );
}
function SearchWidget(props) {
  const { elements, isLoading } = useElements({
    elements: props.filter.elements,
    getElements: props.filter.getElements
  });
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("div", { className: "dataviews-filters__search-widget-no-elements", children: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(import_components15.Spinner, {}) });
  }
  if (elements.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("div", { className: "dataviews-filters__search-widget-no-elements", children: (0, import_i18n17.__)("No elements found") });
  }
  const Widget = elements.length > 10 ? ComboboxList3 : ListBox;
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(Widget, { ...props, filter: { ...props.filter, elements } });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/input-widget.js
var import_jsx_runtime55 = __toESM(require_jsx_runtime(), 1);
var import_es6 = __toESM(require_es6(), 1);
var import_compose8 = __toESM(require_compose(), 1);
var import_element19 = __toESM(require_element(), 1);
var import_components16 = __toESM(require_components(), 1);
function InputWidget({
  filter,
  view,
  onChangeView,
  fields
}) {
  const currentFilter = view.filters?.find(
    (f2) => f2.field === filter.field
  );
  const currentValue = getCurrentValue(filter, currentFilter);
  const field = (0, import_element19.useMemo)(() => {
    const currentField = fields.find((f2) => f2.id === filter.field);
    if (currentField) {
      return {
        ...currentField,
        // Deactivate validation for filters.
        isValid: {
          required: false,
          custom: () => null
        },
        // Configure getValue/setValue as if Item was a plain object.
        getValue: ({ item }) => item[currentField.id],
        setValue: ({ value }) => ({
          [currentField.id]: value
        })
      };
    }
    return currentField;
  }, [fields, filter.field]);
  const data = (0, import_element19.useMemo)(() => {
    return (view.filters ?? []).reduce(
      (acc, activeFilter) => {
        acc[activeFilter.field] = activeFilter.value;
        return acc;
      },
      {}
    );
  }, [view.filters]);
  const handleChange = (0, import_compose8.useEvent)((updatedData) => {
    if (!field || !currentFilter) {
      return;
    }
    const nextValue = field.getValue({ item: updatedData });
    if ((0, import_es6.default)(nextValue, currentValue)) {
      return;
    }
    onChangeView({
      ...view,
      filters: (view.filters ?? []).map(
        (_filter) => _filter.field === filter.field ? {
          ..._filter,
          operator: currentFilter.operator || filter.operators[0],
          // Consider empty strings as undefined:
          //
          // - undefined as value means the filter is unset: the filter widget displays no value and the search returns all records
          // - empty string as value means "search empty string": returns only the records that have an empty string as value
          //
          // In practice, this means the filter will not be able to find an empty string as the value.
          value: nextValue === "" ? void 0 : nextValue
        } : _filter
      )
    });
  });
  if (!field || !field.Edit || !currentFilter) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(
    import_components16.Flex,
    {
      className: "dataviews-filters__user-input-widget",
      gap: 2.5,
      direction: "column",
      children: /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(
        field.Edit,
        {
          hideLabelFromVision: true,
          data,
          field,
          operator: currentFilter.operator,
          onChange: handleChange
        }
      )
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/filter.js
var ENTER = "Enter";
var SPACE = " ";
var FilterText = ({
  activeElements,
  filterInView,
  filter
}) => {
  if (activeElements === void 0 || activeElements.length === 0) {
    return filter.name;
  }
  const filterTextWrappers = {
    Name: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { className: "dataviews-filters__summary-filter-text-name" }),
    Value: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { className: "dataviews-filters__summary-filter-text-value" })
  };
  if (filterInView?.operator === OPERATOR_IS_ANY) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Author is any: Admin, Editor". */
        (0, import_i18n18.__)("<Name>%1$s is any: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements.map((element) => element.label).join(", ")
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_IS_NONE) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Author is none: Admin, Editor". */
        (0, import_i18n18.__)("<Name>%1$s is none: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements.map((element) => element.label).join(", ")
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_IS_ALL) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Author is all: Admin, Editor". */
        (0, import_i18n18.__)("<Name>%1$s is all: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements.map((element) => element.label).join(", ")
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_IS_NOT_ALL) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Author is not all: Admin, Editor". */
        (0, import_i18n18.__)("<Name>%1$s is not all: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements.map((element) => element.label).join(", ")
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_IS) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Author is: Admin". */
        (0, import_i18n18.__)("<Name>%1$s is: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_IS_NOT) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Author is not: Admin". */
        (0, import_i18n18.__)("<Name>%1$s is not: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_LESS_THAN) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Price is less than: 10". */
        (0, import_i18n18.__)("<Name>%1$s is less than: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_GREATER_THAN) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Price is greater than: 10". */
        (0, import_i18n18.__)("<Name>%1$s is greater than: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_LESS_THAN_OR_EQUAL) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Price is less than or equal to: 10". */
        (0, import_i18n18.__)(
          "<Name>%1$s is less than or equal to: </Name><Value>%2$s</Value>"
        ),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_GREATER_THAN_OR_EQUAL) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Price is greater than or equal to: 10". */
        (0, import_i18n18.__)(
          "<Name>%1$s is greater than or equal to: </Name><Value>%2$s</Value>"
        ),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_CONTAINS) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Title contains: Mars". */
        (0, import_i18n18.__)("<Name>%1$s contains: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_NOT_CONTAINS) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Description doesn't contain: photo". */
        (0, import_i18n18.__)("<Name>%1$s doesn't contain: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_STARTS_WITH) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Title starts with: Mar". */
        (0, import_i18n18.__)("<Name>%1$s starts with: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_BEFORE) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is before: 2024-01-01". */
        (0, import_i18n18.__)("<Name>%1$s is before: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_AFTER) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is after: 2024-01-01". */
        (0, import_i18n18.__)("<Name>%1$s is after: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_BEFORE_INC) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is on or before: 2024-01-01". */
        (0, import_i18n18.__)("<Name>%1$s is on or before: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_AFTER_INC) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is on or after: 2024-01-01". */
        (0, import_i18n18.__)("<Name>%1$s is on or after: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_BETWEEN) {
    const { label } = activeElements[0];
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Min value. 3: Max value. e.g.: "Item count between (inc): 10 and 180". */
        (0, import_i18n18.__)(
          "<Name>%1$s between (inc): </Name><Value>%2$s and %3$s</Value>"
        ),
        filter.name,
        label[0],
        label[1]
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_ON) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is: 2024-01-01". */
        (0, import_i18n18.__)("<Name>%1$s is: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_NOT_ON) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is not: 2024-01-01". */
        (0, import_i18n18.__)("<Name>%1$s is not: </Name><Value>%2$s</Value>"),
        filter.name,
        activeElements[0].label
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_IN_THE_PAST) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is in the past: 1 days". */
        (0, import_i18n18.__)("<Name>%1$s is in the past: </Name><Value>%2$s</Value>"),
        filter.name,
        `${activeElements[0].value.value} ${activeElements[0].value.unit}`
      ),
      filterTextWrappers
    );
  }
  if (filterInView?.operator === OPERATOR_OVER) {
    return (0, import_element20.createInterpolateElement)(
      (0, import_i18n18.sprintf)(
        /* translators: 1: Filter name. 2: Filter value. e.g.: "Date is over: 1 days ago". */
        (0, import_i18n18.__)("<Name>%1$s is over: </Name><Value>%2$s</Value> ago"),
        filter.name,
        `${activeElements[0].value.value} ${activeElements[0].value.unit}`
      ),
      filterTextWrappers
    );
  }
  return (0, import_i18n18.sprintf)(
    /* translators: 1: Filter name e.g.: "Unknown status for Author". */
    (0, import_i18n18.__)("Unknown status for %1$s"),
    filter.name
  );
};
function OperatorSelector({
  filter,
  view,
  onChangeView
}) {
  const operatorOptions = filter.operators?.map((operator) => ({
    value: operator,
    label: OPERATORS[operator]?.label
  }));
  const currentFilter = view.filters?.find(
    (_filter) => _filter.field === filter.field
  );
  const value = currentFilter?.operator || filter.operators[0];
  return operatorOptions.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(
    import_components17.__experimentalHStack,
    {
      spacing: 2,
      justify: "flex-start",
      className: "dataviews-filters__summary-operators-container",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(import_components17.FlexItem, { className: "dataviews-filters__summary-operators-filter-name", children: filter.name }),
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
          import_components17.SelectControl,
          {
            className: "dataviews-filters__summary-operators-filter-select",
            label: (0, import_i18n18.__)("Conditions"),
            value,
            options: operatorOptions,
            onChange: (newValue) => {
              const operator = newValue;
              const currentOperator = currentFilter?.operator;
              const newFilters = currentFilter ? [
                ...(view.filters ?? []).map(
                  (_filter) => {
                    if (_filter.field === filter.field) {
                      const OPERATORS_SHOULD_RESET_VALUE = [
                        OPERATOR_BETWEEN,
                        OPERATOR_IN_THE_PAST,
                        OPERATOR_OVER
                      ];
                      const shouldResetValue = currentOperator && (OPERATORS_SHOULD_RESET_VALUE.includes(
                        currentOperator
                      ) || OPERATORS_SHOULD_RESET_VALUE.includes(
                        operator
                      ));
                      return {
                        ..._filter,
                        value: shouldResetValue ? void 0 : _filter.value,
                        operator
                      };
                    }
                    return _filter;
                  }
                )
              ] : [
                ...view.filters ?? [],
                {
                  field: filter.field,
                  operator,
                  value: void 0
                }
              ];
              onChangeView({
                ...view,
                page: 1,
                filters: newFilters
              });
            },
            size: "small",
            variant: "minimal",
            __nextHasNoMarginBottom: true,
            hideLabelFromVision: true
          }
        )
      ]
    }
  );
}
function Filter({
  addFilterRef,
  openedFilter,
  fields,
  ...commonProps
}) {
  const toggleRef = (0, import_element20.useRef)(null);
  const { filter, view, onChangeView } = commonProps;
  const filterInView = view.filters?.find(
    (f2) => f2.field === filter.field
  );
  let activeElements = [];
  const { elements } = useElements({
    elements: filter.elements,
    getElements: filter.getElements
  });
  if (elements.length > 0) {
    activeElements = elements.filter((element) => {
      if (filter.singleSelection) {
        return element.value === filterInView?.value;
      }
      return filterInView?.value?.includes(element.value);
    });
  } else if (filterInView?.value !== void 0) {
    activeElements = [
      {
        value: filterInView.value,
        label: filterInView.value
      }
    ];
  }
  const isPrimary = filter.isPrimary;
  const isLocked = filterInView?.isLocked;
  const hasValues = !isLocked && filterInView?.value !== void 0;
  const canResetOrRemove = !isLocked && (!isPrimary || hasValues);
  return /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
    import_components17.Dropdown,
    {
      defaultOpen: openedFilter === filter.field,
      contentClassName: "dataviews-filters__summary-popover",
      popoverProps: { placement: "bottom-start", role: "dialog" },
      onClose: () => {
        toggleRef.current?.focus();
      },
      renderToggle: ({ isOpen, onToggle }) => /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("div", { className: "dataviews-filters__summary-chip-container", children: [
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
          import_components17.Tooltip,
          {
            text: (0, import_i18n18.sprintf)(
              /* translators: 1: Filter name. */
              (0, import_i18n18.__)("Filter by: %1$s"),
              filter.name.toLowerCase()
            ),
            placement: "top",
            children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
              "div",
              {
                className: clsx_default(
                  "dataviews-filters__summary-chip",
                  {
                    "has-reset": canResetOrRemove,
                    "has-values": hasValues,
                    "is-not-clickable": isLocked
                  }
                ),
                role: "button",
                tabIndex: isLocked ? -1 : 0,
                onClick: () => {
                  if (!isLocked) {
                    onToggle();
                  }
                },
                onKeyDown: (event) => {
                  if (!isLocked && [ENTER, SPACE].includes(event.key)) {
                    onToggle();
                    event.preventDefault();
                  }
                },
                "aria-disabled": isLocked,
                "aria-pressed": isOpen,
                "aria-expanded": isOpen,
                ref: toggleRef,
                children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
                  FilterText,
                  {
                    activeElements,
                    filterInView,
                    filter
                  }
                )
              }
            )
          }
        ),
        canResetOrRemove && /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
          import_components17.Tooltip,
          {
            text: isPrimary ? (0, import_i18n18.__)("Reset") : (0, import_i18n18.__)("Remove"),
            placement: "top",
            children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
              "button",
              {
                className: clsx_default(
                  "dataviews-filters__summary-chip-remove",
                  { "has-values": hasValues }
                ),
                onClick: () => {
                  onChangeView({
                    ...view,
                    page: 1,
                    filters: view.filters?.filter(
                      (_filter) => _filter.field !== filter.field
                    )
                  });
                  if (!isPrimary) {
                    addFilterRef.current?.focus();
                  } else {
                    toggleRef.current?.focus();
                  }
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(import_components17.Icon, { icon: close_small_default })
              }
            )
          }
        )
      ] }),
      renderContent: () => {
        return /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)(import_components17.__experimentalVStack, { spacing: 0, justify: "flex-start", children: [
          /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(OperatorSelector, { ...commonProps }),
          commonProps.filter.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
            SearchWidget,
            {
              ...commonProps,
              filter: {
                ...commonProps.filter,
                elements
              }
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(InputWidget, { ...commonProps, fields })
        ] });
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/add-filter.js
var import_jsx_runtime57 = __toESM(require_jsx_runtime(), 1);
var import_components18 = __toESM(require_components(), 1);
var import_i18n19 = __toESM(require_i18n(), 1);
var import_element21 = __toESM(require_element(), 1);
var { Menu: Menu4 } = unlock(import_components18.privateApis);
function AddFilterMenu({
  filters,
  view,
  onChangeView,
  setOpenedFilter,
  triggerProps
}) {
  const inactiveFilters = filters.filter((filter) => !filter.isVisible);
  return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)(Menu4, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(Menu4.TriggerButton, { ...triggerProps }),
    /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(Menu4.Popover, { children: inactiveFilters.map((filter) => {
      return /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
        Menu4.Item,
        {
          onClick: () => {
            setOpenedFilter(filter.field);
            onChangeView({
              ...view,
              page: 1,
              filters: [
                ...view.filters || [],
                {
                  field: filter.field,
                  value: void 0,
                  operator: filter.operators[0]
                }
              ]
            });
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(Menu4.ItemLabel, { children: filter.name })
        },
        filter.field
      );
    }) })
  ] });
}
function AddFilter({ filters, view, onChangeView, setOpenedFilter }, ref) {
  if (!filters.length || filters.every(({ isPrimary }) => isPrimary)) {
    return null;
  }
  const inactiveFilters = filters.filter((filter) => !filter.isVisible);
  return /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
    AddFilterMenu,
    {
      triggerProps: {
        render: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
          import_components18.Button,
          {
            accessibleWhenDisabled: true,
            size: "compact",
            className: "dataviews-filters-button",
            variant: "tertiary",
            disabled: !inactiveFilters.length,
            ref
          }
        ),
        children: (0, import_i18n19.__)("Add filter")
      },
      ...{ filters, view, onChangeView, setOpenedFilter }
    }
  );
}
var add_filter_default = (0, import_element21.forwardRef)(AddFilter);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/reset-filters.js
var import_jsx_runtime58 = __toESM(require_jsx_runtime(), 1);
var import_components19 = __toESM(require_components(), 1);
var import_i18n20 = __toESM(require_i18n(), 1);
function ResetFilter({
  filters,
  view,
  onChangeView
}) {
  const isPrimary = (field) => filters.some(
    (_filter) => _filter.field === field && _filter.isPrimary
  );
  const isDisabled = !view.search && !view.filters?.some(
    (_filter) => !_filter.isLocked && (_filter.value !== void 0 || !isPrimary(_filter.field))
  );
  return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
    import_components19.Button,
    {
      disabled: isDisabled,
      accessibleWhenDisabled: true,
      size: "compact",
      variant: "tertiary",
      className: "dataviews-filters__reset-button",
      onClick: () => {
        onChangeView({
          ...view,
          page: 1,
          search: "",
          filters: view.filters?.filter((f2) => !!f2.isLocked) || []
        });
      },
      children: (0, import_i18n20.__)("Reset")
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/use-filters.js
var import_element22 = __toESM(require_element(), 1);
function useFilters(fields, view) {
  return (0, import_element22.useMemo)(() => {
    const filters = [];
    fields.forEach((field) => {
      if (field.filterBy === false || !field.hasElements && !field.Edit) {
        return;
      }
      const operators = field.filterBy.operators;
      const isPrimary = !!field.filterBy?.isPrimary;
      const isLocked = view.filters?.some(
        (f2) => f2.field === field.id && !!f2.isLocked
      ) ?? false;
      filters.push({
        field: field.id,
        name: field.label,
        elements: field.elements,
        getElements: field.getElements,
        hasElements: field.hasElements,
        singleSelection: operators.some(
          (op) => SINGLE_SELECTION_OPERATORS.includes(op)
        ),
        operators,
        isVisible: isLocked || isPrimary || !!view.filters?.some(
          (f2) => f2.field === field.id && ALL_OPERATORS.includes(f2.operator)
        ),
        isPrimary,
        isLocked
      });
    });
    filters.sort((a2, b2) => {
      if (a2.isLocked && !b2.isLocked) {
        return -1;
      }
      if (!a2.isLocked && b2.isLocked) {
        return 1;
      }
      if (a2.isPrimary && !b2.isPrimary) {
        return -1;
      }
      if (!a2.isPrimary && b2.isPrimary) {
        return 1;
      }
      return a2.name.localeCompare(b2.name);
    });
    return filters;
  }, [fields, view]);
}
var use_filters_default = useFilters;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/filters.js
function Filters({ className }) {
  const { fields, view, onChangeView, openedFilter, setOpenedFilter } = (0, import_element23.useContext)(dataviews_context_default);
  const addFilterRef = (0, import_element23.useRef)(null);
  const filters = use_filters_default(fields, view);
  const addFilter = /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
    add_filter_default,
    {
      filters,
      view,
      onChangeView,
      ref: addFilterRef,
      setOpenedFilter
    },
    "add-filter"
  );
  const visibleFilters = filters.filter((filter) => filter.isVisible);
  if (visibleFilters.length === 0) {
    return null;
  }
  const filterComponents = [
    ...visibleFilters.map((filter) => {
      return /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
        Filter,
        {
          filter,
          view,
          fields,
          onChangeView,
          addFilterRef,
          openedFilter
        },
        filter.field
      );
    }),
    addFilter
  ];
  filterComponents.push(
    /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
      ResetFilter,
      {
        filters,
        view,
        onChangeView
      },
      "reset-filters"
    )
  );
  return /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
    import_components20.__experimentalHStack,
    {
      justify: "flex-start",
      style: { width: "fit-content" },
      wrap: true,
      className,
      children: filterComponents
    }
  );
}
var filters_default = (0, import_element23.memo)(Filters);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/toggle.js
var import_jsx_runtime60 = __toESM(require_jsx_runtime(), 1);
var import_element24 = __toESM(require_element(), 1);
var import_components21 = __toESM(require_components(), 1);
var import_i18n21 = __toESM(require_i18n(), 1);
function FiltersToggle() {
  const {
    filters,
    view,
    onChangeView,
    setOpenedFilter,
    isShowingFilter,
    setIsShowingFilter
  } = (0, import_element24.useContext)(dataviews_context_default);
  const buttonRef = (0, import_element24.useRef)(null);
  const onChangeViewWithFilterVisibility = (0, import_element24.useCallback)(
    (_view) => {
      onChangeView(_view);
      setIsShowingFilter(true);
    },
    [onChangeView, setIsShowingFilter]
  );
  const visibleFilters = filters.filter((filter) => filter.isVisible);
  const hasVisibleFilters = !!visibleFilters.length;
  if (filters.length === 0) {
    return null;
  }
  const addFilterButtonProps = {
    label: (0, import_i18n21.__)("Add filter"),
    "aria-expanded": false,
    isPressed: false
  };
  const toggleFiltersButtonProps = {
    label: (0, import_i18n21._x)("Filter", "verb"),
    "aria-expanded": isShowingFilter,
    isPressed: isShowingFilter,
    onClick: () => {
      if (!isShowingFilter) {
        setOpenedFilter(null);
      }
      setIsShowingFilter(!isShowingFilter);
    }
  };
  const buttonComponent = /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
    import_components21.Button,
    {
      ref: buttonRef,
      className: "dataviews-filters__visibility-toggle",
      size: "compact",
      icon: funnel_default,
      ...hasVisibleFilters ? toggleFiltersButtonProps : addFilterButtonProps
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("div", { className: "dataviews-filters__container-visibility-toggle", children: !hasVisibleFilters ? /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
    AddFilterMenu,
    {
      filters,
      view,
      onChangeView: onChangeViewWithFilterVisibility,
      setOpenedFilter,
      triggerProps: { render: buttonComponent }
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
    FilterVisibilityToggle,
    {
      buttonRef,
      filtersCount: view.filters?.length,
      children: buttonComponent
    }
  ) });
}
function FilterVisibilityToggle({
  buttonRef,
  filtersCount,
  children
}) {
  (0, import_element24.useEffect)(
    () => () => {
      buttonRef.current?.focus();
    },
    [buttonRef]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)(import_jsx_runtime60.Fragment, { children: [
    children,
    !!filtersCount && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("span", { className: "dataviews-filters-toggle__count", children: filtersCount })
  ] });
}
var toggle_default = FiltersToggle;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-filters/filters-toggled.js
var import_jsx_runtime61 = __toESM(require_jsx_runtime(), 1);
var import_element25 = __toESM(require_element(), 1);
function FiltersToggled(props) {
  const { isShowingFilter } = (0, import_element25.useContext)(dataviews_context_default);
  if (!isShowingFilter) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(filters_default, { ...props });
}
var filters_toggled_default = FiltersToggled;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-layout/index.js
var import_jsx_runtime62 = __toESM(require_jsx_runtime(), 1);
var import_element26 = __toESM(require_element(), 1);
var import_i18n22 = __toESM(require_i18n(), 1);
function DataViewsLayout({ className }) {
  const {
    actions = [],
    data,
    fields,
    getItemId: getItemId2,
    getItemLevel,
    isLoading,
    view,
    onChangeView,
    selection,
    onChangeSelection,
    setOpenedFilter,
    onClickItem,
    isItemClickable,
    renderItemLink,
    defaultLayouts: defaultLayouts2,
    empty = /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("p", { children: (0, import_i18n22.__)("No results") })
  } = (0, import_element26.useContext)(dataviews_context_default);
  const ViewComponent = VIEW_LAYOUTS.find(
    (v2) => v2.type === view.type && defaultLayouts2[v2.type]
  )?.component;
  return /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(
    ViewComponent,
    {
      className,
      actions,
      data,
      fields,
      getItemId: getItemId2,
      getItemLevel,
      isLoading,
      onChangeView,
      onChangeSelection,
      selection,
      setOpenedFilter,
      onClickItem,
      renderItemLink,
      isItemClickable,
      view,
      empty
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-footer/index.js
var import_jsx_runtime63 = __toESM(require_jsx_runtime(), 1);
var import_components22 = __toESM(require_components(), 1);
var import_element27 = __toESM(require_element(), 1);
var EMPTY_ARRAY4 = [];
function DataViewsFooter() {
  const {
    view,
    paginationInfo: { totalItems = 0, totalPages },
    data,
    actions = EMPTY_ARRAY4
  } = (0, import_element27.useContext)(dataviews_context_default);
  const hasBulkActions = useSomeItemHasAPossibleBulkAction(actions, data) && [LAYOUT_TABLE, LAYOUT_GRID].includes(view.type);
  if (!totalItems || !totalPages || totalPages <= 1 && !hasBulkActions) {
    return null;
  }
  return !!totalItems && /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)(
    import_components22.__experimentalHStack,
    {
      expanded: false,
      justify: "end",
      className: "dataviews-footer",
      children: [
        hasBulkActions && /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(BulkActionsFooter, {}),
        /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(dataviews_pagination_default, {})
      ]
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-search/index.js
var import_jsx_runtime64 = __toESM(require_jsx_runtime(), 1);
var import_i18n23 = __toESM(require_i18n(), 1);
var import_element28 = __toESM(require_element(), 1);
var import_components23 = __toESM(require_components(), 1);
var import_compose9 = __toESM(require_compose(), 1);
var DataViewsSearch = (0, import_element28.memo)(function Search({ label }) {
  const { view, onChangeView } = (0, import_element28.useContext)(dataviews_context_default);
  const [search, setSearch, debouncedSearch] = (0, import_compose9.useDebouncedInput)(
    view.search
  );
  (0, import_element28.useEffect)(() => {
    setSearch(view.search ?? "");
  }, [view.search, setSearch]);
  const onChangeViewRef = (0, import_element28.useRef)(onChangeView);
  const viewRef = (0, import_element28.useRef)(view);
  (0, import_element28.useEffect)(() => {
    onChangeViewRef.current = onChangeView;
    viewRef.current = view;
  }, [onChangeView, view]);
  (0, import_element28.useEffect)(() => {
    if (debouncedSearch !== viewRef.current?.search) {
      onChangeViewRef.current({
        ...viewRef.current,
        page: 1,
        search: debouncedSearch
      });
    }
  }, [debouncedSearch]);
  const searchLabel = label || (0, import_i18n23.__)("Search");
  return /* @__PURE__ */ (0, import_jsx_runtime64.jsx)(
    import_components23.SearchControl,
    {
      className: "dataviews-search",
      __nextHasNoMarginBottom: true,
      onChange: setSearch,
      value: search,
      label: searchLabel,
      placeholder: searchLabel,
      size: "compact"
    }
  );
});
var dataviews_search_default = DataViewsSearch;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-view-config/index.js
var import_jsx_runtime66 = __toESM(require_jsx_runtime(), 1);
var import_components25 = __toESM(require_components(), 1);
var import_i18n25 = __toESM(require_i18n(), 1);
var import_element30 = __toESM(require_element(), 1);
var import_warning = __toESM(require_warning(), 1);
var import_compose10 = __toESM(require_compose(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-view-config/infinite-scroll-toggle.js
var import_jsx_runtime65 = __toESM(require_jsx_runtime(), 1);
var import_components24 = __toESM(require_components(), 1);
var import_i18n24 = __toESM(require_i18n(), 1);
var import_element29 = __toESM(require_element(), 1);
function InfiniteScrollToggle() {
  const context = (0, import_element29.useContext)(dataviews_context_default);
  const { view, onChangeView } = context;
  const infiniteScrollEnabled = view.infiniteScrollEnabled ?? false;
  if (!context.hasInfiniteScrollHandler) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime65.jsx)(
    import_components24.ToggleControl,
    {
      __nextHasNoMarginBottom: true,
      label: (0, import_i18n24.__)("Enable infinite scroll"),
      help: (0, import_i18n24.__)(
        "Automatically load more content as you scroll, instead of showing pagination links."
      ),
      checked: infiniteScrollEnabled,
      onChange: (newValue) => {
        onChangeView({
          ...view,
          infiniteScrollEnabled: newValue
        });
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews-view-config/index.js
var { Menu: Menu5 } = unlock(import_components25.privateApis);
var DATAVIEWS_CONFIG_POPOVER_PROPS = {
  className: "dataviews-config__popover",
  placement: "bottom-end",
  offset: 9
};
function ViewTypeMenu() {
  const { view, onChangeView, defaultLayouts: defaultLayouts2 } = (0, import_element30.useContext)(dataviews_context_default);
  const availableLayouts = Object.keys(defaultLayouts2);
  if (availableLayouts.length <= 1) {
    return null;
  }
  const activeView = VIEW_LAYOUTS.find((v2) => view.type === v2.type);
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(Menu5, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
      Menu5.TriggerButton,
      {
        render: /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
          import_components25.Button,
          {
            size: "compact",
            icon: activeView?.icon,
            label: (0, import_i18n25.__)("Layout")
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(Menu5.Popover, { children: availableLayouts.map((layout) => {
      const config = VIEW_LAYOUTS.find(
        (v2) => v2.type === layout
      );
      if (!config) {
        return null;
      }
      return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        Menu5.RadioItem,
        {
          value: layout,
          name: "view-actions-available-view",
          checked: layout === view.type,
          hideOnClick: true,
          onChange: (e2) => {
            switch (e2.target.value) {
              case "list":
              case "grid":
              case "table":
              case "pickerGrid":
                const viewWithoutLayout = { ...view };
                if ("layout" in viewWithoutLayout) {
                  delete viewWithoutLayout.layout;
                }
                return onChangeView({
                  ...viewWithoutLayout,
                  type: e2.target.value,
                  ...defaultLayouts2[e2.target.value]
                });
            }
            (0, import_warning.default)("Invalid dataview");
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(Menu5.ItemLabel, { children: config.label })
        },
        layout
      );
    }) })
  ] });
}
function SortFieldControl() {
  const { view, fields, onChangeView } = (0, import_element30.useContext)(dataviews_context_default);
  const orderOptions = (0, import_element30.useMemo)(() => {
    const sortableFields = fields.filter(
      (field) => field.enableSorting !== false
    );
    return sortableFields.map((field) => {
      return {
        label: field.label,
        value: field.id
      };
    });
  }, [fields]);
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
    import_components25.SelectControl,
    {
      __nextHasNoMarginBottom: true,
      __next40pxDefaultSize: true,
      label: (0, import_i18n25.__)("Sort by"),
      value: view.sort?.field,
      options: orderOptions,
      onChange: (value) => {
        onChangeView({
          ...view,
          sort: {
            direction: view?.sort?.direction || "desc",
            field: value
          },
          showLevels: false
        });
      }
    }
  );
}
function SortDirectionControl() {
  const { view, fields, onChangeView } = (0, import_element30.useContext)(dataviews_context_default);
  const sortableFields = fields.filter(
    (field) => field.enableSorting !== false
  );
  if (sortableFields.length === 0) {
    return null;
  }
  let value = view.sort?.direction;
  if (!value && view.sort?.field) {
    value = "desc";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
    import_components25.__experimentalToggleGroupControl,
    {
      className: "dataviews-view-config__sort-direction",
      __nextHasNoMarginBottom: true,
      __next40pxDefaultSize: true,
      isBlock: true,
      label: (0, import_i18n25.__)("Order"),
      value,
      onChange: (newDirection) => {
        if (newDirection === "asc" || newDirection === "desc") {
          onChangeView({
            ...view,
            sort: {
              direction: newDirection,
              field: view.sort?.field || // If there is no field assigned as the sorting field assign the first sortable field.
              fields.find(
                (field) => field.enableSorting !== false
              )?.id || ""
            },
            showLevels: false
          });
          return;
        }
        (0, import_warning.default)("Invalid direction");
      },
      children: SORTING_DIRECTIONS.map((direction) => {
        return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
          import_components25.__experimentalToggleGroupControlOptionIcon,
          {
            value: direction,
            icon: sortIcons[direction],
            label: sortLabels[direction]
          },
          direction
        );
      })
    }
  );
}
function ItemsPerPageControl() {
  const { view, config, onChangeView } = (0, import_element30.useContext)(dataviews_context_default);
  const { infiniteScrollEnabled } = view;
  if (!config || !config.perPageSizes || config.perPageSizes.length < 2 || config.perPageSizes.length > 6 || infiniteScrollEnabled) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
    import_components25.__experimentalToggleGroupControl,
    {
      __nextHasNoMarginBottom: true,
      __next40pxDefaultSize: true,
      isBlock: true,
      label: (0, import_i18n25.__)("Items per page"),
      value: view.perPage || 10,
      disabled: !view?.sort?.field,
      onChange: (newItemsPerPage) => {
        const newItemsPerPageNumber = typeof newItemsPerPage === "number" || newItemsPerPage === void 0 ? newItemsPerPage : parseInt(newItemsPerPage, 10);
        onChangeView({
          ...view,
          perPage: newItemsPerPageNumber,
          page: 1
        });
      },
      children: config.perPageSizes.map((value) => {
        return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
          import_components25.__experimentalToggleGroupControlOption,
          {
            value,
            label: value.toString()
          },
          value
        );
      })
    }
  );
}
function PreviewOptions({
  previewOptions,
  onChangePreviewOption,
  onMenuOpenChange,
  activeOption
}) {
  const focusPreviewOptionsField = (id) => {
    setTimeout(() => {
      const element = document.querySelector(
        `.dataviews-field-control__field-${id} .dataviews-field-control__field-preview-options-button`
      );
      if (element instanceof HTMLElement) {
        element.focus();
      }
    }, 50);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(Menu5, { onOpenChange: onMenuOpenChange, children: [
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
      Menu5.TriggerButton,
      {
        render: /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
          import_components25.Button,
          {
            className: "dataviews-field-control__field-preview-options-button",
            size: "compact",
            icon: more_vertical_default,
            label: (0, import_i18n25.__)("Preview")
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(Menu5.Popover, { children: previewOptions?.map(({ id, label }) => {
      return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        Menu5.RadioItem,
        {
          value: id,
          checked: id === activeOption,
          onChange: () => {
            onChangePreviewOption?.(id);
            focusPreviewOptionsField(id);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(Menu5.ItemLabel, { children: label })
        },
        id
      );
    }) })
  ] });
}
function FieldItem({
  field,
  label,
  description,
  isVisible: isVisible2,
  isFirst,
  isLast,
  canMove = true,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  previewOptions,
  onChangePreviewOption
}) {
  const [isChangingPreviewOption, setIsChangingPreviewOption] = (0, import_element30.useState)(false);
  const focusVisibilityField = () => {
    setTimeout(() => {
      const element = document.querySelector(
        `.dataviews-field-control__field-${field.id} .dataviews-field-control__field-visibility-button`
      );
      if (element instanceof HTMLElement) {
        element.focus();
      }
    }, 50);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(import_components25.__experimentalItem, { children: /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(
    import_components25.__experimentalHStack,
    {
      expanded: true,
      className: clsx_default(
        "dataviews-field-control__field",
        `dataviews-field-control__field-${field.id}`,
        // The actions are hidden when the mouse is not hovering the item, or focus
        // is outside the item.
        // For actions that require a popover, a menu etc, that would mean that when the interactive element
        // opens and the focus goes there the actions would be hidden.
        // To avoid that we add a class to the item, that makes sure actions are visible while there is some
        // interaction with the item.
        { "is-interacting": isChangingPreviewOption }
      ),
      justify: "flex-start",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("span", { className: "dataviews-field-control__icon", children: !canMove && !field.enableHiding && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(import_components25.Icon, { icon: lock_default }) }),
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("span", { className: "dataviews-field-control__label-sub-label-container", children: [
          /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("span", { className: "dataviews-field-control__label", children: label || field.label }),
          description && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)("span", { className: "dataviews-field-control__sub-label", children: description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(
          import_components25.__experimentalHStack,
          {
            justify: "flex-end",
            expanded: false,
            className: "dataviews-field-control__actions",
            children: [
              isVisible2 && /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_jsx_runtime66.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
                  import_components25.Button,
                  {
                    disabled: isFirst || !canMove,
                    accessibleWhenDisabled: true,
                    size: "compact",
                    onClick: onMoveUp,
                    icon: chevron_up_default,
                    label: isFirst || !canMove ? (0, import_i18n25.__)("This field can't be moved up") : (0, import_i18n25.sprintf)(
                      /* translators: %s: field label */
                      (0, import_i18n25.__)("Move %s up"),
                      field.label
                    )
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
                  import_components25.Button,
                  {
                    disabled: isLast || !canMove,
                    accessibleWhenDisabled: true,
                    size: "compact",
                    onClick: onMoveDown,
                    icon: chevron_down_default,
                    label: isLast || !canMove ? (0, import_i18n25.__)("This field can't be moved down") : (0, import_i18n25.sprintf)(
                      /* translators: %s: field label */
                      (0, import_i18n25.__)("Move %s down"),
                      field.label
                    )
                  }
                )
              ] }),
              onToggleVisibility && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
                import_components25.Button,
                {
                  className: "dataviews-field-control__field-visibility-button",
                  disabled: !field.enableHiding,
                  accessibleWhenDisabled: true,
                  size: "compact",
                  onClick: () => {
                    onToggleVisibility();
                    focusVisibilityField();
                  },
                  icon: isVisible2 ? unseen_default : seen_default,
                  label: isVisible2 ? (0, import_i18n25.sprintf)(
                    /* translators: %s: field label */
                    (0, import_i18n25._x)("Hide %s", "field"),
                    field.label
                  ) : (0, import_i18n25.sprintf)(
                    /* translators: %s: field label */
                    (0, import_i18n25._x)("Show %s", "field"),
                    field.label
                  )
                }
              ),
              previewOptions && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
                PreviewOptions,
                {
                  previewOptions,
                  onChangePreviewOption,
                  onMenuOpenChange: setIsChangingPreviewOption,
                  activeOption: field.id
                }
              )
            ]
          }
        )
      ]
    }
  ) });
}
function RegularFieldItem({
  index,
  field,
  view,
  onChangeView
}) {
  const visibleFieldIds = view.fields ?? [];
  const isVisible2 = index !== void 0 && visibleFieldIds.includes(field.id);
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
    FieldItem,
    {
      field,
      isVisible: isVisible2,
      isFirst: index !== void 0 && index < 1,
      isLast: index !== void 0 && index === visibleFieldIds.length - 1,
      onToggleVisibility: () => {
        onChangeView({
          ...view,
          fields: isVisible2 ? visibleFieldIds.filter(
            (fieldId) => fieldId !== field.id
          ) : [...visibleFieldIds, field.id]
        });
      },
      onMoveUp: index !== void 0 ? () => {
        onChangeView({
          ...view,
          fields: [
            ...visibleFieldIds.slice(
              0,
              index - 1
            ) ?? [],
            field.id,
            visibleFieldIds[index - 1],
            ...visibleFieldIds.slice(index + 1)
          ]
        });
      } : void 0,
      onMoveDown: index !== void 0 ? () => {
        onChangeView({
          ...view,
          fields: [
            ...visibleFieldIds.slice(0, index) ?? [],
            visibleFieldIds[index + 1],
            field.id,
            ...visibleFieldIds.slice(index + 2)
          ]
        });
      } : void 0
    }
  );
}
function isDefined2(item) {
  return !!item;
}
function FieldControl() {
  const { view, fields, onChangeView } = (0, import_element30.useContext)(dataviews_context_default);
  const togglableFields = [
    view?.titleField,
    view?.mediaField,
    view?.descriptionField
  ].filter(Boolean);
  const visibleFieldIds = view.fields ?? [];
  const hiddenFields = fields.filter(
    (f2) => !visibleFieldIds.includes(f2.id) && !togglableFields.includes(f2.id) && f2.type !== "media" && f2.enableHiding !== false
  );
  let visibleFields = visibleFieldIds.map((fieldId) => fields.find((f2) => f2.id === fieldId)).filter(isDefined2);
  if (!visibleFields?.length && !hiddenFields?.length) {
    return null;
  }
  const titleField = fields.find((f2) => f2.id === view.titleField);
  const previewField = fields.find((f2) => f2.id === view.mediaField);
  const descriptionField = fields.find(
    (f2) => f2.id === view.descriptionField
  );
  const previewFields = fields.filter((f2) => f2.type === "media");
  let previewFieldUI;
  if (previewFields.length > 1) {
    const isPreviewFieldVisible = isDefined2(previewField) && (view.showMedia ?? true);
    previewFieldUI = isDefined2(previewField) && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
      FieldItem,
      {
        field: previewField,
        label: (0, import_i18n25.__)("Preview"),
        description: previewField.label,
        isVisible: isPreviewFieldVisible,
        onToggleVisibility: () => {
          onChangeView({
            ...view,
            showMedia: !isPreviewFieldVisible
          });
        },
        canMove: false,
        previewOptions: previewFields.map((field) => ({
          label: field.label,
          id: field.id
        })),
        onChangePreviewOption: (newPreviewId) => onChangeView({ ...view, mediaField: newPreviewId })
      },
      previewField.id
    );
  }
  const lockedFields = [
    {
      field: titleField,
      isVisibleFlag: "showTitle"
    },
    {
      field: previewField,
      isVisibleFlag: "showMedia",
      ui: previewFieldUI
    },
    {
      field: descriptionField,
      isVisibleFlag: "showDescription"
    }
  ].filter(({ field }) => isDefined2(field));
  let visibleLockedFields = lockedFields.filter(
    ({ field, isVisibleFlag }) => (
      // @ts-expect-error
      isDefined2(field) && (view[isVisibleFlag] ?? true)
    )
  );
  if (visibleLockedFields.length === 1) {
    visibleLockedFields = visibleLockedFields.map((locked) => ({
      ...locked,
      field: { ...locked.field, enableHiding: false }
    }));
  }
  if (visibleLockedFields.length === 0 && visibleFields.length === 1) {
    visibleFields = [{ ...visibleFields[0], enableHiding: false }];
  }
  const hiddenLockedFields = lockedFields.filter(
    ({ field, isVisibleFlag }) => (
      // @ts-expect-error
      isDefined2(field) && !(view[isVisibleFlag] ?? true)
    )
  );
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalVStack, { className: "dataviews-field-control", spacing: 6, children: [
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(import_components25.__experimentalVStack, { className: "dataviews-view-config__properties", spacing: 0, children: (visibleLockedFields.length > 0 || !!visibleFields?.length) && /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalItemGroup, { isBordered: true, isSeparated: true, children: [
      visibleLockedFields.map(
        ({ field, isVisibleFlag, ui }) => {
          return ui ?? /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
            FieldItem,
            {
              field,
              isVisible: true,
              onToggleVisibility: () => {
                onChangeView({
                  ...view,
                  [isVisibleFlag]: false
                });
              },
              canMove: false
            },
            field.id
          );
        }
      ),
      visibleFields.map((field, index) => /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        RegularFieldItem,
        {
          field,
          view,
          onChangeView,
          index
        },
        field.id
      ))
    ] }) }),
    (!!hiddenFields?.length || !!hiddenLockedFields.length) && /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalVStack, { spacing: 4, children: [
      /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(import_components25.BaseControl.VisualLabel, { style: { margin: 0 }, children: (0, import_i18n25.__)("Hidden") }),
      /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        import_components25.__experimentalVStack,
        {
          className: "dataviews-view-config__properties",
          spacing: 0,
          children: /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalItemGroup, { isBordered: true, isSeparated: true, children: [
            hiddenLockedFields.length > 0 && hiddenLockedFields.map(
              ({ field, isVisibleFlag, ui }) => {
                return ui ?? /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
                  FieldItem,
                  {
                    field,
                    isVisible: false,
                    onToggleVisibility: () => {
                      onChangeView({
                        ...view,
                        [isVisibleFlag]: true
                      });
                    },
                    canMove: false
                  },
                  field.id
                );
              }
            ),
            hiddenFields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
              RegularFieldItem,
              {
                field,
                view,
                onChangeView
              },
              field.id
            ))
          ] })
        }
      )
    ] })
  ] });
}
function SettingsSection({
  title,
  description,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalGrid, { columns: 12, className: "dataviews-settings-section", gap: 4, children: [
    /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)("div", { className: "dataviews-settings-section__sidebar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        import_components25.__experimentalHeading,
        {
          level: 2,
          className: "dataviews-settings-section__title",
          children: title
        }
      ),
      description && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        import_components25.__experimentalText,
        {
          variant: "muted",
          className: "dataviews-settings-section__description",
          children: description
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
      import_components25.__experimentalGrid,
      {
        columns: 8,
        gap: 4,
        className: "dataviews-settings-section__content",
        children
      }
    )
  ] });
}
function DataviewsViewConfigDropdown() {
  const { view } = (0, import_element30.useContext)(dataviews_context_default);
  const popoverId = (0, import_compose10.useInstanceId)(
    _DataViewsViewConfig,
    "dataviews-view-config-dropdown"
  );
  const activeLayout = VIEW_LAYOUTS.find(
    (layout) => layout.type === view.type
  );
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
    import_components25.Dropdown,
    {
      expandOnMobile: true,
      popoverProps: {
        ...DATAVIEWS_CONFIG_POPOVER_PROPS,
        id: popoverId
      },
      renderToggle: ({ onToggle, isOpen }) => {
        return /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
          import_components25.Button,
          {
            size: "compact",
            icon: cog_default,
            label: (0, import_i18n25._x)("View options", "View is used as a noun"),
            onClick: onToggle,
            "aria-expanded": isOpen ? "true" : "false",
            "aria-controls": popoverId
          }
        );
      },
      renderContent: () => /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(
        import_components25.__experimentalDropdownContentWrapper,
        {
          paddingSize: "medium",
          className: "dataviews-config__popover-content-wrapper",
          children: /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalVStack, { className: "dataviews-view-config", spacing: 6, children: [
            /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(SettingsSection, { title: (0, import_i18n25.__)("Appearance"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_components25.__experimentalHStack, { expanded: true, className: "is-divided-in-two", children: [
                /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(SortFieldControl, {}),
                /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(SortDirectionControl, {})
              ] }),
              !!activeLayout?.viewConfigOptions && /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(activeLayout.viewConfigOptions, {}),
              /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(InfiniteScrollToggle, {}),
              /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(ItemsPerPageControl, {})
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(SettingsSection, { title: (0, import_i18n25.__)("Properties"), children: /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(FieldControl, {}) })
          ] })
        }
      )
    }
  );
}
function _DataViewsViewConfig() {
  return /* @__PURE__ */ (0, import_jsx_runtime66.jsxs)(import_jsx_runtime66.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(ViewTypeMenu, {}),
    /* @__PURE__ */ (0, import_jsx_runtime66.jsx)(DataviewsViewConfigDropdown, {})
  ] });
}
var DataViewsViewConfig = (0, import_element30.memo)(_DataViewsViewConfig);
var dataviews_view_config_default = DataViewsViewConfig;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/index.js
var import_jsx_runtime78 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/email.js
var import_jsx_runtime67 = __toESM(require_jsx_runtime(), 1);
var import_i18n26 = __toESM(require_i18n(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/utils/render-from-elements.js
function RenderFromElements({
  item,
  field
}) {
  const { elements, isLoading } = useElements({
    elements: field.elements,
    getElements: field.getElements
  });
  const value = field.getValue({ item });
  if (isLoading) {
    return value;
  }
  if (elements.length === 0) {
    return value;
  }
  return elements?.find((element) => element.value === value)?.label || field.getValue({ item });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/email.js
function sort(valueA, valueB, direction) {
  return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
}
var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var email_default = {
  sort,
  isValid: {
    elements: true,
    custom: (item, field) => {
      const value = field.getValue({ item });
      if (![void 0, "", null].includes(value) && !emailRegex.test(value)) {
        return (0, import_i18n26.__)("Value must be a valid email address.");
      }
      return null;
    }
  },
  Edit: "email",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime67.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS_ANY, OPERATOR_IS_NONE],
    validOperators: [
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_CONTAINS,
      OPERATOR_NOT_CONTAINS,
      OPERATOR_STARTS_WITH,
      // Multiple selection
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/integer.js
var import_jsx_runtime68 = __toESM(require_jsx_runtime(), 1);
var import_i18n27 = __toESM(require_i18n(), 1);
function sort2(a2, b2, direction) {
  return direction === "asc" ? a2 - b2 : b2 - a2;
}
var integer_default = {
  sort: sort2,
  isValid: {
    elements: true,
    custom: (item, field) => {
      const value = field.getValue({ item });
      if (![void 0, "", null].includes(value) && !Number.isInteger(value)) {
        return (0, import_i18n27.__)("Value must be an integer.");
      }
      return null;
    }
  },
  Edit: "integer",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime68.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_LESS_THAN,
      OPERATOR_GREATER_THAN,
      OPERATOR_LESS_THAN_OR_EQUAL,
      OPERATOR_GREATER_THAN_OR_EQUAL,
      OPERATOR_BETWEEN
    ],
    validOperators: [
      // Single-selection
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_LESS_THAN,
      OPERATOR_GREATER_THAN,
      OPERATOR_LESS_THAN_OR_EQUAL,
      OPERATOR_GREATER_THAN_OR_EQUAL,
      OPERATOR_BETWEEN,
      // Multiple-selection
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/number.js
var import_jsx_runtime69 = __toESM(require_jsx_runtime(), 1);
var import_i18n28 = __toESM(require_i18n(), 1);
function sort3(a2, b2, direction) {
  return direction === "asc" ? a2 - b2 : b2 - a2;
}
function isEmpty2(value) {
  return value === "" || value === void 0 || value === null;
}
var number_default = {
  sort: sort3,
  isValid: {
    elements: true,
    custom: (item, field) => {
      const value = field.getValue({ item });
      if (!isEmpty2(value) && !Number.isFinite(value)) {
        return (0, import_i18n28.__)("Value must be a number.");
      }
      return null;
    }
  },
  Edit: "number",
  render: ({ item, field }) => {
    if (field.hasElements) {
      /* @__PURE__ */ (0, import_jsx_runtime69.jsx)(RenderFromElements, { item, field });
    }
    const value = field.getValue({ item });
    if (![null, void 0].includes(value)) {
      return Number(value).toFixed(2);
    }
    return null;
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_LESS_THAN,
      OPERATOR_GREATER_THAN,
      OPERATOR_LESS_THAN_OR_EQUAL,
      OPERATOR_GREATER_THAN_OR_EQUAL,
      OPERATOR_BETWEEN
    ],
    validOperators: [
      // Single-selection
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_LESS_THAN,
      OPERATOR_GREATER_THAN,
      OPERATOR_LESS_THAN_OR_EQUAL,
      OPERATOR_GREATER_THAN_OR_EQUAL,
      OPERATOR_BETWEEN,
      // Multiple-selection
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/text.js
var import_jsx_runtime70 = __toESM(require_jsx_runtime(), 1);
function sort4(valueA, valueB, direction) {
  return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
}
var text_default = {
  sort: sort4,
  isValid: {
    elements: true,
    custom: () => null
  },
  Edit: "text",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime70.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS_ANY, OPERATOR_IS_NONE],
    validOperators: [
      // Single selection
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_CONTAINS,
      OPERATOR_NOT_CONTAINS,
      OPERATOR_STARTS_WITH,
      // Multiple selection
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/datetime.js
var import_jsx_runtime71 = __toESM(require_jsx_runtime(), 1);
function sort5(a2, b2, direction) {
  const timeA = new Date(a2).getTime();
  const timeB = new Date(b2).getTime();
  return direction === "asc" ? timeA - timeB : timeB - timeA;
}
var datetime_default = {
  sort: sort5,
  isValid: {
    elements: true,
    custom: () => null
  },
  Edit: "datetime",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime71.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [
      OPERATOR_ON,
      OPERATOR_NOT_ON,
      OPERATOR_BEFORE,
      OPERATOR_AFTER,
      OPERATOR_BEFORE_INC,
      OPERATOR_AFTER_INC,
      OPERATOR_IN_THE_PAST,
      OPERATOR_OVER
    ],
    validOperators: [
      OPERATOR_ON,
      OPERATOR_NOT_ON,
      OPERATOR_BEFORE,
      OPERATOR_AFTER,
      OPERATOR_BEFORE_INC,
      OPERATOR_AFTER_INC,
      OPERATOR_IN_THE_PAST,
      OPERATOR_OVER
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/date.js
var import_jsx_runtime72 = __toESM(require_jsx_runtime(), 1);
var import_date = __toESM(require_date(), 1);
var getFormattedDate = (dateToDisplay) => (0, import_date.dateI18n)((0, import_date.getSettings)().formats.date, (0, import_date.getDate)(dateToDisplay));
function sort6(a2, b2, direction) {
  const timeA = new Date(a2).getTime();
  const timeB = new Date(b2).getTime();
  return direction === "asc" ? timeA - timeB : timeB - timeA;
}
var date_default = {
  sort: sort6,
  Edit: "date",
  isValid: {
    elements: true,
    custom: () => null
  },
  render: ({ item, field }) => {
    if (field.hasElements) {
      return /* @__PURE__ */ (0, import_jsx_runtime72.jsx)(RenderFromElements, { item, field });
    }
    const value = field.getValue({ item });
    if (!value) {
      return "";
    }
    return getFormattedDate(value);
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [
      OPERATOR_ON,
      OPERATOR_NOT_ON,
      OPERATOR_BEFORE,
      OPERATOR_AFTER,
      OPERATOR_BEFORE_INC,
      OPERATOR_AFTER_INC,
      OPERATOR_IN_THE_PAST,
      OPERATOR_OVER,
      OPERATOR_BETWEEN
    ],
    validOperators: [
      OPERATOR_ON,
      OPERATOR_NOT_ON,
      OPERATOR_BEFORE,
      OPERATOR_AFTER,
      OPERATOR_BEFORE_INC,
      OPERATOR_AFTER_INC,
      OPERATOR_IN_THE_PAST,
      OPERATOR_OVER,
      OPERATOR_BETWEEN
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/boolean.js
var import_jsx_runtime73 = __toESM(require_jsx_runtime(), 1);
var import_i18n29 = __toESM(require_i18n(), 1);
function sort7(a2, b2, direction) {
  const boolA = Boolean(a2);
  const boolB = Boolean(b2);
  if (boolA === boolB) {
    return 0;
  }
  if (direction === "asc") {
    return boolA ? 1 : -1;
  }
  return boolA ? -1 : 1;
}
var boolean_default = {
  sort: sort7,
  isValid: {
    elements: true,
    custom: (item, field) => {
      const value = field.getValue({ item });
      if (![void 0, "", null].includes(value) && ![true, false].includes(value)) {
        return (0, import_i18n29.__)("Value must be true, false, or undefined");
      }
      return null;
    }
  },
  Edit: "checkbox",
  render: ({ item, field }) => {
    if (field.hasElements) {
      return /* @__PURE__ */ (0, import_jsx_runtime73.jsx)(RenderFromElements, { item, field });
    }
    if (field.getValue({ item }) === true) {
      return (0, import_i18n29.__)("True");
    }
    if (field.getValue({ item }) === false) {
      return (0, import_i18n29.__)("False");
    }
    return null;
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS, OPERATOR_IS_NOT],
    validOperators: [OPERATOR_IS, OPERATOR_IS_NOT]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/media.js
function sort8() {
  return 0;
}
var media_default = {
  sort: sort8,
  isValid: {
    elements: true,
    custom: () => null
  },
  Edit: null,
  render: () => null,
  enableSorting: false,
  filterBy: false
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/array.js
var import_i18n30 = __toESM(require_i18n(), 1);
function sort9(valueA, valueB, direction) {
  const arrA = Array.isArray(valueA) ? valueA : [];
  const arrB = Array.isArray(valueB) ? valueB : [];
  if (arrA.length !== arrB.length) {
    return direction === "asc" ? arrA.length - arrB.length : arrB.length - arrA.length;
  }
  const joinedA = arrA.join(",");
  const joinedB = arrB.join(",");
  return direction === "asc" ? joinedA.localeCompare(joinedB) : joinedB.localeCompare(joinedA);
}
function render({ item, field }) {
  const value = field.getValue({ item }) || [];
  return value.join(", ");
}
var arrayFieldType = {
  sort: sort9,
  isValid: {
    elements: true,
    custom: (item, field) => {
      const value = field.getValue({ item });
      if (![void 0, "", null].includes(value) && !Array.isArray(value)) {
        return (0, import_i18n30.__)("Value must be an array.");
      }
      if (!value.every((v2) => typeof v2 === "string")) {
        return (0, import_i18n30.__)("Every value must be a string.");
      }
      return null;
    }
  },
  Edit: "array",
  // Use array control
  render,
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS_ANY, OPERATOR_IS_NONE],
    validOperators: [
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};
var array_default = arrayFieldType;

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/password.js
var import_jsx_runtime74 = __toESM(require_jsx_runtime(), 1);
function sort10(valueA, valueB, direction) {
  return 0;
}
var password_default = {
  sort: sort10,
  isValid: {
    elements: true,
    custom: () => null
  },
  Edit: "password",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime74.jsx)(RenderFromElements, { item, field }) : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  },
  enableSorting: false,
  filterBy: false
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/telephone.js
var import_jsx_runtime75 = __toESM(require_jsx_runtime(), 1);
function sort11(valueA, valueB, direction) {
  return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
}
var telephone_default = {
  sort: sort11,
  isValid: {
    elements: true,
    custom: () => null
  },
  Edit: "telephone",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime75.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS_ANY, OPERATOR_IS_NONE],
    validOperators: [
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_CONTAINS,
      OPERATOR_NOT_CONTAINS,
      OPERATOR_STARTS_WITH,
      // Multiple selection
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/color.js
var import_jsx_runtime76 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/colord@2.9.3/node_modules/colord/index.mjs
var r2 = { grad: 0.9, turn: 360, rad: 360 / (2 * Math.PI) };
var t = function(r3) {
  return "string" == typeof r3 ? r3.length > 0 : "number" == typeof r3;
};
var n = function(r3, t2, n2) {
  return void 0 === t2 && (t2 = 0), void 0 === n2 && (n2 = Math.pow(10, t2)), Math.round(n2 * r3) / n2 + 0;
};
var e = function(r3, t2, n2) {
  return void 0 === t2 && (t2 = 0), void 0 === n2 && (n2 = 1), r3 > n2 ? n2 : r3 > t2 ? r3 : t2;
};
var u = function(r3) {
  return (r3 = isFinite(r3) ? r3 % 360 : 0) > 0 ? r3 : r3 + 360;
};
var a = function(r3) {
  return { r: e(r3.r, 0, 255), g: e(r3.g, 0, 255), b: e(r3.b, 0, 255), a: e(r3.a) };
};
var o = function(r3) {
  return { r: n(r3.r), g: n(r3.g), b: n(r3.b), a: n(r3.a, 3) };
};
var i = /^#([0-9a-f]{3,8})$/i;
var s = function(r3) {
  var t2 = r3.toString(16);
  return t2.length < 2 ? "0" + t2 : t2;
};
var h = function(r3) {
  var t2 = r3.r, n2 = r3.g, e2 = r3.b, u2 = r3.a, a2 = Math.max(t2, n2, e2), o2 = a2 - Math.min(t2, n2, e2), i2 = o2 ? a2 === t2 ? (n2 - e2) / o2 : a2 === n2 ? 2 + (e2 - t2) / o2 : 4 + (t2 - n2) / o2 : 0;
  return { h: 60 * (i2 < 0 ? i2 + 6 : i2), s: a2 ? o2 / a2 * 100 : 0, v: a2 / 255 * 100, a: u2 };
};
var b = function(r3) {
  var t2 = r3.h, n2 = r3.s, e2 = r3.v, u2 = r3.a;
  t2 = t2 / 360 * 6, n2 /= 100, e2 /= 100;
  var a2 = Math.floor(t2), o2 = e2 * (1 - n2), i2 = e2 * (1 - (t2 - a2) * n2), s2 = e2 * (1 - (1 - t2 + a2) * n2), h2 = a2 % 6;
  return { r: 255 * [e2, i2, o2, o2, s2, e2][h2], g: 255 * [s2, e2, e2, i2, o2, o2][h2], b: 255 * [o2, o2, s2, e2, e2, i2][h2], a: u2 };
};
var g = function(r3) {
  return { h: u(r3.h), s: e(r3.s, 0, 100), l: e(r3.l, 0, 100), a: e(r3.a) };
};
var d = function(r3) {
  return { h: n(r3.h), s: n(r3.s), l: n(r3.l), a: n(r3.a, 3) };
};
var f = function(r3) {
  return b((n2 = (t2 = r3).s, { h: t2.h, s: (n2 *= ((e2 = t2.l) < 50 ? e2 : 100 - e2) / 100) > 0 ? 2 * n2 / (e2 + n2) * 100 : 0, v: e2 + n2, a: t2.a }));
  var t2, n2, e2;
};
var c = function(r3) {
  return { h: (t2 = h(r3)).h, s: (u2 = (200 - (n2 = t2.s)) * (e2 = t2.v) / 100) > 0 && u2 < 200 ? n2 * e2 / 100 / (u2 <= 100 ? u2 : 200 - u2) * 100 : 0, l: u2 / 2, a: t2.a };
  var t2, n2, e2, u2;
};
var l = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
var p = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
var v = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
var m = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
var y = { string: [[function(r3) {
  var t2 = i.exec(r3);
  return t2 ? (r3 = t2[1]).length <= 4 ? { r: parseInt(r3[0] + r3[0], 16), g: parseInt(r3[1] + r3[1], 16), b: parseInt(r3[2] + r3[2], 16), a: 4 === r3.length ? n(parseInt(r3[3] + r3[3], 16) / 255, 2) : 1 } : 6 === r3.length || 8 === r3.length ? { r: parseInt(r3.substr(0, 2), 16), g: parseInt(r3.substr(2, 2), 16), b: parseInt(r3.substr(4, 2), 16), a: 8 === r3.length ? n(parseInt(r3.substr(6, 2), 16) / 255, 2) : 1 } : null : null;
}, "hex"], [function(r3) {
  var t2 = v.exec(r3) || m.exec(r3);
  return t2 ? t2[2] !== t2[4] || t2[4] !== t2[6] ? null : a({ r: Number(t2[1]) / (t2[2] ? 100 / 255 : 1), g: Number(t2[3]) / (t2[4] ? 100 / 255 : 1), b: Number(t2[5]) / (t2[6] ? 100 / 255 : 1), a: void 0 === t2[7] ? 1 : Number(t2[7]) / (t2[8] ? 100 : 1) }) : null;
}, "rgb"], [function(t2) {
  var n2 = l.exec(t2) || p.exec(t2);
  if (!n2) return null;
  var e2, u2, a2 = g({ h: (e2 = n2[1], u2 = n2[2], void 0 === u2 && (u2 = "deg"), Number(e2) * (r2[u2] || 1)), s: Number(n2[3]), l: Number(n2[4]), a: void 0 === n2[5] ? 1 : Number(n2[5]) / (n2[6] ? 100 : 1) });
  return f(a2);
}, "hsl"]], object: [[function(r3) {
  var n2 = r3.r, e2 = r3.g, u2 = r3.b, o2 = r3.a, i2 = void 0 === o2 ? 1 : o2;
  return t(n2) && t(e2) && t(u2) ? a({ r: Number(n2), g: Number(e2), b: Number(u2), a: Number(i2) }) : null;
}, "rgb"], [function(r3) {
  var n2 = r3.h, e2 = r3.s, u2 = r3.l, a2 = r3.a, o2 = void 0 === a2 ? 1 : a2;
  if (!t(n2) || !t(e2) || !t(u2)) return null;
  var i2 = g({ h: Number(n2), s: Number(e2), l: Number(u2), a: Number(o2) });
  return f(i2);
}, "hsl"], [function(r3) {
  var n2 = r3.h, a2 = r3.s, o2 = r3.v, i2 = r3.a, s2 = void 0 === i2 ? 1 : i2;
  if (!t(n2) || !t(a2) || !t(o2)) return null;
  var h2 = (function(r4) {
    return { h: u(r4.h), s: e(r4.s, 0, 100), v: e(r4.v, 0, 100), a: e(r4.a) };
  })({ h: Number(n2), s: Number(a2), v: Number(o2), a: Number(s2) });
  return b(h2);
}, "hsv"]] };
var N = function(r3, t2) {
  for (var n2 = 0; n2 < t2.length; n2++) {
    var e2 = t2[n2][0](r3);
    if (e2) return [e2, t2[n2][1]];
  }
  return [null, void 0];
};
var x = function(r3) {
  return "string" == typeof r3 ? N(r3.trim(), y.string) : "object" == typeof r3 && null !== r3 ? N(r3, y.object) : [null, void 0];
};
var M = function(r3, t2) {
  var n2 = c(r3);
  return { h: n2.h, s: e(n2.s + 100 * t2, 0, 100), l: n2.l, a: n2.a };
};
var H = function(r3) {
  return (299 * r3.r + 587 * r3.g + 114 * r3.b) / 1e3 / 255;
};
var $ = function(r3, t2) {
  var n2 = c(r3);
  return { h: n2.h, s: n2.s, l: e(n2.l + 100 * t2, 0, 100), a: n2.a };
};
var j = (function() {
  function r3(r4) {
    this.parsed = x(r4)[0], this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
  }
  return r3.prototype.isValid = function() {
    return null !== this.parsed;
  }, r3.prototype.brightness = function() {
    return n(H(this.rgba), 2);
  }, r3.prototype.isDark = function() {
    return H(this.rgba) < 0.5;
  }, r3.prototype.isLight = function() {
    return H(this.rgba) >= 0.5;
  }, r3.prototype.toHex = function() {
    return r4 = o(this.rgba), t2 = r4.r, e2 = r4.g, u2 = r4.b, i2 = (a2 = r4.a) < 1 ? s(n(255 * a2)) : "", "#" + s(t2) + s(e2) + s(u2) + i2;
    var r4, t2, e2, u2, a2, i2;
  }, r3.prototype.toRgb = function() {
    return o(this.rgba);
  }, r3.prototype.toRgbString = function() {
    return r4 = o(this.rgba), t2 = r4.r, n2 = r4.g, e2 = r4.b, (u2 = r4.a) < 1 ? "rgba(" + t2 + ", " + n2 + ", " + e2 + ", " + u2 + ")" : "rgb(" + t2 + ", " + n2 + ", " + e2 + ")";
    var r4, t2, n2, e2, u2;
  }, r3.prototype.toHsl = function() {
    return d(c(this.rgba));
  }, r3.prototype.toHslString = function() {
    return r4 = d(c(this.rgba)), t2 = r4.h, n2 = r4.s, e2 = r4.l, (u2 = r4.a) < 1 ? "hsla(" + t2 + ", " + n2 + "%, " + e2 + "%, " + u2 + ")" : "hsl(" + t2 + ", " + n2 + "%, " + e2 + "%)";
    var r4, t2, n2, e2, u2;
  }, r3.prototype.toHsv = function() {
    return r4 = h(this.rgba), { h: n(r4.h), s: n(r4.s), v: n(r4.v), a: n(r4.a, 3) };
    var r4;
  }, r3.prototype.invert = function() {
    return w({ r: 255 - (r4 = this.rgba).r, g: 255 - r4.g, b: 255 - r4.b, a: r4.a });
    var r4;
  }, r3.prototype.saturate = function(r4) {
    return void 0 === r4 && (r4 = 0.1), w(M(this.rgba, r4));
  }, r3.prototype.desaturate = function(r4) {
    return void 0 === r4 && (r4 = 0.1), w(M(this.rgba, -r4));
  }, r3.prototype.grayscale = function() {
    return w(M(this.rgba, -1));
  }, r3.prototype.lighten = function(r4) {
    return void 0 === r4 && (r4 = 0.1), w($(this.rgba, r4));
  }, r3.prototype.darken = function(r4) {
    return void 0 === r4 && (r4 = 0.1), w($(this.rgba, -r4));
  }, r3.prototype.rotate = function(r4) {
    return void 0 === r4 && (r4 = 15), this.hue(this.hue() + r4);
  }, r3.prototype.alpha = function(r4) {
    return "number" == typeof r4 ? w({ r: (t2 = this.rgba).r, g: t2.g, b: t2.b, a: r4 }) : n(this.rgba.a, 3);
    var t2;
  }, r3.prototype.hue = function(r4) {
    var t2 = c(this.rgba);
    return "number" == typeof r4 ? w({ h: r4, s: t2.s, l: t2.l, a: t2.a }) : n(t2.h);
  }, r3.prototype.isEqual = function(r4) {
    return this.toHex() === w(r4).toHex();
  }, r3;
})();
var w = function(r3) {
  return r3 instanceof j ? r3 : new j(r3);
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/color.js
var import_i18n31 = __toESM(require_i18n(), 1);
function sort12(valueA, valueB, direction) {
  const colorA = w(valueA);
  const colorB = w(valueB);
  if (!colorA.isValid() && !colorB.isValid()) {
    return 0;
  }
  if (!colorA.isValid()) {
    return direction === "asc" ? 1 : -1;
  }
  if (!colorB.isValid()) {
    return direction === "asc" ? -1 : 1;
  }
  const hslA = colorA.toHsl();
  const hslB = colorB.toHsl();
  if (hslA.h !== hslB.h) {
    return direction === "asc" ? hslA.h - hslB.h : hslB.h - hslA.h;
  }
  if (hslA.s !== hslB.s) {
    return direction === "asc" ? hslA.s - hslB.s : hslB.s - hslA.s;
  }
  return direction === "asc" ? hslA.l - hslB.l : hslB.l - hslA.l;
}
var color_default = {
  sort: sort12,
  isValid: {
    elements: true,
    custom: (item, field) => {
      const value = field.getValue({ item });
      if (![void 0, "", null].includes(value) && !w(value).isValid()) {
        return (0, import_i18n31.__)("Value must be a valid color.");
      }
      return null;
    }
  },
  Edit: "color",
  render: ({ item, field }) => {
    if (field.hasElements) {
      return /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(RenderFromElements, { item, field });
    }
    const value = field.getValue({ item });
    if (!value || !w(value).isValid()) {
      return value;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime76.jsxs)(
      "div",
      {
        style: { display: "flex", alignItems: "center", gap: "8px" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime76.jsx)(
            "div",
            {
              style: {
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: value,
                border: "1px solid #ddd",
                flexShrink: 0
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime76.jsx)("span", { children: value })
        ]
      }
    );
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS_ANY, OPERATOR_IS_NONE],
    validOperators: [OPERATOR_IS, OPERATOR_IS_NOT]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/url.js
var import_jsx_runtime77 = __toESM(require_jsx_runtime(), 1);
function sort13(valueA, valueB, direction) {
  return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
}
var url_default = {
  sort: sort13,
  isValid: {
    elements: true,
    custom: () => null
  },
  Edit: "url",
  render: ({ item, field }) => {
    return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime77.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
  },
  enableSorting: true,
  filterBy: {
    defaultOperators: [OPERATOR_IS_ANY, OPERATOR_IS_NONE],
    validOperators: [
      OPERATOR_IS,
      OPERATOR_IS_NOT,
      OPERATOR_CONTAINS,
      OPERATOR_NOT_CONTAINS,
      OPERATOR_STARTS_WITH,
      // Multiple selection
      OPERATOR_IS_ANY,
      OPERATOR_IS_NONE,
      OPERATOR_IS_ALL,
      OPERATOR_IS_NOT_ALL
    ]
  }
};

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/field-types/index.js
function getFieldTypeDefinition(type) {
  if ("email" === type) {
    return email_default;
  }
  if ("integer" === type) {
    return integer_default;
  }
  if ("number" === type) {
    return number_default;
  }
  if ("text" === type) {
    return text_default;
  }
  if ("datetime" === type) {
    return datetime_default;
  }
  if ("date" === type) {
    return date_default;
  }
  if ("boolean" === type) {
    return boolean_default;
  }
  if ("media" === type) {
    return media_default;
  }
  if ("array" === type) {
    return array_default;
  }
  if ("password" === type) {
    return password_default;
  }
  if ("telephone" === type) {
    return telephone_default;
  }
  if ("color" === type) {
    return color_default;
  }
  if ("url" === type) {
    return url_default;
  }
  return {
    sort: (a2, b2, direction) => {
      if (typeof a2 === "number" && typeof b2 === "number") {
        return direction === "asc" ? a2 - b2 : b2 - a2;
      }
      return direction === "asc" ? a2.localeCompare(b2) : b2.localeCompare(a2);
    },
    isValid: {
      elements: true,
      custom: () => null
    },
    Edit: null,
    render: ({ item, field }) => {
      return field.hasElements ? /* @__PURE__ */ (0, import_jsx_runtime78.jsx)(RenderFromElements, { item, field }) : field.getValue({ item });
    },
    enableSorting: true,
    filterBy: {
      defaultOperators: [OPERATOR_IS, OPERATOR_IS_NOT],
      validOperators: ALL_OPERATORS
    }
  };
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/index.js
var import_jsx_runtime99 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/checkbox.js
var import_jsx_runtime79 = __toESM(require_jsx_runtime(), 1);
var import_components26 = __toESM(require_components(), 1);
var import_element31 = __toESM(require_element(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/utils/get-custom-validity.js
function getCustomValidity(isValid2, validity) {
  let customValidity;
  if (isValid2?.required && validity?.required) {
    customValidity = validity?.required?.message ? validity.required : void 0;
  } else if (isValid2?.elements && validity?.elements) {
    customValidity = validity.elements;
  } else if (validity?.custom) {
    customValidity = validity.custom;
  }
  return customValidity;
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/checkbox.js
var { ValidatedCheckboxControl } = unlock(import_components26.privateApis);
function Checkbox({
  field,
  onChange,
  data,
  hideLabelFromVision,
  validity
}) {
  const { getValue, setValue, label, description, isValid: isValid2 } = field;
  const onChangeControl = (0, import_element31.useCallback)(() => {
    onChange(
      setValue({ item: data, value: !getValue({ item: data }) })
    );
  }, [data, getValue, onChange, setValue]);
  return /* @__PURE__ */ (0, import_jsx_runtime79.jsx)(
    ValidatedCheckboxControl,
    {
      required: !!field.isValid?.required,
      customValidity: getCustomValidity(isValid2, validity),
      hidden: hideLabelFromVision,
      label,
      help: description,
      checked: getValue({ item: data }),
      onChange: onChangeControl
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/datetime.js
var import_jsx_runtime81 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constants.js
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;
var constructFromSymbol = Symbol.for("constructDateFrom");

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constructFrom.js
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/toDate.js
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addDays.js
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addMonths.js
function addMonths(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) {
    return _date;
  }
  const dayOfMonth = _date.getDate();
  const endOfDesiredMonth = constructFrom(options?.in || date, _date.getTime());
  endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
  const daysInMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInMonth) {
    return endOfDesiredMonth;
  } else {
    _date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth
    );
    return _date;
  }
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfWeek.js
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfISOWeek.js
function startOfISOWeek(date, options) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 });
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISOWeekYear.js
function getISOWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/normalizeDates.js
function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    context || dates.find((date) => typeof date === "object")
  );
  return dates.map(normalize);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfDay.js
function startOfDay(date, options) {
  const _date = toDate(date, options?.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/differenceInCalendarDays.js
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);
  const laterTimestamp = +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp = +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfISOWeekYear.js
function startOfISOWeekYear(date, options) {
  const year = getISOWeekYear(date, options);
  const fourthOfJanuary = constructFrom(options?.in || date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addYears.js
function addYears(date, amount, options) {
  return addMonths(date, amount * 12, options);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isDate.js
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isValid.js
function isValid(date) {
  return !(!isDate(date) && typeof date !== "number" || isNaN(+toDate(date)));
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfMonth.js
function startOfMonth(date, options) {
  const _date = toDate(date, options?.in);
  _date.setDate(1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfYear.js
function startOfYear(date, options) {
  const date_ = toDate(date, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatLong.js
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildLocalizeFn.js
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/localize.js
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // [TODO] -- I challenge you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/match.js
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US.js
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDayOfYear.js
function getDayOfYear(date, options) {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISOWeek.js
function getISOWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getWeekYear.js
function getWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (+_date >= +startOfNextYear) {
    return year + 1;
  } else if (+_date >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfWeekYear.js
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(options?.in || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getWeek.js
function getWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/addLeadingZeros.js
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/lightFormatters.js
var lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/formatters.js
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      // J, F, ..., D
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      // J, F, ..., D
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      // T
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      // Tuesday
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(+date / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  }
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/longFormatters.js
var dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
var timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
var dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/protectedTokens.js
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/format.js
var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const originalDate = toDate(date, options?.in);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken) return part.value;
    const token = part.value;
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token) || !options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subDays.js
function subDays(date, amount, options) {
  return addDays(date, -amount, options);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subMonths.js
function subMonths(date, amount, options) {
  return addMonths(date, -amount, options);
}

// ../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subYears.js
function subYears(date, amount, options) {
  return addYears(date, -amount, options);
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/datetime.js
var import_components28 = __toESM(require_components(), 1);
var import_element33 = __toESM(require_element(), 1);
var import_i18n33 = __toESM(require_i18n(), 1);
var import_date3 = __toESM(require_date(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/utils/relative-date-control.js
var import_jsx_runtime80 = __toESM(require_jsx_runtime(), 1);
var import_components27 = __toESM(require_components(), 1);
var import_element32 = __toESM(require_element(), 1);
var import_i18n32 = __toESM(require_i18n(), 1);
var TIME_UNITS_OPTIONS = {
  [OPERATOR_IN_THE_PAST]: [
    { value: "days", label: (0, import_i18n32.__)("Days") },
    { value: "weeks", label: (0, import_i18n32.__)("Weeks") },
    { value: "months", label: (0, import_i18n32.__)("Months") },
    { value: "years", label: (0, import_i18n32.__)("Years") }
  ],
  [OPERATOR_OVER]: [
    { value: "days", label: (0, import_i18n32.__)("Days ago") },
    { value: "weeks", label: (0, import_i18n32.__)("Weeks ago") },
    { value: "months", label: (0, import_i18n32.__)("Months ago") },
    { value: "years", label: (0, import_i18n32.__)("Years ago") }
  ]
};
function RelativeDateControl({
  className,
  data,
  field,
  onChange,
  hideLabelFromVision,
  operator
}) {
  const options = TIME_UNITS_OPTIONS[operator === OPERATOR_IN_THE_PAST ? "inThePast" : "over"];
  const { id, label, getValue, setValue } = field;
  const fieldValue = getValue({ item: data });
  const { value: relValue = "", unit = options[0].value } = fieldValue && typeof fieldValue === "object" ? fieldValue : {};
  const onChangeValue = (0, import_element32.useCallback)(
    (newValue) => onChange(
      setValue({
        item: data,
        value: { value: Number(newValue), unit }
      })
    ),
    [onChange, setValue, data, unit]
  );
  const onChangeUnit = (0, import_element32.useCallback)(
    (newUnit) => onChange(
      setValue({
        item: data,
        value: { value: relValue, unit: newUnit }
      })
    ),
    [onChange, setValue, data, relValue]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(
    import_components27.BaseControl,
    {
      id,
      __nextHasNoMarginBottom: true,
      className: clsx_default(className, "dataviews-controls__relative-date"),
      label,
      hideLabelFromVision,
      children: /* @__PURE__ */ (0, import_jsx_runtime80.jsxs)(import_components27.__experimentalHStack, { spacing: 2.5, children: [
        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(
          import_components27.__experimentalNumberControl,
          {
            __next40pxDefaultSize: true,
            className: "dataviews-controls__relative-date-number",
            spinControls: "none",
            min: 1,
            step: 1,
            value: relValue,
            onChange: onChangeValue
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime80.jsx)(
          import_components27.SelectControl,
          {
            className: "dataviews-controls__relative-date-unit",
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true,
            label: (0, import_i18n32.__)("Unit"),
            value: unit,
            options,
            onChange: onChangeUnit,
            hideLabelFromVision: true
          }
        )
      ] })
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/datetime.js
var { DateCalendar, ValidatedInputControl } = unlock(import_components28.privateApis);
var parseDateTime = (dateTimeString) => {
  if (!dateTimeString) {
    return null;
  }
  const parsed = (0, import_date3.getDate)(dateTimeString);
  return parsed && isValid(parsed) ? parsed : null;
};
var formatDateTime = (date) => {
  if (!date) {
    return "";
  }
  if (typeof date === "string") {
    return date;
  }
  return format(date, "yyyy-MM-dd'T'HH:mm");
};
function CalendarDateTimeControl({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { id, label, description, setValue, getValue, isValid: isValid2 } = field;
  const fieldValue = getValue({ item: data });
  const value = typeof fieldValue === "string" ? fieldValue : void 0;
  const [calendarMonth, setCalendarMonth] = (0, import_element33.useState)(() => {
    const parsedDate = parseDateTime(value);
    return parsedDate || /* @__PURE__ */ new Date();
  });
  const inputControlRef = (0, import_element33.useRef)(null);
  const validationTimeoutRef = (0, import_element33.useRef)();
  const previousFocusRef = (0, import_element33.useRef)(null);
  const onChangeCallback = (0, import_element33.useCallback)(
    (newValue) => onChange(setValue({ item: data, value: newValue })),
    [data, onChange, setValue]
  );
  (0, import_element33.useEffect)(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);
  const onSelectDate = (0, import_element33.useCallback)(
    (newDate) => {
      let dateTimeValue;
      if (newDate) {
        let finalDateTime = newDate;
        if (value) {
          const currentDateTime = parseDateTime(value);
          if (currentDateTime) {
            finalDateTime = new Date(newDate);
            finalDateTime.setHours(currentDateTime.getHours());
            finalDateTime.setMinutes(
              currentDateTime.getMinutes()
            );
          }
        }
        dateTimeValue = finalDateTime.toISOString();
        onChangeCallback(dateTimeValue);
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
      } else {
        onChangeCallback(void 0);
      }
      previousFocusRef.current = inputControlRef.current && inputControlRef.current.ownerDocument.activeElement;
      validationTimeoutRef.current = setTimeout(() => {
        if (inputControlRef.current) {
          inputControlRef.current.focus();
          inputControlRef.current.blur();
          onChangeCallback(dateTimeValue);
          if (previousFocusRef.current && previousFocusRef.current instanceof HTMLElement) {
            previousFocusRef.current.focus();
          }
        }
      }, 0);
    },
    [onChangeCallback, value]
  );
  const handleManualDateTimeChange = (0, import_element33.useCallback)(
    (newValue) => {
      if (newValue) {
        const dateTime = new Date(newValue);
        onChangeCallback(dateTime.toISOString());
        const parsedDate = parseDateTime(dateTime.toISOString());
        if (parsedDate) {
          setCalendarMonth(parsedDate);
        }
      } else {
        onChangeCallback(void 0);
      }
    },
    [onChangeCallback]
  );
  const {
    timezone: { string: timezoneString },
    l10n: { startOfWeek: startOfWeek2 }
  } = (0, import_date3.getSettings)();
  const displayLabel = isValid2?.required && !hideLabelFromVision ? `${label} (${(0, import_i18n33.__)("Required")})` : label;
  return /* @__PURE__ */ (0, import_jsx_runtime81.jsx)(
    import_components28.BaseControl,
    {
      __nextHasNoMarginBottom: true,
      id,
      label: displayLabel,
      help: description,
      hideLabelFromVision,
      children: /* @__PURE__ */ (0, import_jsx_runtime81.jsxs)(import_components28.__experimentalVStack, { spacing: 4, children: [
        /* @__PURE__ */ (0, import_jsx_runtime81.jsx)(
          DateCalendar,
          {
            style: { width: "100%" },
            selected: value ? parseDateTime(value) || void 0 : void 0,
            onSelect: onSelectDate,
            month: calendarMonth,
            onMonthChange: setCalendarMonth,
            timeZone: timezoneString || void 0,
            weekStartsOn: startOfWeek2
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime81.jsx)(
          ValidatedInputControl,
          {
            ref: inputControlRef,
            __next40pxDefaultSize: true,
            required: !!isValid2?.required,
            customValidity: getCustomValidity(isValid2, validity),
            type: "datetime-local",
            label: (0, import_i18n33.__)("Date time"),
            hideLabelFromVision: true,
            value: value ? formatDateTime(
              parseDateTime(value) || void 0
            ) : "",
            onChange: handleManualDateTimeChange
          }
        )
      ] })
    }
  );
}
function DateTime({
  data,
  field,
  onChange,
  hideLabelFromVision,
  operator,
  validity
}) {
  if (operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER) {
    return /* @__PURE__ */ (0, import_jsx_runtime81.jsx)(
      RelativeDateControl,
      {
        className: "dataviews-controls__datetime",
        data,
        field,
        onChange,
        hideLabelFromVision,
        operator
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime81.jsx)(
    CalendarDateTimeControl,
    {
      data,
      field,
      onChange,
      hideLabelFromVision,
      validity
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/date.js
var import_jsx_runtime82 = __toESM(require_jsx_runtime(), 1);
var import_components29 = __toESM(require_components(), 1);
var import_element34 = __toESM(require_element(), 1);
var import_i18n34 = __toESM(require_i18n(), 1);
var import_date4 = __toESM(require_date(), 1);
var { DateCalendar: DateCalendar2, DateRangeCalendar } = unlock(import_components29.privateApis);
var DATE_PRESETS = [
  {
    id: "today",
    label: (0, import_i18n34.__)("Today"),
    getValue: () => (0, import_date4.getDate)(null)
  },
  {
    id: "yesterday",
    label: (0, import_i18n34.__)("Yesterday"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return subDays(today, 1);
    }
  },
  {
    id: "past-week",
    label: (0, import_i18n34.__)("Past week"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return subDays(today, 7);
    }
  },
  {
    id: "past-month",
    label: (0, import_i18n34.__)("Past month"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return subMonths(today, 1);
    }
  }
];
var DATE_RANGE_PRESETS = [
  {
    id: "last-7-days",
    label: (0, import_i18n34.__)("Last 7 days"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return [subDays(today, 7), today];
    }
  },
  {
    id: "last-30-days",
    label: (0, import_i18n34.__)("Last 30 days"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return [subDays(today, 30), today];
    }
  },
  {
    id: "month-to-date",
    label: (0, import_i18n34.__)("Month to date"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return [startOfMonth(today), today];
    }
  },
  {
    id: "last-year",
    label: (0, import_i18n34.__)("Last year"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return [subYears(today, 1), today];
    }
  },
  {
    id: "year-to-date",
    label: (0, import_i18n34.__)("Year to date"),
    getValue: () => {
      const today = (0, import_date4.getDate)(null);
      return [startOfYear(today), today];
    }
  }
];
var parseDate = (dateString) => {
  if (!dateString) {
    return null;
  }
  const parsed = (0, import_date4.getDate)(dateString);
  return parsed && isValid(parsed) ? parsed : null;
};
var formatDate = (date) => {
  if (!date) {
    return "";
  }
  return typeof date === "string" ? date : format(date, "yyyy-MM-dd");
};
function ValidatedDateControl({
  field,
  validity,
  inputRefs,
  isTouched,
  setIsTouched,
  children
}) {
  const { isValid: isValid2 } = field;
  const [customValidity, setCustomValidity] = (0, import_element34.useState)(void 0);
  const validateRefs = (0, import_element34.useCallback)(() => {
    const refs = Array.isArray(inputRefs) ? inputRefs : [inputRefs];
    for (const ref of refs) {
      const input = ref.current;
      if (input && !input.validity.valid) {
        setCustomValidity({
          type: "invalid",
          message: input.validationMessage
        });
        return;
      }
    }
    setCustomValidity(void 0);
  }, [inputRefs]);
  (0, import_element34.useEffect)(() => {
    if (isTouched) {
      const timeoutId = setTimeout(() => {
        if (validity) {
          setCustomValidity(getCustomValidity(isValid2, validity));
        } else {
          validateRefs();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    return void 0;
  }, [isTouched, isValid2, validity, validateRefs]);
  const onBlur = (event) => {
    if (isTouched) {
      return;
    }
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
      setIsTouched(true);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)("div", { onBlur, children: [
    children,
    /* @__PURE__ */ (0, import_jsx_runtime82.jsx)("div", { "aria-live": "polite", children: customValidity && /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)(
      "p",
      {
        className: clsx_default(
          "components-validated-control__indicator",
          customValidity.type === "invalid" ? "is-invalid" : void 0,
          customValidity.type === "valid" ? "is-valid" : void 0
        ),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
            import_components29.Icon,
            {
              className: "components-validated-control__indicator-icon",
              icon: error_default,
              size: 16,
              fill: "currentColor"
            }
          ),
          customValidity.message
        ]
      }
    ) })
  ] });
}
function CalendarDateControl({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { id, label, setValue, getValue, isValid: isValid2 } = field;
  const [selectedPresetId, setSelectedPresetId] = (0, import_element34.useState)(
    null
  );
  const fieldValue = getValue({ item: data });
  const value = typeof fieldValue === "string" ? fieldValue : void 0;
  const [calendarMonth, setCalendarMonth] = (0, import_element34.useState)(() => {
    const parsedDate = parseDate(value);
    return parsedDate || /* @__PURE__ */ new Date();
  });
  const [isTouched, setIsTouched] = (0, import_element34.useState)(false);
  const validityTargetRef = (0, import_element34.useRef)(null);
  const onChangeCallback = (0, import_element34.useCallback)(
    (newValue) => onChange(setValue({ item: data, value: newValue })),
    [data, onChange, setValue]
  );
  const onSelectDate = (0, import_element34.useCallback)(
    (newDate) => {
      const dateValue = newDate ? format(newDate, "yyyy-MM-dd") : void 0;
      onChangeCallback(dateValue);
      setSelectedPresetId(null);
      setIsTouched(true);
    },
    [onChangeCallback]
  );
  const handlePresetClick = (0, import_element34.useCallback)(
    (preset) => {
      const presetDate = preset.getValue();
      const dateValue = formatDate(presetDate);
      setCalendarMonth(presetDate);
      onChangeCallback(dateValue);
      setSelectedPresetId(preset.id);
      setIsTouched(true);
    },
    [onChangeCallback]
  );
  const handleManualDateChange = (0, import_element34.useCallback)(
    (newValue) => {
      onChangeCallback(newValue);
      if (newValue) {
        const parsedDate = parseDate(newValue);
        if (parsedDate) {
          setCalendarMonth(parsedDate);
        }
      }
      setSelectedPresetId(null);
      setIsTouched(true);
    },
    [onChangeCallback]
  );
  const {
    timezone: { string: timezoneString },
    l10n: { startOfWeek: startOfWeek2 }
  } = (0, import_date4.getSettings)();
  const displayLabel = isValid2?.required ? `${label} (${(0, import_i18n34.__)("Required")})` : label;
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
    ValidatedDateControl,
    {
      field,
      validity,
      inputRefs: validityTargetRef,
      isTouched,
      setIsTouched,
      children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
        import_components29.BaseControl,
        {
          __nextHasNoMarginBottom: true,
          id,
          className: "dataviews-controls__date",
          label: displayLabel,
          hideLabelFromVision,
          children: /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)(import_components29.__experimentalVStack, { spacing: 4, children: [
            /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)(import_components29.__experimentalHStack, { spacing: 2, wrap: true, justify: "flex-start", children: [
              DATE_PRESETS.map((preset) => {
                const isSelected2 = selectedPresetId === preset.id;
                return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
                  import_components29.Button,
                  {
                    className: "dataviews-controls__date-preset",
                    variant: "tertiary",
                    isPressed: isSelected2,
                    size: "small",
                    onClick: () => handlePresetClick(preset),
                    children: preset.label
                  },
                  preset.id
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
                import_components29.Button,
                {
                  className: "dataviews-controls__date-preset",
                  variant: "tertiary",
                  isPressed: !selectedPresetId,
                  size: "small",
                  disabled: !!selectedPresetId,
                  accessibleWhenDisabled: false,
                  children: (0, import_i18n34.__)("Custom")
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
              import_components29.__experimentalInputControl,
              {
                __next40pxDefaultSize: true,
                ref: validityTargetRef,
                type: "date",
                label: (0, import_i18n34.__)("Date"),
                hideLabelFromVision: true,
                value,
                onChange: handleManualDateChange,
                required: !!field.isValid?.required
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
              DateCalendar2,
              {
                style: { width: "100%" },
                selected: value ? parseDate(value) || void 0 : void 0,
                onSelect: onSelectDate,
                month: calendarMonth,
                onMonthChange: setCalendarMonth,
                timeZone: timezoneString || void 0,
                weekStartsOn: startOfWeek2
              }
            )
          ] })
        }
      )
    }
  );
}
function CalendarDateRangeControl({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { id, label, getValue, setValue } = field;
  let value;
  const fieldValue = getValue({ item: data });
  if (Array.isArray(fieldValue) && fieldValue.length === 2 && fieldValue.every((date) => typeof date === "string")) {
    value = fieldValue;
  }
  const onChangeCallback = (0, import_element34.useCallback)(
    (newValue) => {
      onChange(
        setValue({
          item: data,
          value: newValue
        })
      );
    },
    [data, onChange, setValue]
  );
  const [selectedPresetId, setSelectedPresetId] = (0, import_element34.useState)(
    null
  );
  const selectedRange = (0, import_element34.useMemo)(() => {
    if (!value) {
      return { from: void 0, to: void 0 };
    }
    const [from, to] = value;
    return {
      from: parseDate(from) || void 0,
      to: parseDate(to) || void 0
    };
  }, [value]);
  const [calendarMonth, setCalendarMonth] = (0, import_element34.useState)(() => {
    return selectedRange.from || /* @__PURE__ */ new Date();
  });
  const [isTouched, setIsTouched] = (0, import_element34.useState)(false);
  const fromInputRef = (0, import_element34.useRef)(null);
  const toInputRef = (0, import_element34.useRef)(null);
  const updateDateRange = (0, import_element34.useCallback)(
    (fromDate, toDate2) => {
      if (fromDate && toDate2) {
        onChangeCallback([
          formatDate(fromDate),
          formatDate(toDate2)
        ]);
      } else if (!fromDate && !toDate2) {
        onChangeCallback(void 0);
      }
    },
    [onChangeCallback]
  );
  const onSelectCalendarRange = (0, import_element34.useCallback)(
    (newRange) => {
      updateDateRange(newRange?.from, newRange?.to);
      setSelectedPresetId(null);
      setIsTouched(true);
    },
    [updateDateRange]
  );
  const handlePresetClick = (0, import_element34.useCallback)(
    (preset) => {
      const [startDate, endDate] = preset.getValue();
      setCalendarMonth(startDate);
      updateDateRange(startDate, endDate);
      setSelectedPresetId(preset.id);
      setIsTouched(true);
    },
    [updateDateRange]
  );
  const handleManualDateChange = (0, import_element34.useCallback)(
    (fromOrTo, newValue) => {
      const [currentFrom, currentTo] = value || [
        void 0,
        void 0
      ];
      const updatedFrom = fromOrTo === "from" ? newValue : currentFrom;
      const updatedTo = fromOrTo === "to" ? newValue : currentTo;
      updateDateRange(updatedFrom, updatedTo);
      if (newValue) {
        const parsedDate = parseDate(newValue);
        if (parsedDate) {
          setCalendarMonth(parsedDate);
        }
      }
      setSelectedPresetId(null);
      setIsTouched(true);
    },
    [value, updateDateRange]
  );
  const { timezone, l10n } = (0, import_date4.getSettings)();
  const displayLabel = field.isValid?.required ? `${label} (${(0, import_i18n34.__)("Required")})` : label;
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
    ValidatedDateControl,
    {
      field,
      validity,
      inputRefs: [fromInputRef, toInputRef],
      isTouched,
      setIsTouched,
      children: /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
        import_components29.BaseControl,
        {
          __nextHasNoMarginBottom: true,
          id,
          className: "dataviews-controls__date",
          label: displayLabel,
          hideLabelFromVision,
          children: /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)(import_components29.__experimentalVStack, { spacing: 4, children: [
            /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)(import_components29.__experimentalHStack, { spacing: 2, wrap: true, justify: "flex-start", children: [
              DATE_RANGE_PRESETS.map((preset) => {
                const isSelected2 = selectedPresetId === preset.id;
                return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
                  import_components29.Button,
                  {
                    className: "dataviews-controls__date-preset",
                    variant: "tertiary",
                    isPressed: isSelected2,
                    size: "small",
                    onClick: () => handlePresetClick(preset),
                    children: preset.label
                  },
                  preset.id
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
                import_components29.Button,
                {
                  className: "dataviews-controls__date-preset",
                  variant: "tertiary",
                  isPressed: !selectedPresetId,
                  size: "small",
                  accessibleWhenDisabled: false,
                  disabled: !!selectedPresetId,
                  children: (0, import_i18n34.__)("Custom")
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime82.jsxs)(import_components29.__experimentalHStack, { spacing: 2, children: [
              /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
                import_components29.__experimentalInputControl,
                {
                  __next40pxDefaultSize: true,
                  ref: fromInputRef,
                  type: "date",
                  label: (0, import_i18n34.__)("From"),
                  hideLabelFromVision: true,
                  value: value?.[0],
                  onChange: (newValue) => handleManualDateChange("from", newValue),
                  required: !!field.isValid?.required
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
                import_components29.__experimentalInputControl,
                {
                  __next40pxDefaultSize: true,
                  ref: toInputRef,
                  type: "date",
                  label: (0, import_i18n34.__)("To"),
                  hideLabelFromVision: true,
                  value: value?.[1],
                  onChange: (newValue) => handleManualDateChange("to", newValue),
                  required: !!field.isValid?.required
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
              DateRangeCalendar,
              {
                style: { width: "100%" },
                selected: selectedRange,
                onSelect: onSelectCalendarRange,
                month: calendarMonth,
                onMonthChange: setCalendarMonth,
                timeZone: timezone.string || void 0,
                weekStartsOn: l10n.startOfWeek
              }
            )
          ] })
        }
      )
    }
  );
}
function DateControl({
  data,
  field,
  onChange,
  hideLabelFromVision,
  operator,
  validity
}) {
  if (operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER) {
    return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
      RelativeDateControl,
      {
        className: "dataviews-controls__date",
        data,
        field,
        onChange,
        hideLabelFromVision,
        operator
      }
    );
  }
  if (operator === OPERATOR_BETWEEN) {
    return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
      CalendarDateRangeControl,
      {
        data,
        field,
        onChange,
        hideLabelFromVision,
        validity
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime82.jsx)(
    CalendarDateControl,
    {
      data,
      field,
      onChange,
      hideLabelFromVision,
      validity
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/email.js
var import_jsx_runtime84 = __toESM(require_jsx_runtime(), 1);
var import_components31 = __toESM(require_components(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/utils/validated-input.js
var import_jsx_runtime83 = __toESM(require_jsx_runtime(), 1);
var import_components30 = __toESM(require_components(), 1);
var import_element35 = __toESM(require_element(), 1);
var { ValidatedInputControl: ValidatedInputControl2 } = unlock(import_components30.privateApis);
function ValidatedText({
  data,
  field,
  onChange,
  hideLabelFromVision,
  type,
  prefix: prefix2,
  suffix,
  validity
}) {
  const { label, placeholder, description, getValue, setValue, isValid: isValid2 } = field;
  const value = getValue({ item: data });
  const onChangeControl = (0, import_element35.useCallback)(
    (newValue) => onChange(
      setValue({
        item: data,
        value: newValue
      })
    ),
    [data, setValue, onChange]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime83.jsx)(
    ValidatedInputControl2,
    {
      required: !!isValid2?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label,
      placeholder,
      value: value ?? "",
      help: description,
      onChange: onChangeControl,
      hideLabelFromVision,
      type,
      prefix: prefix2,
      suffix,
      __next40pxDefaultSize: true
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/email.js
function Email({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime84.jsx)(
    ValidatedText,
    {
      ...{
        data,
        field,
        onChange,
        hideLabelFromVision,
        validity,
        type: "email",
        prefix: /* @__PURE__ */ (0, import_jsx_runtime84.jsx)(import_components31.__experimentalInputControlPrefixWrapper, { variant: "icon", children: /* @__PURE__ */ (0, import_jsx_runtime84.jsx)(import_components31.Icon, { icon: at_symbol_default }) })
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/telephone.js
var import_jsx_runtime85 = __toESM(require_jsx_runtime(), 1);
var import_components32 = __toESM(require_components(), 1);
function Telephone({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime85.jsx)(
    ValidatedText,
    {
      ...{
        data,
        field,
        onChange,
        hideLabelFromVision,
        validity,
        type: "tel",
        prefix: /* @__PURE__ */ (0, import_jsx_runtime85.jsx)(import_components32.__experimentalInputControlPrefixWrapper, { variant: "icon", children: /* @__PURE__ */ (0, import_jsx_runtime85.jsx)(import_components32.Icon, { icon: mobile_default }) })
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/url.js
var import_jsx_runtime86 = __toESM(require_jsx_runtime(), 1);
var import_components33 = __toESM(require_components(), 1);
function Url({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime86.jsx)(
    ValidatedText,
    {
      ...{
        data,
        field,
        onChange,
        hideLabelFromVision,
        validity,
        type: "url",
        prefix: /* @__PURE__ */ (0, import_jsx_runtime86.jsx)(import_components33.__experimentalInputControlPrefixWrapper, { variant: "icon", children: /* @__PURE__ */ (0, import_jsx_runtime86.jsx)(import_components33.Icon, { icon: link_default }) })
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/integer.js
var import_jsx_runtime88 = __toESM(require_jsx_runtime(), 1);

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/utils/validated-number.js
var import_jsx_runtime87 = __toESM(require_jsx_runtime(), 1);
var import_components34 = __toESM(require_components(), 1);
var import_element36 = __toESM(require_element(), 1);
var import_i18n35 = __toESM(require_i18n(), 1);
var { ValidatedNumberControl } = unlock(import_components34.privateApis);
function toNumberOrEmpty(value) {
  if (value === "" || value === void 0) {
    return "";
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}
function BetweenControls({
  value,
  onChange,
  hideLabelFromVision,
  step
}) {
  const [min = "", max = ""] = value;
  const onChangeMin = (0, import_element36.useCallback)(
    (newValue) => onChange([toNumberOrEmpty(newValue), max]),
    [onChange, max]
  );
  const onChangeMax = (0, import_element36.useCallback)(
    (newValue) => onChange([min, toNumberOrEmpty(newValue)]),
    [onChange, min]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime87.jsx)(
    import_components34.BaseControl,
    {
      __nextHasNoMarginBottom: true,
      help: (0, import_i18n35.__)("The max. value must be greater than the min. value."),
      children: /* @__PURE__ */ (0, import_jsx_runtime87.jsxs)(import_components34.Flex, { direction: "row", gap: 4, children: [
        /* @__PURE__ */ (0, import_jsx_runtime87.jsx)(
          import_components34.__experimentalNumberControl,
          {
            label: (0, import_i18n35.__)("Min."),
            value: min,
            max: max ? Number(max) - step : void 0,
            onChange: onChangeMin,
            __next40pxDefaultSize: true,
            hideLabelFromVision,
            step
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime87.jsx)(
          import_components34.__experimentalNumberControl,
          {
            label: (0, import_i18n35.__)("Max."),
            value: max,
            min: min ? Number(min) + step : void 0,
            onChange: onChangeMax,
            __next40pxDefaultSize: true,
            hideLabelFromVision,
            step
          }
        )
      ] })
    }
  );
}
function ValidatedNumber({
  data,
  field,
  onChange,
  hideLabelFromVision,
  operator,
  decimals,
  validity
}) {
  const step = Math.pow(10, Math.abs(decimals) * -1);
  const { label, description, getValue, setValue, isValid: isValid2 } = field;
  const value = getValue({ item: data }) ?? "";
  const onChangeControl = (0, import_element36.useCallback)(
    (newValue) => {
      onChange(
        setValue({
          item: data,
          // Do not convert an empty string or undefined to a number,
          // otherwise there's a mismatch between the UI control (empty)
          // and the data relied by onChange (0).
          value: ["", void 0].includes(newValue) ? void 0 : Number(newValue)
        })
      );
    },
    [data, onChange, setValue]
  );
  const onChangeBetweenControls = (0, import_element36.useCallback)(
    (newValue) => {
      onChange(
        setValue({
          item: data,
          value: newValue
        })
      );
    },
    [data, onChange, setValue]
  );
  if (operator === OPERATOR_BETWEEN) {
    let valueBetween = ["", ""];
    if (Array.isArray(value) && value.length === 2 && value.every(
      (element) => typeof element === "number" || element === ""
    )) {
      valueBetween = value;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime87.jsx)(
      BetweenControls,
      {
        value: valueBetween,
        onChange: onChangeBetweenControls,
        hideLabelFromVision,
        step
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime87.jsx)(
    ValidatedNumberControl,
    {
      required: !!isValid2?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label,
      help: description,
      value,
      onChange: onChangeControl,
      __next40pxDefaultSize: true,
      hideLabelFromVision,
      step
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/integer.js
function Number2(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime88.jsx)(ValidatedNumber, { ...props, decimals: 0 });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/number.js
var import_jsx_runtime89 = __toESM(require_jsx_runtime(), 1);
function Number3(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime89.jsx)(ValidatedNumber, { ...props, decimals: 2 });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/radio.js
var import_jsx_runtime90 = __toESM(require_jsx_runtime(), 1);
var import_components35 = __toESM(require_components(), 1);
var import_element37 = __toESM(require_element(), 1);
var { ValidatedRadioControl } = unlock(import_components35.privateApis);
function Radio({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { label, description, getValue, setValue, isValid: isValid2 } = field;
  const { elements, isLoading } = useElements({
    elements: field.elements,
    getElements: field.getElements
  });
  const value = getValue({ item: data });
  const onChangeControl = (0, import_element37.useCallback)(
    (newValue) => onChange(setValue({ item: data, value: newValue })),
    [data, onChange, setValue]
  );
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime90.jsx)(import_components35.Spinner, {});
  }
  return /* @__PURE__ */ (0, import_jsx_runtime90.jsx)(
    ValidatedRadioControl,
    {
      required: !!field.isValid?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label,
      help: description,
      onChange: onChangeControl,
      options: elements,
      selected: value,
      hideLabelFromVision
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/select.js
var import_jsx_runtime91 = __toESM(require_jsx_runtime(), 1);
var import_components36 = __toESM(require_components(), 1);
var import_element38 = __toESM(require_element(), 1);
var { ValidatedSelectControl } = unlock(import_components36.privateApis);
function Select({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { type, label, description, getValue, setValue, isValid: isValid2 } = field;
  const isMultiple = type === "array";
  const value = getValue({ item: data }) ?? (isMultiple ? [] : "");
  const onChangeControl = (0, import_element38.useCallback)(
    (newValue) => onChange(setValue({ item: data, value: newValue })),
    [data, onChange, setValue]
  );
  const { elements, isLoading } = useElements({
    elements: field.elements,
    getElements: field.getElements
  });
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime91.jsx)(import_components36.Spinner, {});
  }
  return /* @__PURE__ */ (0, import_jsx_runtime91.jsx)(
    ValidatedSelectControl,
    {
      required: !!field.isValid?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label,
      value,
      help: description,
      options: elements,
      onChange: onChangeControl,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      hideLabelFromVision,
      multiple: isMultiple
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/text.js
var import_jsx_runtime92 = __toESM(require_jsx_runtime(), 1);
var import_element39 = __toESM(require_element(), 1);
function Text2({
  data,
  field,
  onChange,
  hideLabelFromVision,
  config,
  validity
}) {
  const { prefix: prefix2, suffix } = config || {};
  return /* @__PURE__ */ (0, import_jsx_runtime92.jsx)(
    ValidatedText,
    {
      ...{
        data,
        field,
        onChange,
        hideLabelFromVision,
        validity,
        prefix: prefix2 ? (0, import_element39.createElement)(prefix2) : void 0,
        suffix: suffix ? (0, import_element39.createElement)(suffix) : void 0
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/toggle.js
var import_jsx_runtime93 = __toESM(require_jsx_runtime(), 1);
var import_components37 = __toESM(require_components(), 1);
var import_element40 = __toESM(require_element(), 1);
var { ValidatedToggleControl } = unlock(import_components37.privateApis);
function Toggle({
  field,
  onChange,
  data,
  hideLabelFromVision,
  validity
}) {
  const { label, description, getValue, setValue, isValid: isValid2 } = field;
  const onChangeControl = (0, import_element40.useCallback)(() => {
    onChange(
      setValue({ item: data, value: !getValue({ item: data }) })
    );
  }, [onChange, setValue, data, getValue]);
  return /* @__PURE__ */ (0, import_jsx_runtime93.jsx)(
    ValidatedToggleControl,
    {
      required: !!isValid2.required,
      customValidity: getCustomValidity(isValid2, validity),
      hidden: hideLabelFromVision,
      __nextHasNoMarginBottom: true,
      label,
      help: description,
      checked: getValue({ item: data }),
      onChange: onChangeControl
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/textarea.js
var import_jsx_runtime94 = __toESM(require_jsx_runtime(), 1);
var import_components38 = __toESM(require_components(), 1);
var import_element41 = __toESM(require_element(), 1);
var { ValidatedTextareaControl } = unlock(import_components38.privateApis);
function Textarea({
  data,
  field,
  onChange,
  hideLabelFromVision,
  config,
  validity
}) {
  const { rows = 4 } = config || {};
  const { label, placeholder, description, setValue, isValid: isValid2 } = field;
  const value = field.getValue({ item: data });
  const onChangeControl = (0, import_element41.useCallback)(
    (newValue) => onChange(setValue({ item: data, value: newValue })),
    [data, onChange, setValue]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime94.jsx)(
    ValidatedTextareaControl,
    {
      required: !!isValid2?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label,
      placeholder,
      value: value ?? "",
      help: description,
      onChange: onChangeControl,
      rows,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      hideLabelFromVision
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/toggle-group.js
var import_jsx_runtime95 = __toESM(require_jsx_runtime(), 1);
var import_components39 = __toESM(require_components(), 1);
var import_element42 = __toESM(require_element(), 1);
var { ValidatedToggleGroupControl } = unlock(import_components39.privateApis);
function ToggleGroup({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { getValue, setValue, isValid: isValid2 } = field;
  const value = getValue({ item: data });
  const onChangeControl = (0, import_element42.useCallback)(
    (newValue) => onChange(setValue({ item: data, value: newValue })),
    [data, onChange, setValue]
  );
  const { elements, isLoading } = useElements({
    elements: field.elements,
    getElements: field.getElements
  });
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime95.jsx)(import_components39.Spinner, {});
  }
  if (elements.length === 0) {
    return null;
  }
  const selectedOption = elements.find((el) => el.value === value);
  return /* @__PURE__ */ (0, import_jsx_runtime95.jsx)(
    ValidatedToggleGroupControl,
    {
      required: !!field.isValid?.required,
      customValidity: getCustomValidity(isValid2, validity),
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      isBlock: true,
      label: field.label,
      help: selectedOption?.description || field.description,
      onChange: onChangeControl,
      value,
      hideLabelFromVision,
      children: elements.map((el) => /* @__PURE__ */ (0, import_jsx_runtime95.jsx)(
        import_components39.__experimentalToggleGroupControlOption,
        {
          label: el.label,
          value: el.value
        },
        el.value
      ))
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/array.js
var import_jsx_runtime96 = __toESM(require_jsx_runtime(), 1);
var import_components40 = __toESM(require_components(), 1);
var import_element43 = __toESM(require_element(), 1);
var { ValidatedFormTokenField } = unlock(import_components40.privateApis);
function ArrayControl({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { label, placeholder, getValue, setValue, isValid: isValid2 } = field;
  const value = getValue({ item: data });
  const { elements, isLoading } = useElements({
    elements: field.elements,
    getElements: field.getElements
  });
  const arrayValueAsElements = (0, import_element43.useMemo)(
    () => Array.isArray(value) ? value.map((token) => {
      const element = elements?.find(
        (suggestion) => suggestion.value === token
      );
      return element || { value: token, label: token };
    }) : [],
    [value, elements]
  );
  const onChangeControl = (0, import_element43.useCallback)(
    (tokens) => {
      const valueTokens = tokens.map((token) => {
        if (typeof token === "object" && "value" in token) {
          return token.value;
        }
        return token;
      });
      onChange(setValue({ item: data, value: valueTokens }));
    },
    [onChange, setValue, data]
  );
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime96.jsx)(import_components40.Spinner, {});
  }
  return /* @__PURE__ */ (0, import_jsx_runtime96.jsx)(
    ValidatedFormTokenField,
    {
      required: !!isValid2?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label: hideLabelFromVision ? void 0 : label,
      value: arrayValueAsElements,
      onChange: onChangeControl,
      placeholder,
      suggestions: elements?.map((element) => element.value),
      __experimentalValidateInput: (token) => {
        if (field.isValid?.elements && elements) {
          return elements.some(
            (element) => element.value === token || element.label === token
          );
        }
        return true;
      },
      __experimentalExpandOnFocus: elements && elements.length > 0,
      __experimentalShowHowTo: !field.isValid?.elements,
      displayTransform: (token) => {
        if (typeof token === "object" && "label" in token) {
          return token.label;
        }
        if (typeof token === "string" && elements) {
          const element = elements.find(
            (el) => el.value === token
          );
          return element?.label || token;
        }
        return token;
      },
      __experimentalRenderItem: ({ item }) => {
        if (typeof item === "string" && elements) {
          const element = elements.find(
            (el) => el.value === item
          );
          return /* @__PURE__ */ (0, import_jsx_runtime96.jsx)("span", { children: element?.label || item });
        }
        return /* @__PURE__ */ (0, import_jsx_runtime96.jsx)("span", { children: item });
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/color.js
var import_jsx_runtime97 = __toESM(require_jsx_runtime(), 1);
var import_components41 = __toESM(require_components(), 1);
var import_element44 = __toESM(require_element(), 1);
var { ValidatedInputControl: ValidatedInputControl3, Picker } = unlock(import_components41.privateApis);
var ColorPicker = ({
  color,
  onColorChange
}) => {
  const validColor = color && w(color).isValid() ? color : "#ffffff";
  return /* @__PURE__ */ (0, import_jsx_runtime97.jsx)(
    import_components41.Dropdown,
    {
      renderToggle: ({ onToggle, isOpen }) => /* @__PURE__ */ (0, import_jsx_runtime97.jsx)(import_components41.__experimentalInputControlPrefixWrapper, { variant: "icon", children: /* @__PURE__ */ (0, import_jsx_runtime97.jsx)(
        "button",
        {
          type: "button",
          onClick: onToggle,
          style: {
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: validColor,
            border: "1px solid #ddd",
            cursor: "pointer",
            outline: isOpen ? "2px solid #007cba" : "none",
            outlineOffset: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0
          },
          "aria-label": "Open color picker"
        }
      ) }),
      renderContent: () => /* @__PURE__ */ (0, import_jsx_runtime97.jsx)("div", { style: { padding: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime97.jsx)(
        Picker,
        {
          color: w(validColor),
          onChange: onColorChange,
          enableAlpha: true
        }
      ) })
    }
  );
};
function Color({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const { label, placeholder, description, setValue, isValid: isValid2 } = field;
  const value = field.getValue({ item: data }) || "";
  const handleColorChange = (0, import_element44.useCallback)(
    (colorObject) => {
      onChange(setValue({ item: data, value: colorObject.toHex() }));
    },
    [data, onChange, setValue]
  );
  const handleInputChange = (0, import_element44.useCallback)(
    (newValue) => {
      onChange(setValue({ item: data, value: newValue || "" }));
    },
    [data, onChange, setValue]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime97.jsx)(
    ValidatedInputControl3,
    {
      required: !!field.isValid?.required,
      customValidity: getCustomValidity(isValid2, validity),
      label,
      placeholder,
      value,
      help: description,
      onChange: handleInputChange,
      hideLabelFromVision,
      type: "text",
      prefix: /* @__PURE__ */ (0, import_jsx_runtime97.jsx)(
        ColorPicker,
        {
          color: value,
          onColorChange: handleColorChange
        }
      )
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/password.js
var import_jsx_runtime98 = __toESM(require_jsx_runtime(), 1);
var import_components42 = __toESM(require_components(), 1);
var import_element45 = __toESM(require_element(), 1);
var import_i18n36 = __toESM(require_i18n(), 1);
function Password({
  data,
  field,
  onChange,
  hideLabelFromVision,
  validity
}) {
  const [isVisible2, setIsVisible] = (0, import_element45.useState)(false);
  const toggleVisibility = (0, import_element45.useCallback)(() => {
    setIsVisible((prev) => !prev);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime98.jsx)(
    ValidatedText,
    {
      ...{
        data,
        field,
        onChange,
        hideLabelFromVision,
        validity,
        type: isVisible2 ? "text" : "password",
        suffix: /* @__PURE__ */ (0, import_jsx_runtime98.jsx)(import_components42.__experimentalInputControlSuffixWrapper, { variant: "control", children: /* @__PURE__ */ (0, import_jsx_runtime98.jsx)(
          import_components42.Button,
          {
            icon: isVisible2 ? unseen_default : seen_default,
            onClick: toggleVisibility,
            size: "small",
            label: isVisible2 ? (0, import_i18n36.__)("Hide password") : (0, import_i18n36.__)("Show password")
          }
        ) })
      }
    }
  );
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/utils/has-elements.js
function hasElements(field) {
  return Array.isArray(field.elements) && field.elements.length > 0 || typeof field.getElements === "function";
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/dataform-controls/index.js
var FORM_CONTROLS = {
  array: ArrayControl,
  checkbox: Checkbox,
  color: Color,
  datetime: DateTime,
  date: DateControl,
  email: Email,
  telephone: Telephone,
  url: Url,
  integer: Number2,
  number: Number3,
  password: Password,
  radio: Radio,
  select: Select,
  text: Text2,
  toggle: Toggle,
  textarea: Textarea,
  toggleGroup: ToggleGroup
};
function isEditConfig(value) {
  return value && typeof value === "object" && typeof value.control === "string";
}
function createConfiguredControl(config) {
  const { control, ...controlConfig } = config;
  const BaseControlType = getControlByType(control);
  return function ConfiguredControl(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime99.jsx)(BaseControlType, { ...props, config: controlConfig });
  };
}
function getControl(field, fieldTypeDefinition) {
  if (typeof field.Edit === "function") {
    return field.Edit;
  }
  if (typeof field.Edit === "string") {
    return getControlByType(field.Edit);
  }
  if (isEditConfig(field.Edit)) {
    return createConfiguredControl(field.Edit);
  }
  if (hasElements(field) && field.type !== "array") {
    return getControlByType("select");
  }
  if (typeof fieldTypeDefinition.Edit === "string") {
    return getControlByType(fieldTypeDefinition.Edit);
  }
  if (isEditConfig(fieldTypeDefinition.Edit)) {
    return createConfiguredControl(fieldTypeDefinition.Edit);
  }
  return fieldTypeDefinition.Edit;
}
function getControlByType(type) {
  if (Object.keys(FORM_CONTROLS).includes(type)) {
    return FORM_CONTROLS[type];
  }
  throw "Control " + type + " not found";
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/utils/normalize-fields.js
var getValueFromId = (id) => ({ item }) => {
  const path = id.split(".");
  let value = item;
  for (const segment of path) {
    if (value.hasOwnProperty(segment)) {
      value = value[segment];
    } else {
      value = void 0;
    }
  }
  return value;
};
var setValueFromId = (id) => ({ value }) => {
  const path = id.split(".");
  const result = {};
  let current = result;
  for (const segment of path.slice(0, -1)) {
    current[segment] = {};
    current = current[segment];
  }
  current[path.at(-1)] = value;
  return result;
};
function getFilterBy(field, fieldTypeDefinition) {
  if (field.filterBy === false) {
    return false;
  }
  if (typeof field.filterBy === "object") {
    let operators = field.filterBy.operators;
    if (!operators || !Array.isArray(operators)) {
      operators = !!fieldTypeDefinition.filterBy ? fieldTypeDefinition.filterBy.defaultOperators : [];
    }
    let validOperators = ALL_OPERATORS;
    if (typeof fieldTypeDefinition.filterBy === "object") {
      validOperators = fieldTypeDefinition.filterBy.validOperators;
    }
    operators = operators.filter(
      (operator) => validOperators.includes(operator)
    );
    if (hasElements(field) && operators.includes(OPERATOR_BETWEEN)) {
      operators = operators.filter(
        (operator) => operator !== OPERATOR_BETWEEN
      );
    }
    const hasSingleSelectionOperator = operators.some(
      (operator) => SINGLE_SELECTION_OPERATORS.includes(operator)
    );
    if (hasSingleSelectionOperator) {
      operators = operators.filter(
        (operator) => (
          // The 'Between' operator is unique as it can be combined with single selection operators.
          [...SINGLE_SELECTION_OPERATORS, OPERATOR_BETWEEN].includes(
            operator
          )
        )
      );
    }
    if (operators.length === 0) {
      return false;
    }
    return {
      isPrimary: !!field.filterBy.isPrimary,
      operators
    };
  }
  if (fieldTypeDefinition.filterBy === false) {
    return false;
  }
  let defaultOperators = fieldTypeDefinition.filterBy.defaultOperators;
  if (hasElements(field) && defaultOperators.includes(OPERATOR_BETWEEN)) {
    defaultOperators = defaultOperators.filter(
      (operator) => operator !== OPERATOR_BETWEEN
    );
  }
  return {
    operators: defaultOperators
  };
}
function normalizeFields(fields) {
  return fields.map((field) => {
    const fieldTypeDefinition = getFieldTypeDefinition(
      field.type
    );
    const getValue = field.getValue || getValueFromId(field.id);
    const setValue = field.setValue || setValueFromId(field.id);
    const sort14 = field.sort ?? function sort22(a2, b2, direction) {
      return fieldTypeDefinition.sort(
        getValue({ item: a2 }),
        getValue({ item: b2 }),
        direction
      );
    };
    const isValid2 = {
      ...fieldTypeDefinition.isValid,
      ...field.isValid
    };
    const Edit = getControl(field, fieldTypeDefinition);
    const render2 = field.render ?? function render22({
      item,
      field: renderedField
    }) {
      return fieldTypeDefinition.render({ item, field: renderedField });
    };
    const filterBy = getFilterBy(field, fieldTypeDefinition);
    return {
      ...field,
      label: field.label || field.id,
      header: field.header || field.label || field.id,
      getValue,
      setValue,
      render: render2,
      sort: sort14,
      isValid: isValid2,
      Edit,
      hasElements: hasElements(field),
      enableHiding: field.enableHiding ?? true,
      enableSorting: field.enableSorting ?? fieldTypeDefinition.enableSorting ?? true,
      filterBy,
      readOnly: field.readOnly ?? fieldTypeDefinition.readOnly ?? false
    };
  });
}

// ../../../node_modules/.pnpm/@wordpress+dataviews@10.2.0_patch_hash=2659f08edd4c0250f15fb428f013852a17e84da9c745e6da_0c9c78161e1fd7d6074dd13704bc2471/node_modules/@wordpress/dataviews/build-module/components/dataviews/index.js
var defaultGetItemId = (item) => item.id;
var defaultIsItemClickable = () => true;
var EMPTY_ARRAY5 = [];
var dataViewsLayouts = VIEW_LAYOUTS.filter(
  (viewLayout) => !viewLayout.isPicker
);
function DefaultUI({
  header,
  search = true,
  searchLabel = void 0
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime100.jsxs)(import_jsx_runtime100.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime100.jsxs)(
      import_components43.__experimentalHStack,
      {
        alignment: "top",
        justify: "space-between",
        className: "dataviews__view-actions",
        spacing: 1,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime100.jsxs)(
            import_components43.__experimentalHStack,
            {
              justify: "start",
              expanded: false,
              className: "dataviews__search",
              children: [
                search && /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(dataviews_search_default, { label: searchLabel }),
                /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(toggle_default, {})
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime100.jsxs)(
            import_components43.__experimentalHStack,
            {
              spacing: 1,
              expanded: false,
              style: { flexShrink: 0 },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(dataviews_view_config_default, {}),
                header
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(filters_toggled_default, { className: "dataviews-filters__container" }),
    /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(DataViewsLayout, {}),
    /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(DataViewsFooter, {})
  ] });
}
function DataViews({
  view,
  onChangeView,
  fields,
  search = true,
  searchLabel = void 0,
  actions = EMPTY_ARRAY5,
  data,
  getItemId: getItemId2 = defaultGetItemId,
  getItemLevel,
  isLoading = false,
  paginationInfo,
  defaultLayouts: defaultLayoutsProperty,
  selection: selectionProperty,
  onChangeSelection,
  onClickItem,
  renderItemLink,
  isItemClickable = defaultIsItemClickable,
  header,
  children,
  config = { perPageSizes: [10, 20, 50, 100] },
  empty
}) {
  const { infiniteScrollHandler } = paginationInfo;
  const containerRef = (0, import_element46.useRef)(null);
  const [containerWidth, setContainerWidth] = (0, import_element46.useState)(0);
  const resizeObserverRef = (0, import_compose11.useResizeObserver)(
    (resizeObserverEntries) => {
      setContainerWidth(
        resizeObserverEntries[0].borderBoxSize[0].inlineSize
      );
    },
    { box: "border-box" }
  );
  const [selectionState, setSelectionState] = (0, import_element46.useState)([]);
  const isUncontrolled = selectionProperty === void 0 || onChangeSelection === void 0;
  const selection = isUncontrolled ? selectionState : selectionProperty;
  const [openedFilter, setOpenedFilter] = (0, import_element46.useState)(null);
  function setSelectionWithChange(value) {
    const newValue = typeof value === "function" ? value(selection) : value;
    if (isUncontrolled) {
      setSelectionState(newValue);
    }
    if (onChangeSelection) {
      onChangeSelection(newValue);
    }
  }
  const _fields = (0, import_element46.useMemo)(() => normalizeFields(fields), [fields]);
  const _selection = (0, import_element46.useMemo)(() => {
    return selection.filter(
      (id) => data.some((item) => getItemId2(item) === id)
    );
  }, [selection, data, getItemId2]);
  const filters = use_filters_default(_fields, view);
  const hasPrimaryOrLockedFilters = (0, import_element46.useMemo)(
    () => (filters || []).some(
      (filter) => filter.isPrimary || filter.isLocked
    ),
    [filters]
  );
  const [isShowingFilter, setIsShowingFilter] = (0, import_element46.useState)(
    hasPrimaryOrLockedFilters
  );
  (0, import_element46.useEffect)(() => {
    if (hasPrimaryOrLockedFilters && !isShowingFilter) {
      setIsShowingFilter(true);
    }
  }, [hasPrimaryOrLockedFilters, isShowingFilter]);
  (0, import_element46.useEffect)(() => {
    if (!view.infiniteScrollEnabled || !containerRef.current) {
      return;
    }
    const handleScroll = (0, import_compose11.throttle)((event) => {
      const target = event.target;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        infiniteScrollHandler?.();
      }
    }, 100);
    const container = containerRef.current;
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      handleScroll.cancel();
    };
  }, [infiniteScrollHandler, view.infiniteScrollEnabled]);
  const defaultLayouts2 = (0, import_element46.useMemo)(
    () => Object.fromEntries(
      Object.entries(defaultLayoutsProperty).filter(
        ([layoutType]) => {
          return dataViewsLayouts.some(
            (viewLayout) => viewLayout.type === layoutType
          );
        }
      )
    ),
    [defaultLayoutsProperty]
  );
  if (!defaultLayouts2[view.type]) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(
    dataviews_context_default.Provider,
    {
      value: {
        view,
        onChangeView,
        fields: _fields,
        actions,
        data,
        isLoading,
        paginationInfo,
        selection: _selection,
        onChangeSelection: setSelectionWithChange,
        openedFilter,
        setOpenedFilter,
        getItemId: getItemId2,
        getItemLevel,
        isItemClickable,
        onClickItem,
        renderItemLink,
        containerWidth,
        containerRef,
        resizeObserverRef,
        defaultLayouts: defaultLayouts2,
        filters,
        isShowingFilter,
        setIsShowingFilter,
        config,
        empty,
        hasInfiniteScrollHandler: !!infiniteScrollHandler
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime100.jsx)("div", { className: "dataviews-wrapper", ref: containerRef, children: children ?? /* @__PURE__ */ (0, import_jsx_runtime100.jsx)(
        DefaultUI,
        {
          header,
          search,
          searchLabel
        }
      ) })
    }
  );
}
var DataViewsSubComponents = DataViews;
DataViewsSubComponents.BulkActionToolbar = BulkActionsFooter;
DataViewsSubComponents.Filters = filters_default;
DataViewsSubComponents.FiltersToggled = filters_toggled_default;
DataViewsSubComponents.FiltersToggle = toggle_default;
DataViewsSubComponents.Layout = DataViewsLayout;
DataViewsSubComponents.LayoutSwitcher = ViewTypeMenu;
DataViewsSubComponents.Pagination = DataViewsPagination;
DataViewsSubComponents.Search = dataviews_search_default;
DataViewsSubComponents.ViewConfig = DataviewsViewConfigDropdown;
DataViewsSubComponents.Footer = DataViewsFooter;
var dataviews_default = DataViewsSubComponents;

// routes/responses/stage.tsx
var import_element47 = __toESM(require_element());
var import_i18n37 = __toESM(require_i18n());

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/index.parts.js
var index_parts_exports = {};
__export(index_parts_exports, {
  Indicator: () => TabsIndicator,
  List: () => TabsList,
  Panel: () => TabsPanel,
  Root: () => TabsRoot,
  Tab: () => TabsTab
});

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/root/TabsRoot.js
var React19 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useControlled.js
var React9 = __toESM(require_react(), 1);
function useControlled({
  controlled,
  default: defaultProp,
  name,
  state = "value"
}) {
  const {
    current: isControlled
  } = React9.useRef(controlled !== void 0);
  const [valueState, setValue] = React9.useState(defaultProp);
  const value = isControlled ? controlled : valueState;
  if (true) {
    React9.useEffect(() => {
      if (isControlled !== (controlled !== void 0)) {
        console.error([`Base UI: A component is changing the ${isControlled ? "" : "un"}controlled ${state} state of ${name} to be ${isControlled ? "un" : ""}controlled.`, "Elements should not switch from uncontrolled to controlled (or vice versa).", `Decide between using a controlled or uncontrolled ${name} element for the lifetime of the component.`, "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.", "More info: https://fb.me/react-controlled-components"].join("\n"));
      }
    }, [state, name, controlled]);
    const {
      current: defaultValue2
    } = React9.useRef(defaultProp);
    React9.useEffect(() => {
      if (!isControlled && JSON.stringify(defaultValue2) !== JSON.stringify(defaultProp)) {
        console.error([`Base UI: A component is changing the default ${state} state of an uncontrolled ${name} after being initialized. To suppress this warning opt to use a controlled ${name}.`].join("\n"));
      }
    }, [JSON.stringify(defaultProp)]);
  }
  const setValueIfUncontrolled = React9.useCallback((newValue) => {
    if (!isControlled) {
      setValue(newValue);
    }
  }, []);
  return [value, setValueIfUncontrolled];
}

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useEventCallback.js
var React11 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useRefWithInit.js
var React10 = __toESM(require_react(), 1);
var UNINITIALIZED = {};
function useRefWithInit(init2, initArg) {
  const ref = React10.useRef(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = init2(initArg);
  }
  return ref;
}

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useEventCallback.js
var useInsertionEffect = React11[`useInsertionEffect${Math.random().toFixed(1)}`.slice(0, -3)];
var useSafeInsertionEffect = (
  // React 17 doesn't have useInsertionEffect.
  useInsertionEffect && // Preact replaces useInsertionEffect with useLayoutEffect and fires too late.
  useInsertionEffect !== React11.useLayoutEffect ? useInsertionEffect : (fn) => fn()
);
function useEventCallback(callback) {
  const stable = useRefWithInit(createStableCallback).current;
  stable.next = callback;
  useSafeInsertionEffect(stable.effect);
  return stable.trampoline;
}
function createStableCallback() {
  const stable = {
    next: void 0,
    callback: assertNotCalled,
    trampoline: (...args) => stable.callback?.(...args),
    effect: () => {
      stable.callback = stable.next;
    }
  };
  return stable;
}
function assertNotCalled() {
  if (true) {
    throw new Error("Base UI: Cannot call an event handler while rendering.");
  }
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/useRenderElement.js
var React13 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useMergedRefs.js
function useMergedRefs(a2, b2, c2, d2) {
  const forkRef = useRefWithInit(createForkRef).current;
  if (didChange(forkRef, a2, b2, c2, d2)) {
    update(forkRef, [a2, b2, c2, d2]);
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
function didChange(forkRef, a2, b2, c2, d2) {
  return forkRef.refs[0] !== a2 || forkRef.refs[1] !== b2 || forkRef.refs[2] !== c2 || forkRef.refs[3] !== d2;
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
      for (let i2 = 0; i2 < refs.length; i2 += 1) {
        const ref = refs[i2];
        if (ref == null) {
          continue;
        }
        switch (typeof ref) {
          case "function": {
            const refCleanup = ref(instance);
            if (typeof refCleanup === "function") {
              cleanupCallbacks[i2] = refCleanup;
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
        for (let i2 = 0; i2 < refs.length; i2 += 1) {
          const ref = refs[i2];
          if (ref == null) {
            continue;
          }
          switch (typeof ref) {
            case "function": {
              const cleanupCallback = cleanupCallbacks[i2];
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

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/reactVersion.js
var React12 = __toESM(require_react(), 1);
var majorVersion = parseInt(React12.version, 10);
function isReactVersionAtLeast(reactVersionToCheck) {
  return majorVersion >= reactVersionToCheck;
}

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/mergeObjects.js
function mergeObjects(a2, b2) {
  if (a2 && !b2) {
    return a2;
  }
  if (!a2 && b2) {
    return b2;
  }
  if (a2 || b2) {
    return {
      ...a2,
      ...b2
    };
  }
  return void 0;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/getStateAttributesProps.js
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

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/resolveClassName.js
function resolveClassName(className, state) {
  return typeof className === "function" ? className(state) : className;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/merge-props/mergeProps.js
var EMPTY_PROPS = {};
function mergeProps2(a2, b2, c2, d2, e2) {
  let merged = {
    ...resolvePropsGetter(a2, EMPTY_PROPS)
  };
  if (b2) {
    merged = mergeOne(merged, b2);
  }
  if (c2) {
    merged = mergeOne(merged, c2);
  }
  if (d2) {
    merged = mergeOne(merged, d2);
  }
  if (e2) {
    merged = mergeOne(merged, e2);
  }
  return merged;
}
function mergePropsN(props) {
  if (props.length === 0) {
    return EMPTY_PROPS;
  }
  if (props.length === 1) {
    return resolvePropsGetter(props[0], EMPTY_PROPS);
  }
  let merged = {
    ...resolvePropsGetter(props[0], EMPTY_PROPS)
  };
  for (let i2 = 1; i2 < props.length; i2 += 1) {
    merged = mergeOne(merged, props[i2]);
  }
  return merged;
}
function mergeOne(merged, inputProps) {
  if (isPropsGetter(inputProps)) {
    return inputProps(merged);
  }
  return mutablyMergeInto(merged, inputProps);
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
    return theirHandler;
  }
  return (event) => {
    if (isSyntheticEvent(event)) {
      const baseUIEvent = event;
      makeEventPreventable(baseUIEvent);
      const result2 = theirHandler(baseUIEvent);
      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler?.(baseUIEvent);
      }
      return result2;
    }
    const result = theirHandler(event);
    ourHandler?.(event);
    return result;
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

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/empty.js
var EMPTY_ARRAY6 = Object.freeze([]);
var EMPTY_OBJECT = Object.freeze({});

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/useRenderElement.js
var import_jsx_runtime101 = __toESM(require_jsx_runtime(), 1);
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
    render: renderProp
  } = componentProps;
  const {
    state = EMPTY_OBJECT,
    ref,
    props,
    stateAttributesMapping: stateAttributesMapping2,
    enabled = true
  } = params;
  const className = enabled ? resolveClassName(classNameProp, state) : void 0;
  const stateProps = enabled ? getStateAttributesProps(state, stateAttributesMapping2) : EMPTY_OBJECT;
  const outProps = enabled ? mergeObjects(stateProps, Array.isArray(props) ? mergePropsN(props) : props) ?? EMPTY_OBJECT : EMPTY_OBJECT;
  if (typeof document !== "undefined") {
    if (!enabled) {
      useMergedRefs(null, null);
    } else if (Array.isArray(ref)) {
      outProps.ref = useMergedRefsN([outProps.ref, getChildRef(renderProp), ...ref]);
    } else {
      outProps.ref = useMergedRefs(outProps.ref, getChildRef(renderProp), ref);
    }
  }
  if (!enabled) {
    return EMPTY_OBJECT;
  }
  if (className !== void 0) {
    outProps.className = mergeClassNames(outProps.className, className);
  }
  return outProps;
}
function evaluateRenderProp(element, render2, props, state) {
  if (render2) {
    if (typeof render2 === "function") {
      return render2(props, state);
    }
    const mergedProps = mergeProps2(props, render2.props);
    mergedProps.ref = props.ref;
    return /* @__PURE__ */ React13.cloneElement(render2, mergedProps);
  }
  if (element) {
    if (typeof element === "string") {
      return renderTag(element, props);
    }
  }
  throw new Error("Base UI: Render element or function are not defined.");
}
function renderTag(Tag, props) {
  if (Tag === "button") {
    return /* @__PURE__ */ (0, import_jsx_runtime101.jsx)("button", {
      type: "button",
      ...props
    });
  }
  if (Tag === "img") {
    return /* @__PURE__ */ (0, import_jsx_runtime101.jsx)("img", {
      alt: "",
      ...props
    });
  }
  return /* @__PURE__ */ React13.createElement(Tag, props);
}
function getChildRef(render2) {
  if (render2 && typeof render2 !== "function") {
    return isReactVersionAtLeast(19) ? render2.props.ref : render2.ref;
  }
  return null;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/list/CompositeList.js
var React16 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useIsoLayoutEffect.js
var React14 = __toESM(require_react(), 1);
var noop2 = () => {
};
var useIsoLayoutEffect = typeof document !== "undefined" ? React14.useLayoutEffect : noop2;

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/list/CompositeListContext.js
var React15 = __toESM(require_react(), 1);
var CompositeListContext = /* @__PURE__ */ React15.createContext({
  register: () => {
  },
  unregister: () => {
  },
  subscribeMapChange: () => {
    return () => {
    };
  },
  elementsRef: {
    current: []
  },
  nextIndexRef: {
    current: 0
  }
});
if (true) CompositeListContext.displayName = "CompositeListContext";
function useCompositeListContext() {
  return React15.useContext(CompositeListContext);
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/list/CompositeList.js
var import_jsx_runtime102 = __toESM(require_jsx_runtime(), 1);
function CompositeList(props) {
  const {
    children,
    elementsRef,
    labelsRef,
    onMapChange
  } = props;
  const nextIndexRef = React16.useRef(0);
  const listeners = useRefWithInit(createListeners).current;
  const map = useRefWithInit(createMap).current;
  const [mapTick, setMapTick] = React16.useState(EMPTY_OBJECT);
  const lastTickRef = React16.useRef(mapTick);
  const register = useEventCallback((node, metadata) => {
    map.set(node, metadata ?? null);
    lastTickRef.current = {};
    setMapTick(lastTickRef.current);
  });
  const unregister = useEventCallback((node) => {
    map.delete(node);
    lastTickRef.current = {};
    setMapTick(lastTickRef.current);
  });
  const sortedMap = React16.useMemo(() => {
    disableEslintWarning(mapTick);
    const newMap = /* @__PURE__ */ new Map();
    const sortedNodes = Array.from(map.keys()).sort(sortByDocumentPosition);
    sortedNodes.forEach((node, index) => {
      const metadata = map.get(node) ?? {};
      newMap.set(node, {
        ...metadata,
        index
      });
    });
    return newMap;
  }, [map, mapTick]);
  useIsoLayoutEffect(() => {
    if (typeof MutationObserver !== "function" || sortedMap.size === 0) {
      return void 0;
    }
    const mutationObserver = new MutationObserver((entries) => {
      const diff = /* @__PURE__ */ new Set();
      const updateDiff = (node) => diff.has(node) ? diff.delete(node) : diff.add(node);
      entries.forEach((entry) => {
        entry.removedNodes.forEach(updateDiff);
        entry.addedNodes.forEach(updateDiff);
      });
      if (diff.size === 0) {
        lastTickRef.current = {};
        setMapTick(lastTickRef.current);
      }
    });
    sortedMap.forEach((_, node) => {
      if (node.parentElement) {
        mutationObserver.observe(node.parentElement, {
          childList: true
        });
      }
    });
    return () => {
      mutationObserver.disconnect();
    };
  }, [sortedMap]);
  useIsoLayoutEffect(() => {
    const shouldUpdateLengths = lastTickRef.current === mapTick;
    if (shouldUpdateLengths) {
      if (elementsRef.current.length !== sortedMap.size) {
        elementsRef.current.length = sortedMap.size;
      }
      if (labelsRef && labelsRef.current.length !== sortedMap.size) {
        labelsRef.current.length = sortedMap.size;
      }
      nextIndexRef.current = sortedMap.size;
    }
    onMapChange?.(sortedMap);
  }, [onMapChange, sortedMap, elementsRef, labelsRef, mapTick]);
  const subscribeMapChange = useEventCallback((fn) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  });
  useIsoLayoutEffect(() => {
    listeners.forEach((l2) => l2(sortedMap));
  }, [listeners, sortedMap]);
  const contextValue = React16.useMemo(() => ({
    register,
    unregister,
    subscribeMapChange,
    elementsRef,
    labelsRef,
    nextIndexRef
  }), [register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef]);
  return /* @__PURE__ */ (0, import_jsx_runtime102.jsx)(CompositeListContext.Provider, {
    value: contextValue,
    children
  });
}
function createMap() {
  return /* @__PURE__ */ new Map();
}
function createListeners() {
  return /* @__PURE__ */ new Set();
}
function sortByDocumentPosition(a2, b2) {
  const position = a2.compareDocumentPosition(b2);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
    return -1;
  }
  if (position & Node.DOCUMENT_POSITION_PRECEDING || position & Node.DOCUMENT_POSITION_CONTAINS) {
    return 1;
  }
  return 0;
}
function disableEslintWarning(_) {
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/direction-provider/DirectionContext.js
var React17 = __toESM(require_react(), 1);
var DirectionContext = /* @__PURE__ */ React17.createContext(void 0);
if (true) DirectionContext.displayName = "DirectionContext";
function useDirection(optional = true) {
  const context = React17.useContext(DirectionContext);
  if (context === void 0 && !optional) {
    throw new Error("Base UI: DirectionContext is missing.");
  }
  return context?.direction ?? "ltr";
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/root/TabsRootContext.js
var React18 = __toESM(require_react(), 1);
var TabsRootContext = /* @__PURE__ */ React18.createContext(void 0);
if (true) TabsRootContext.displayName = "TabsRootContext";
function useTabsRootContext() {
  const context = React18.useContext(TabsRootContext);
  if (context === void 0) {
    throw new Error("Base UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.");
  }
  return context;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/root/TabsRootDataAttributes.js
var TabsRootDataAttributes = /* @__PURE__ */ (function(TabsRootDataAttributes2) {
  TabsRootDataAttributes2["activationDirection"] = "data-activation-direction";
  TabsRootDataAttributes2["orientation"] = "data-orientation";
  return TabsRootDataAttributes2;
})({});

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/root/stateAttributesMapping.js
var tabsStateAttributesMapping = {
  tabActivationDirection: (dir) => ({
    [TabsRootDataAttributes.activationDirection]: dir
  })
};

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/root/TabsRoot.js
var import_jsx_runtime103 = __toESM(require_jsx_runtime(), 1);
var TabsRoot = /* @__PURE__ */ React19.forwardRef(function TabsRoot2(componentProps, forwardedRef) {
  const {
    className,
    defaultValue: defaultValue2 = 0,
    onValueChange: onValueChangeProp,
    orientation = "horizontal",
    render: render2,
    value: valueProp,
    ...elementProps
  } = componentProps;
  const direction = useDirection();
  const tabPanelRefs = React19.useRef([]);
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue2,
    name: "Tabs",
    state: "value"
  });
  const [tabPanelMap, setTabPanelMap] = React19.useState(() => /* @__PURE__ */ new Map());
  const [tabMap, setTabMap] = React19.useState(() => /* @__PURE__ */ new Map());
  const [tabActivationDirection, setTabActivationDirection] = React19.useState("none");
  const onValueChange = useEventCallback((newValue, eventDetails) => {
    onValueChangeProp?.(newValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValue(newValue);
    setTabActivationDirection(eventDetails.activationDirection);
  });
  const getTabPanelIdByTabValueOrIndex = React19.useCallback((tabValue, index) => {
    if (tabValue === void 0 && index < 0) {
      return void 0;
    }
    for (const tabPanelMetadata of tabPanelMap.values()) {
      if (tabValue !== void 0 && tabPanelMetadata && tabValue === tabPanelMetadata?.value) {
        return tabPanelMetadata.id;
      }
      if (tabValue === void 0 && tabPanelMetadata?.index && tabPanelMetadata?.index === index) {
        return tabPanelMetadata.id;
      }
    }
    return void 0;
  }, [tabPanelMap]);
  const getTabIdByPanelValueOrIndex = React19.useCallback((tabPanelValue, index) => {
    if (tabPanelValue === void 0 && index < 0) {
      return void 0;
    }
    for (const tabMetadata of tabMap.values()) {
      if (tabPanelValue !== void 0 && index > -1 && tabPanelValue === (tabMetadata?.value ?? tabMetadata?.index ?? void 0)) {
        return tabMetadata?.id;
      }
      if (tabPanelValue === void 0 && index > -1 && index === (tabMetadata?.value ?? tabMetadata?.index ?? void 0)) {
        return tabMetadata?.id;
      }
    }
    return void 0;
  }, [tabMap]);
  const getTabElementBySelectedValue = React19.useCallback((selectedValue) => {
    if (selectedValue === void 0) {
      return null;
    }
    for (const [tabElement, tabMetadata] of tabMap.entries()) {
      if (tabMetadata != null && selectedValue === (tabMetadata.value ?? tabMetadata.index)) {
        return tabElement;
      }
    }
    return null;
  }, [tabMap]);
  const tabsContextValue = React19.useMemo(() => ({
    direction,
    getTabElementBySelectedValue,
    getTabIdByPanelValueOrIndex,
    getTabPanelIdByTabValueOrIndex,
    onValueChange,
    orientation,
    setTabMap,
    tabActivationDirection,
    value
  }), [direction, getTabElementBySelectedValue, getTabIdByPanelValueOrIndex, getTabPanelIdByTabValueOrIndex, onValueChange, orientation, setTabMap, tabActivationDirection, value]);
  const state = {
    orientation,
    tabActivationDirection
  };
  const element = useRenderElement("div", componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: tabsStateAttributesMapping
  });
  return /* @__PURE__ */ (0, import_jsx_runtime103.jsx)(TabsRootContext.Provider, {
    value: tabsContextValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime103.jsx)(CompositeList, {
      elementsRef: tabPanelRefs,
      onMapChange: setTabPanelMap,
      children: element
    })
  });
});
if (true) TabsRoot.displayName = "TabsRoot";

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/tab/TabsTab.js
var React28 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/owner.js
function ownerDocument(node) {
  return node?.ownerDocument || document;
}

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useId.js
var React21 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/safeReact.js
var React20 = __toESM(require_react(), 1);
var SafeReact = {
  ...React20
};

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useId.js
var globalId = 0;
function useGlobalId(idOverride, prefix2 = "mui") {
  const [defaultId, setDefaultId] = React21.useState(idOverride);
  const id = idOverride || defaultId;
  React21.useEffect(() => {
    if (defaultId == null) {
      globalId += 1;
      setDefaultId(`${prefix2}-${globalId}`);
    }
  }, [defaultId, prefix2]);
  return id;
}
var maybeReactUseId = SafeReact.useId;
function useId3(idOverride, prefix2) {
  if (maybeReactUseId !== void 0) {
    const reactId = maybeReactUseId();
    return idOverride ?? (prefix2 ? `${prefix2}-${reactId}` : reactId);
  }
  return useGlobalId(idOverride, prefix2);
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/useBaseUiId.js
function useBaseUiId(idOverride) {
  return useId3(idOverride, "base-ui");
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/use-button/useButton.js
var React24 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/error.js
var set;
if (true) {
  set = /* @__PURE__ */ new Set();
}
function error(...messages) {
  if (true) {
    const messageKey = messages.join(" ");
    if (!set.has(messageKey)) {
      set.add(messageKey);
      console.error(`Base UI: ${messageKey}`);
    }
  }
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/root/CompositeRootContext.js
var React22 = __toESM(require_react(), 1);
var CompositeRootContext = /* @__PURE__ */ React22.createContext(void 0);
if (true) CompositeRootContext.displayName = "CompositeRootContext";
function useCompositeRootContext(optional = false) {
  const context = React22.useContext(CompositeRootContext);
  if (context === void 0 && !optional) {
    throw new Error("Base UI: CompositeRootContext is missing. Composite parts must be placed within <Composite.Root>.");
  }
  return context;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/useFocusableWhenDisabled.js
var React23 = __toESM(require_react(), 1);
function useFocusableWhenDisabled(parameters) {
  const {
    focusableWhenDisabled,
    disabled,
    composite = false,
    tabIndex: tabIndexProp = 0,
    isNativeButton
  } = parameters;
  const isFocusableComposite = composite && focusableWhenDisabled !== false;
  const isNonFocusableComposite = composite && focusableWhenDisabled === false;
  const props = React23.useMemo(() => {
    const additionalProps = {
      // allow Tabbing away from focusableWhenDisabled elements
      onKeyDown(event) {
        if (disabled && focusableWhenDisabled && event.key !== "Tab") {
          event.preventDefault();
        }
      }
    };
    if (!composite) {
      additionalProps.tabIndex = tabIndexProp;
      if (!isNativeButton && disabled) {
        additionalProps.tabIndex = focusableWhenDisabled ? tabIndexProp : -1;
      }
    }
    if (isNativeButton && (focusableWhenDisabled || isFocusableComposite) || !isNativeButton && disabled) {
      additionalProps["aria-disabled"] = disabled;
    }
    if (isNativeButton && (!focusableWhenDisabled || isNonFocusableComposite)) {
      additionalProps.disabled = disabled;
    }
    return additionalProps;
  }, [composite, disabled, focusableWhenDisabled, isFocusableComposite, isNonFocusableComposite, isNativeButton, tabIndexProp]);
  return {
    props
  };
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/use-button/useButton.js
function useButton(parameters = {}) {
  const {
    disabled = false,
    focusableWhenDisabled,
    tabIndex = 0,
    native: isNativeButton = true
  } = parameters;
  const elementRef = React24.useRef(null);
  const isCompositeItem = useCompositeRootContext(true) !== void 0;
  const isValidLink = useEventCallback(() => {
    const element = elementRef.current;
    return Boolean(element?.tagName === "A" && element?.href);
  });
  const {
    props: focusableWhenDisabledProps
  } = useFocusableWhenDisabled({
    focusableWhenDisabled,
    disabled,
    composite: isCompositeItem,
    tabIndex,
    isNativeButton
  });
  if (true) {
    React24.useEffect(() => {
      if (!elementRef.current) {
        return;
      }
      const isButtonTag = elementRef.current.tagName === "BUTTON";
      if (isNativeButton) {
        if (!isButtonTag) {
          error("A component that acts as a button was not rendered as a native <button>, which does not match the default. Ensure that the element passed to the `render` prop of the component is a real <button>, or set the `nativeButton` prop on the component to `false`.");
        }
      } else if (isButtonTag) {
        error("A component that acts as a button was rendered as a native <button>, which does not match the default. Ensure that the element passed to the `render` prop of the component is not a real <button>, or set the `nativeButton` prop on the component to `true`.");
      }
    }, [isNativeButton]);
  }
  const updateDisabled = React24.useCallback(() => {
    const element = elementRef.current;
    if (!isButtonElement(element)) {
      return;
    }
    if (isCompositeItem && disabled && focusableWhenDisabledProps.disabled === void 0 && element.disabled) {
      element.disabled = false;
    }
  }, [disabled, focusableWhenDisabledProps.disabled, isCompositeItem]);
  useIsoLayoutEffect(updateDisabled, [updateDisabled]);
  const getButtonProps = React24.useCallback((externalProps = {}) => {
    const {
      onClick: externalOnClick,
      onMouseDown: externalOnMouseDown,
      onKeyUp: externalOnKeyUp,
      onKeyDown: externalOnKeyDown,
      onPointerDown: externalOnPointerDown,
      ...otherExternalProps
    } = externalProps;
    const type = isNativeButton ? "button" : void 0;
    return mergeProps2({
      type,
      onClick(event) {
        if (disabled) {
          event.preventDefault();
          return;
        }
        externalOnClick?.(event);
      },
      onMouseDown(event) {
        if (!disabled) {
          externalOnMouseDown?.(event);
        }
      },
      onKeyDown(event) {
        if (!disabled) {
          makeEventPreventable(event);
          externalOnKeyDown?.(event);
        }
        if (event.baseUIHandlerPrevented) {
          return;
        }
        const shouldClick = event.target === event.currentTarget && !isNativeButton && !isValidLink() && !disabled;
        const isEnterKey = event.key === "Enter";
        const isSpaceKey = event.key === " ";
        if (shouldClick) {
          if (isSpaceKey || isEnterKey) {
            event.preventDefault();
          }
          if (isEnterKey) {
            externalOnClick?.(event);
          }
        }
      },
      onKeyUp(event) {
        if (!disabled) {
          makeEventPreventable(event);
          externalOnKeyUp?.(event);
        }
        if (event.baseUIHandlerPrevented) {
          return;
        }
        if (event.target === event.currentTarget && !isNativeButton && !disabled && event.key === " ") {
          externalOnClick?.(event);
        }
      },
      onPointerDown(event) {
        if (disabled) {
          event.preventDefault();
          return;
        }
        externalOnPointerDown?.(event);
      }
    }, !isNativeButton ? {
      role: "button"
    } : void 0, focusableWhenDisabledProps, otherExternalProps);
  }, [disabled, focusableWhenDisabledProps, isNativeButton, isValidLink]);
  const buttonRef = useEventCallback((element) => {
    elementRef.current = element;
    updateDisabled();
  });
  return {
    getButtonProps,
    buttonRef
  };
}
function isButtonElement(elem) {
  return isHTMLElement(elem) && elem.tagName === "BUTTON";
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/constants.js
var ACTIVE_COMPOSITE_ITEM = "data-composite-item-active";

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/item/useCompositeItem.js
var React26 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/list/useCompositeListItem.js
var React25 = __toESM(require_react(), 1);
var IndexGuessBehavior = /* @__PURE__ */ (function(IndexGuessBehavior2) {
  IndexGuessBehavior2[IndexGuessBehavior2["None"] = 0] = "None";
  IndexGuessBehavior2[IndexGuessBehavior2["GuessFromOrder"] = 1] = "GuessFromOrder";
  return IndexGuessBehavior2;
})({});
function useCompositeListItem(params = {}) {
  const {
    label,
    metadata,
    textRef,
    indexGuessBehavior,
    index: externalIndex
  } = params;
  const {
    register,
    unregister,
    subscribeMapChange,
    elementsRef,
    labelsRef,
    nextIndexRef
  } = useCompositeListContext();
  const indexRef = React25.useRef(-1);
  const [index, setIndex] = React25.useState(externalIndex ?? (indexGuessBehavior === IndexGuessBehavior.GuessFromOrder ? () => {
    if (indexRef.current === -1) {
      const newIndex = nextIndexRef.current;
      nextIndexRef.current += 1;
      indexRef.current = newIndex;
    }
    return indexRef.current;
  } : -1));
  const componentRef = React25.useRef(null);
  const ref = React25.useCallback((node) => {
    componentRef.current = node;
    if (index !== -1 && node !== null) {
      elementsRef.current[index] = node;
      if (labelsRef) {
        const isLabelDefined = label !== void 0;
        labelsRef.current[index] = isLabelDefined ? label : textRef?.current?.textContent ?? node.textContent;
      }
    }
  }, [index, elementsRef, labelsRef, label, textRef]);
  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return void 0;
    }
    const node = componentRef.current;
    if (node) {
      register(node, metadata);
      return () => {
        unregister(node);
      };
    }
    return void 0;
  }, [externalIndex, register, unregister, metadata]);
  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return void 0;
    }
    return subscribeMapChange((map) => {
      const i2 = componentRef.current ? map.get(componentRef.current)?.index : null;
      if (i2 != null) {
        setIndex(i2);
      }
    });
  }, [externalIndex, subscribeMapChange, setIndex]);
  return React25.useMemo(() => ({
    ref,
    index
  }), [index, ref]);
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/item/useCompositeItem.js
function useCompositeItem3(params = {}) {
  const {
    highlightItemOnHover,
    highlightedIndex,
    onHighlightedIndexChange
  } = useCompositeRootContext();
  const {
    ref,
    index
  } = useCompositeListItem(params);
  const isHighlighted = highlightedIndex === index;
  const itemRef = React26.useRef(null);
  const mergedRef = useMergedRefs(ref, itemRef);
  const compositeProps = React26.useMemo(() => ({
    tabIndex: isHighlighted ? 0 : -1,
    onFocus() {
      onHighlightedIndexChange(index);
    },
    onMouseMove() {
      const item = itemRef.current;
      if (!highlightItemOnHover || !item) {
        return;
      }
      const disabled = item.hasAttribute("disabled") || item.ariaDisabled === "true";
      if (!isHighlighted && !disabled) {
        item.focus();
      }
    }
  }), [isHighlighted, onHighlightedIndexChange, index, highlightItemOnHover]);
  return {
    compositeProps,
    compositeRef: mergedRef,
    index
  };
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/list/TabsListContext.js
var React27 = __toESM(require_react(), 1);
var TabsListContext = /* @__PURE__ */ React27.createContext(void 0);
if (true) TabsListContext.displayName = "TabsListContext";
function useTabsListContext() {
  const context = React27.useContext(TabsListContext);
  if (context === void 0) {
    throw new Error("Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.");
  }
  return context;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/utils/createBaseUIEventDetails.js
function createChangeEventDetails(reason, event, customProperties) {
  let canceled = false;
  let allowPropagation = false;
  const custom = customProperties ?? EMPTY_OBJECT;
  return {
    reason,
    event: event ?? new Event("base-ui"),
    cancel() {
      canceled = true;
    },
    allowPropagation() {
      allowPropagation = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return allowPropagation;
    },
    ...custom
  };
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/floating-ui-react/utils/constants.js
var ARROW_LEFT = "ArrowLeft";
var ARROW_RIGHT = "ArrowRight";
var ARROW_UP = "ArrowUp";
var ARROW_DOWN = "ArrowDown";

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/floating-ui-react/utils/element.js
function activeElement(doc) {
  let element = doc.activeElement;
  while (element?.shadowRoot?.activeElement != null) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}
function contains2(parent, child) {
  if (!parent || !child) {
    return false;
  }
  const rootNode = child.getRootNode?.();
  if (parent.contains(child)) {
    return true;
  }
  if (rootNode && isShadowRoot(rootNode)) {
    let next = child;
    while (next) {
      if (parent === next) {
        return true;
      }
      next = next.parentNode || next.host;
    }
  }
  return false;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/floating-ui-react/utils/event.js
function stopEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/floating-ui-react/utils/composite.js
function isDifferentGridRow(index, cols, prevRow) {
  return Math.floor(index / cols) !== prevRow;
}
function isIndexOutOfListBounds(listRef, index) {
  return index < 0 || index >= listRef.current.length;
}
function getMinListIndex(listRef, disabledIndices) {
  return findNonDisabledListIndex(listRef, {
    disabledIndices
  });
}
function getMaxListIndex(listRef, disabledIndices) {
  return findNonDisabledListIndex(listRef, {
    decrement: true,
    startingIndex: listRef.current.length,
    disabledIndices
  });
}
function findNonDisabledListIndex(listRef, {
  startingIndex = -1,
  decrement = false,
  disabledIndices,
  amount = 1
} = {}) {
  let index = startingIndex;
  do {
    index += decrement ? -amount : amount;
  } while (index >= 0 && index <= listRef.current.length - 1 && isListIndexDisabled(listRef, index, disabledIndices));
  return index;
}
function getGridNavigatedIndex(listRef, {
  event,
  orientation,
  loop,
  rtl,
  cols,
  disabledIndices,
  minIndex,
  maxIndex,
  prevIndex,
  stopEvent: stop = false
}) {
  let nextIndex = prevIndex;
  const rows = [];
  const rowIndexMap = {};
  let hasRoleRow = false;
  {
    let currentRowEl = null;
    let currentRowIndex = -1;
    listRef.current.forEach((el, idx) => {
      if (el == null) {
        return;
      }
      const rowEl = el.closest('[role="row"]');
      if (rowEl) {
        hasRoleRow = true;
      }
      if (rowEl !== currentRowEl || currentRowIndex === -1) {
        currentRowEl = rowEl;
        currentRowIndex += 1;
        rows[currentRowIndex] = [];
      }
      rows[currentRowIndex].push(idx);
      rowIndexMap[idx] = currentRowIndex;
    });
  }
  const hasDomRows = hasRoleRow && rows.length > 0 && rows.some((row) => row.length !== cols);
  function navigateVertically(direction) {
    if (!hasDomRows || prevIndex === -1) {
      return void 0;
    }
    const currentRow = rowIndexMap[prevIndex];
    if (currentRow == null) {
      return void 0;
    }
    const colInRow = rows[currentRow].indexOf(prevIndex);
    let nextRow = direction === "up" ? currentRow - 1 : currentRow + 1;
    if (loop) {
      if (nextRow < 0) {
        nextRow = rows.length - 1;
      } else if (nextRow >= rows.length) {
        nextRow = 0;
      }
    }
    const visited = /* @__PURE__ */ new Set();
    while (nextRow >= 0 && nextRow < rows.length && !visited.has(nextRow)) {
      visited.add(nextRow);
      const targetRow = rows[nextRow];
      if (targetRow.length === 0) {
        nextRow = direction === "up" ? nextRow - 1 : nextRow + 1;
        continue;
      }
      const clampedCol = Math.min(colInRow, targetRow.length - 1);
      for (let col = clampedCol; col >= 0; col -= 1) {
        const candidate = targetRow[col];
        if (!isListIndexDisabled(listRef, candidate, disabledIndices)) {
          return candidate;
        }
      }
      nextRow = direction === "up" ? nextRow - 1 : nextRow + 1;
      if (loop) {
        if (nextRow < 0) {
          nextRow = rows.length - 1;
        } else if (nextRow >= rows.length) {
          nextRow = 0;
        }
      }
    }
    return void 0;
  }
  if (event.key === ARROW_UP) {
    const domBasedCandidate = navigateVertically("up");
    if (domBasedCandidate !== void 0) {
      if (stop) {
        stopEvent(event);
      }
      nextIndex = domBasedCandidate;
    } else {
      if (stop) {
        stopEvent(event);
      }
      if (prevIndex === -1) {
        nextIndex = maxIndex;
      } else {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: nextIndex,
          amount: cols,
          decrement: true,
          disabledIndices
        });
        if (loop && (prevIndex - cols < minIndex || nextIndex < 0)) {
          const col = prevIndex % cols;
          const maxCol = maxIndex % cols;
          const offset = maxIndex - (maxCol - col);
          if (maxCol === col) {
            nextIndex = maxIndex;
          } else {
            nextIndex = maxCol > col ? offset : offset - cols;
          }
        }
      }
      if (isIndexOutOfListBounds(listRef, nextIndex)) {
        nextIndex = prevIndex;
      }
    }
  }
  if (event.key === ARROW_DOWN) {
    const domBasedCandidate = navigateVertically("down");
    if (domBasedCandidate !== void 0) {
      if (stop) {
        stopEvent(event);
      }
      nextIndex = domBasedCandidate;
    } else {
      if (stop) {
        stopEvent(event);
      }
      if (prevIndex === -1) {
        nextIndex = minIndex;
      } else {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex,
          amount: cols,
          disabledIndices
        });
        if (loop && prevIndex + cols > maxIndex) {
          nextIndex = findNonDisabledListIndex(listRef, {
            startingIndex: prevIndex % cols - cols,
            amount: cols,
            disabledIndices
          });
        }
      }
      if (isIndexOutOfListBounds(listRef, nextIndex)) {
        nextIndex = prevIndex;
      }
    }
  }
  if (orientation === "both") {
    const prevRow = floor(prevIndex / cols);
    if (event.key === (rtl ? ARROW_LEFT : ARROW_RIGHT)) {
      if (stop) {
        stopEvent(event);
      }
      if (prevIndex % cols !== cols - 1) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex,
          disabledIndices
        });
        if (loop && isDifferentGridRow(nextIndex, cols, prevRow)) {
          nextIndex = findNonDisabledListIndex(listRef, {
            startingIndex: prevIndex - prevIndex % cols - 1,
            disabledIndices
          });
        }
      } else if (loop) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex - prevIndex % cols - 1,
          disabledIndices
        });
      }
      if (isDifferentGridRow(nextIndex, cols, prevRow)) {
        nextIndex = prevIndex;
      }
    }
    if (event.key === (rtl ? ARROW_RIGHT : ARROW_LEFT)) {
      if (stop) {
        stopEvent(event);
      }
      if (prevIndex % cols !== 0) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex,
          decrement: true,
          disabledIndices
        });
        if (loop && isDifferentGridRow(nextIndex, cols, prevRow)) {
          nextIndex = findNonDisabledListIndex(listRef, {
            startingIndex: prevIndex + (cols - prevIndex % cols),
            decrement: true,
            disabledIndices
          });
        }
      } else if (loop) {
        nextIndex = findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex + (cols - prevIndex % cols),
          decrement: true,
          disabledIndices
        });
      }
      if (isDifferentGridRow(nextIndex, cols, prevRow)) {
        nextIndex = prevIndex;
      }
    }
    const lastRow = floor(maxIndex / cols) === prevRow;
    if (isIndexOutOfListBounds(listRef, nextIndex)) {
      if (loop && lastRow) {
        nextIndex = event.key === (rtl ? ARROW_RIGHT : ARROW_LEFT) ? maxIndex : findNonDisabledListIndex(listRef, {
          startingIndex: prevIndex - prevIndex % cols - 1,
          disabledIndices
        });
      } else {
        nextIndex = prevIndex;
      }
    }
  }
  return nextIndex;
}
function createGridCellMap(sizes, cols, dense) {
  const cellMap = [];
  let startIndex = 0;
  sizes.forEach(({
    width,
    height
  }, index) => {
    if (width > cols) {
      if (true) {
        throw new Error(`[Floating UI]: Invalid grid - item width at index ${index} is greater than grid columns`);
      }
    }
    let itemPlaced = false;
    if (dense) {
      startIndex = 0;
    }
    while (!itemPlaced) {
      const targetCells = [];
      for (let i2 = 0; i2 < width; i2 += 1) {
        for (let j2 = 0; j2 < height; j2 += 1) {
          targetCells.push(startIndex + i2 + j2 * cols);
        }
      }
      if (startIndex % cols + width <= cols && targetCells.every((cell) => cellMap[cell] == null)) {
        targetCells.forEach((cell) => {
          cellMap[cell] = index;
        });
        itemPlaced = true;
      } else {
        startIndex += 1;
      }
    }
  });
  return [...cellMap];
}
function getGridCellIndexOfCorner(index, sizes, cellMap, cols, corner) {
  if (index === -1) {
    return -1;
  }
  const firstCellIndex = cellMap.indexOf(index);
  const sizeItem = sizes[index];
  switch (corner) {
    case "tl":
      return firstCellIndex;
    case "tr":
      if (!sizeItem) {
        return firstCellIndex;
      }
      return firstCellIndex + sizeItem.width - 1;
    case "bl":
      if (!sizeItem) {
        return firstCellIndex;
      }
      return firstCellIndex + (sizeItem.height - 1) * cols;
    case "br":
      return cellMap.lastIndexOf(index);
    default:
      return -1;
  }
}
function getGridCellIndices(indices, cellMap) {
  return cellMap.flatMap((index, cellIndex) => indices.includes(index) ? [cellIndex] : []);
}
function isListIndexDisabled(listRef, index, disabledIndices) {
  if (typeof disabledIndices === "function") {
    return disabledIndices(index);
  }
  if (disabledIndices) {
    return disabledIndices.includes(index);
  }
  const element = listRef.current[index];
  return element == null || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/tab/TabsTab.js
var TabsTab = /* @__PURE__ */ React28.forwardRef(function TabsTab2(componentProps, forwardedRef) {
  const {
    className,
    disabled = false,
    render: render2,
    value: valueProp,
    id: idProp,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const {
    value: selectedTabValue,
    getTabPanelIdByTabValueOrIndex,
    orientation
  } = useTabsRootContext();
  const {
    activateOnFocus,
    highlightedTabIndex,
    onTabActivation,
    setHighlightedTabIndex,
    tabsListRef
  } = useTabsListContext();
  const id = useBaseUiId(idProp);
  const tabMetadata = React28.useMemo(() => ({
    disabled,
    id,
    value: valueProp
  }), [disabled, id, valueProp]);
  const {
    compositeProps,
    compositeRef,
    index
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem3({
    metadata: tabMetadata
  });
  const tabValue = valueProp ?? index;
  const selected = React28.useMemo(() => {
    if (valueProp === void 0) {
      return index < 0 ? false : index === selectedTabValue;
    }
    return valueProp === selectedTabValue;
  }, [index, selectedTabValue, valueProp]);
  const isNavigatingRef = React28.useRef(false);
  useIsoLayoutEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    if (!(selected && index > -1 && highlightedTabIndex !== index)) {
      return;
    }
    const listElement = tabsListRef.current;
    const activeEl = activeElement(ownerDocument(listElement));
    if (listElement && activeEl && contains2(listElement, activeEl)) {
      return;
    }
    setHighlightedTabIndex(index);
  }, [selected, index, highlightedTabIndex, setHighlightedTabIndex, disabled, tabsListRef]);
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true
  });
  const tabPanelId = index > -1 ? getTabPanelIdByTabValueOrIndex(valueProp, index) : void 0;
  const isPressingRef = React28.useRef(false);
  const isMainButtonRef = React28.useRef(false);
  const onClick = useEventCallback((event) => {
    if (selected || disabled) {
      return;
    }
    onTabActivation(tabValue, createChangeEventDetails("none", event.nativeEvent, {
      activationDirection: "none"
    }));
  });
  const onFocus = useEventCallback((event) => {
    if (selected) {
      return;
    }
    if (index > -1) {
      setHighlightedTabIndex(index);
    }
    if (disabled) {
      return;
    }
    if (activateOnFocus && !isPressingRef.current || // keyboard or touch focus
    isPressingRef.current && isMainButtonRef.current) {
      onTabActivation(tabValue, createChangeEventDetails("none", event.nativeEvent, {
        activationDirection: "none"
      }));
    }
  });
  const onPointerDown = useEventCallback((event) => {
    if (selected || disabled) {
      return;
    }
    isPressingRef.current = true;
    function handlePointerUp() {
      isPressingRef.current = false;
      isMainButtonRef.current = false;
    }
    if (!event.button || event.button === 0) {
      isMainButtonRef.current = true;
      const doc = ownerDocument(event.currentTarget);
      doc.addEventListener("pointerup", handlePointerUp, {
        once: true
      });
    }
  });
  const state = React28.useMemo(() => ({
    disabled,
    selected,
    orientation
  }), [disabled, selected, orientation]);
  const element = useRenderElement("button", componentProps, {
    state,
    ref: [forwardedRef, buttonRef, compositeRef],
    props: [compositeProps, {
      role: "tab",
      "aria-controls": tabPanelId,
      "aria-selected": selected,
      id,
      onClick,
      onFocus,
      onPointerDown,
      [ACTIVE_COMPOSITE_ITEM]: selected ? "" : void 0,
      onKeyDownCapture() {
        isNavigatingRef.current = true;
      }
    }, elementProps, getButtonProps]
  });
  return element;
});
if (true) TabsTab.displayName = "TabsTab";

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/indicator/TabsIndicator.js
var React31 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/generateId.js
var counter = 0;
function generateId(prefix2) {
  counter += 1;
  return `${prefix2}-${Math.random().toString(36).slice(2, 6)}-${counter}`;
}

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useForcedRerendering.js
var React29 = __toESM(require_react(), 1);
function useForcedRerendering() {
  const [, setState] = React29.useState({});
  return React29.useCallback(() => {
    setState({});
  }, []);
}

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/useOnMount.js
var React30 = __toESM(require_react(), 1);
var EMPTY = [];
function useOnMount(fn) {
  React30.useEffect(fn, EMPTY);
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/indicator/prehydrationScript.min.js
var script = '!function(){const t=document.currentScript.previousElementSibling;if(!t)return;const e=t.closest(\'[role="tablist"]\');if(!e)return;const o=e.querySelector("[data-selected]");if(!o)return;if(0===o.offsetWidth||0===e.offsetWidth)return;const i=getComputedStyle(e).direction,f=o.offsetLeft-e.clientLeft,{width:n,height:r}=o.getBoundingClientRect(),l=Math.floor(n),c=Math.floor(r),s="ltr"===i?e.scrollWidth-o.offsetLeft-l-e.clientLeft:o.offsetLeft-e.clientLeft,h=o.offsetTop-e.clientTop,d=e.scrollHeight-o.offsetTop-c-e.clientTop;function u(e,o){t.style.setProperty(`--active-tab-${e}`,`${o}px`)}u("left",f),u("right",s),u("top",h),u("bottom",d),u("width",l),u("height",c),l>0&&c>0&&t.removeAttribute("hidden")}();';

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/indicator/TabsIndicatorCssVars.js
var TabsIndicatorCssVars = /* @__PURE__ */ (function(TabsIndicatorCssVars2) {
  TabsIndicatorCssVars2["activeTabLeft"] = "--active-tab-left";
  TabsIndicatorCssVars2["activeTabRight"] = "--active-tab-right";
  TabsIndicatorCssVars2["activeTabTop"] = "--active-tab-top";
  TabsIndicatorCssVars2["activeTabBottom"] = "--active-tab-bottom";
  TabsIndicatorCssVars2["activeTabWidth"] = "--active-tab-width";
  TabsIndicatorCssVars2["activeTabHeight"] = "--active-tab-height";
  return TabsIndicatorCssVars2;
})({});

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/indicator/TabsIndicator.js
var import_jsx_runtime104 = __toESM(require_jsx_runtime(), 1);
var stateAttributesMapping = {
  ...tabsStateAttributesMapping,
  selectedTabPosition: () => null,
  selectedTabSize: () => null
};
var TabsIndicator = /* @__PURE__ */ React31.forwardRef(function TabIndicator(componentProps, forwardedRef) {
  const {
    className,
    render: render2,
    renderBeforeHydration = false,
    ...elementProps
  } = componentProps;
  const {
    getTabElementBySelectedValue,
    orientation,
    tabActivationDirection,
    value
  } = useTabsRootContext();
  const {
    tabsListRef
  } = useTabsListContext();
  const [instanceId] = React31.useState(() => generateId("tab"));
  const [isMounted, setIsMounted] = React31.useState(false);
  const {
    value: activeTabValue
  } = useTabsRootContext();
  const direction = useDirection();
  useOnMount(() => setIsMounted(true));
  const rerender = useForcedRerendering();
  React31.useEffect(() => {
    if (value != null && tabsListRef.current != null && typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        rerender();
      });
      resizeObserver.observe(tabsListRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
    return void 0;
  }, [value, tabsListRef, rerender]);
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let width = 0;
  let height = 0;
  let isTabSelected = false;
  if (value != null && tabsListRef.current != null) {
    const selectedTab = getTabElementBySelectedValue(value);
    const tabsList = tabsListRef.current;
    isTabSelected = true;
    if (selectedTab != null) {
      left = selectedTab.offsetLeft - tabsList.clientLeft;
      top = selectedTab.offsetTop - tabsList.clientTop;
      const {
        width: rectWidth,
        height: rectHeight
      } = selectedTab.getBoundingClientRect();
      width = Math.floor(rectWidth);
      height = Math.floor(rectHeight);
      right = direction === "ltr" ? tabsList.scrollWidth - selectedTab.offsetLeft - width - tabsList.clientLeft : selectedTab.offsetLeft - tabsList.clientLeft;
      bottom = tabsList.scrollHeight - selectedTab.offsetTop - height - tabsList.clientTop;
    }
  }
  const selectedTabPosition = React31.useMemo(() => isTabSelected ? {
    left,
    right,
    top,
    bottom
  } : null, [left, right, top, bottom, isTabSelected]);
  const selectedTabSize = React31.useMemo(() => isTabSelected ? {
    width,
    height
  } : null, [width, height, isTabSelected]);
  const style = React31.useMemo(() => {
    if (!isTabSelected) {
      return void 0;
    }
    return {
      [TabsIndicatorCssVars.activeTabLeft]: `${left}px`,
      [TabsIndicatorCssVars.activeTabRight]: `${right}px`,
      [TabsIndicatorCssVars.activeTabTop]: `${top}px`,
      [TabsIndicatorCssVars.activeTabBottom]: `${bottom}px`,
      [TabsIndicatorCssVars.activeTabWidth]: `${width}px`,
      [TabsIndicatorCssVars.activeTabHeight]: `${height}px`
    };
  }, [left, right, top, bottom, width, height, isTabSelected]);
  const displayIndicator = isTabSelected && width > 0 && height > 0;
  const state = React31.useMemo(() => ({
    orientation,
    selectedTabPosition,
    selectedTabSize,
    tabActivationDirection
  }), [orientation, selectedTabPosition, selectedTabSize, tabActivationDirection]);
  const element = useRenderElement("span", componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: "presentation",
      style,
      hidden: !displayIndicator
      // do not display the indicator before the layout is settled
    }, elementProps, {
      ["data-instance-id"]: !(isMounted && renderBeforeHydration) ? instanceId : void 0,
      suppressHydrationWarning: true
    }],
    stateAttributesMapping
  });
  if (activeTabValue == null) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime104.jsxs)(React31.Fragment, {
    children: [element, !isMounted && renderBeforeHydration && /* @__PURE__ */ (0, import_jsx_runtime104.jsx)("script", {
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML: {
        __html: script
      },
      suppressHydrationWarning: true
    })]
  });
});
if (true) TabsIndicator.displayName = "TabsIndicator";

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/panel/TabsPanel.js
var React32 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/panel/TabsPanelDataAttributes.js
var TabsPanelDataAttributes = /* @__PURE__ */ (function(TabsPanelDataAttributes2) {
  TabsPanelDataAttributes2["index"] = "data-index";
  TabsPanelDataAttributes2["activationDirection"] = "data-activation-direction";
  TabsPanelDataAttributes2["orientation"] = "data-orientation";
  TabsPanelDataAttributes2["hidden"] = "data-hidden";
  return TabsPanelDataAttributes2;
})({});

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/panel/TabsPanel.js
var TabsPanel = /* @__PURE__ */ React32.forwardRef(function TabPanel(componentProps, forwardedRef) {
  const {
    children,
    className,
    value: valueProp,
    render: render2,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const {
    value: selectedValue,
    getTabIdByPanelValueOrIndex,
    orientation,
    tabActivationDirection
  } = useTabsRootContext();
  const id = useBaseUiId();
  const metadata = React32.useMemo(() => ({
    id,
    value: valueProp
  }), [id, valueProp]);
  const {
    ref: listItemRef,
    index
  } = useCompositeListItem({
    metadata
  });
  const tabPanelValue = valueProp ?? index;
  const hidden = tabPanelValue !== selectedValue;
  const correspondingTabId = React32.useMemo(() => {
    return getTabIdByPanelValueOrIndex(valueProp, index);
  }, [getTabIdByPanelValueOrIndex, index, valueProp]);
  const state = React32.useMemo(() => ({
    hidden,
    orientation,
    tabActivationDirection
  }), [hidden, orientation, tabActivationDirection]);
  const element = useRenderElement("div", componentProps, {
    state,
    ref: [forwardedRef, listItemRef],
    props: [{
      "aria-labelledby": correspondingTabId,
      hidden,
      id: id ?? void 0,
      role: "tabpanel",
      tabIndex: hidden ? -1 : 0,
      [TabsPanelDataAttributes.index]: index
    }, elementProps, {
      children: hidden && !keepMounted ? void 0 : children
    }],
    stateAttributesMapping: tabsStateAttributesMapping
  });
  return element;
});
if (true) TabsPanel.displayName = "TabsPanel";

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/list/TabsList.js
var React35 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/root/CompositeRoot.js
var React34 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/root/useCompositeRoot.js
var React33 = __toESM(require_react(), 1);

// ../../../node_modules/.pnpm/@base-ui-components+utils@0.1.2_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/utils/esm/isElementDisabled.js
function isElementDisabled(element) {
  return element == null || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/composite.js
var ARROW_UP2 = "ArrowUp";
var ARROW_DOWN2 = "ArrowDown";
var ARROW_LEFT2 = "ArrowLeft";
var ARROW_RIGHT2 = "ArrowRight";
var HOME = "Home";
var END = "End";
var HORIZONTAL_KEYS = /* @__PURE__ */ new Set([ARROW_LEFT2, ARROW_RIGHT2]);
var HORIZONTAL_KEYS_WITH_EXTRA_KEYS = /* @__PURE__ */ new Set([ARROW_LEFT2, ARROW_RIGHT2, HOME, END]);
var VERTICAL_KEYS = /* @__PURE__ */ new Set([ARROW_UP2, ARROW_DOWN2]);
var VERTICAL_KEYS_WITH_EXTRA_KEYS = /* @__PURE__ */ new Set([ARROW_UP2, ARROW_DOWN2, HOME, END]);
var ARROW_KEYS = /* @__PURE__ */ new Set([...HORIZONTAL_KEYS, ...VERTICAL_KEYS]);
var ALL_KEYS = /* @__PURE__ */ new Set([...ARROW_KEYS, HOME, END]);
var SHIFT = "Shift";
var CONTROL = "Control";
var ALT = "Alt";
var META = "Meta";
var MODIFIER_KEYS = /* @__PURE__ */ new Set([SHIFT, CONTROL, ALT, META]);
function isInputElement(element) {
  return isHTMLElement(element) && element.tagName === "INPUT";
}
function isNativeInput(element) {
  if (isInputElement(element) && element.selectionStart != null) {
    return true;
  }
  if (isHTMLElement(element) && element.tagName === "TEXTAREA") {
    return true;
  }
  return false;
}
function scrollIntoViewIfNeeded2(scrollContainer, element, direction, orientation) {
  if (!scrollContainer || !element || !element.scrollTo) {
    return;
  }
  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;
  const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;
  if (isOverflowingX && orientation !== "vertical") {
    const elementOffsetLeft = getOffset(scrollContainer, element, "left");
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);
    if (direction === "ltr") {
      if (elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight > scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight) {
        targetX = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
      } else if (elementOffsetLeft - elementStyles.scrollMarginLeft < scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft) {
        targetX = elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;
      }
    }
    if (direction === "rtl") {
      if (elementOffsetLeft - elementStyles.scrollMarginRight < scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft) {
        targetX = elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;
      } else if (elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight > scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight) {
        targetX = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
      }
    }
  }
  if (isOverflowingY && orientation !== "horizontal") {
    const elementOffsetTop = getOffset(scrollContainer, element, "top");
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);
    if (elementOffsetTop - elementStyles.scrollMarginTop < scrollContainer.scrollTop + containerStyles.scrollPaddingTop) {
      targetY = elementOffsetTop - elementStyles.scrollMarginTop - containerStyles.scrollPaddingTop;
    } else if (elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom > scrollContainer.scrollTop + scrollContainer.clientHeight - containerStyles.scrollPaddingBottom) {
      targetY = elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom - scrollContainer.clientHeight + containerStyles.scrollPaddingBottom;
    }
  }
  scrollContainer.scrollTo({
    left: targetX,
    top: targetY,
    behavior: "auto"
  });
}
function getOffset(ancestor, element, side) {
  const propName = side === "left" ? "offsetLeft" : "offsetTop";
  let result = 0;
  while (element.offsetParent) {
    result += element[propName];
    if (element.offsetParent === ancestor) {
      break;
    }
    element = element.offsetParent;
  }
  return result;
}
function getStyles(element) {
  const styles = getComputedStyle(element);
  return {
    scrollMarginTop: parseFloat(styles.scrollMarginTop) || 0,
    scrollMarginRight: parseFloat(styles.scrollMarginRight) || 0,
    scrollMarginBottom: parseFloat(styles.scrollMarginBottom) || 0,
    scrollMarginLeft: parseFloat(styles.scrollMarginLeft) || 0,
    scrollPaddingTop: parseFloat(styles.scrollPaddingTop) || 0,
    scrollPaddingRight: parseFloat(styles.scrollPaddingRight) || 0,
    scrollPaddingBottom: parseFloat(styles.scrollPaddingBottom) || 0,
    scrollPaddingLeft: parseFloat(styles.scrollPaddingLeft) || 0
  };
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/root/useCompositeRoot.js
var EMPTY_ARRAY7 = [];
function useCompositeRoot(params) {
  const {
    itemSizes,
    cols = 1,
    loop = true,
    dense = false,
    orientation = "both",
    direction,
    highlightedIndex: externalHighlightedIndex,
    onHighlightedIndexChange: externalSetHighlightedIndex,
    rootRef: externalRef,
    enableHomeAndEndKeys = false,
    stopEventPropagation = false,
    disabledIndices,
    modifierKeys = EMPTY_ARRAY7
  } = params;
  const [internalHighlightedIndex, internalSetHighlightedIndex] = React33.useState(0);
  const isGrid2 = cols > 1;
  const rootRef = React33.useRef(null);
  const mergedRef = useMergedRefs(rootRef, externalRef);
  const elementsRef = React33.useRef([]);
  const hasSetDefaultIndexRef = React33.useRef(false);
  const highlightedIndex = externalHighlightedIndex ?? internalHighlightedIndex;
  const onHighlightedIndexChange = useEventCallback((index, shouldScrollIntoView = false) => {
    (externalSetHighlightedIndex ?? internalSetHighlightedIndex)(index);
    if (shouldScrollIntoView) {
      const newActiveItem = elementsRef.current[index];
      scrollIntoViewIfNeeded2(rootRef.current, newActiveItem, direction, orientation);
    }
  });
  const onMapChange = useEventCallback((map) => {
    if (map.size === 0 || hasSetDefaultIndexRef.current) {
      return;
    }
    hasSetDefaultIndexRef.current = true;
    const sortedElements = Array.from(map.keys());
    const activeItem = sortedElements.find((compositeElement) => compositeElement?.hasAttribute(ACTIVE_COMPOSITE_ITEM)) ?? null;
    const activeIndex = activeItem ? sortedElements.indexOf(activeItem) : -1;
    if (activeIndex !== -1) {
      onHighlightedIndexChange(activeIndex);
    }
    scrollIntoViewIfNeeded2(rootRef.current, activeItem, direction, orientation);
  });
  const props = React33.useMemo(() => ({
    "aria-orientation": orientation === "both" ? void 0 : orientation,
    ref: mergedRef,
    onFocus(event) {
      const element = rootRef.current;
      if (!element || !isNativeInput(event.target)) {
        return;
      }
      event.target.setSelectionRange(0, event.target.value.length ?? 0);
    },
    onKeyDown(event) {
      const RELEVANT_KEYS = enableHomeAndEndKeys ? ALL_KEYS : ARROW_KEYS;
      if (!RELEVANT_KEYS.has(event.key)) {
        return;
      }
      if (isModifierKeySet(event, modifierKeys)) {
        return;
      }
      const element = rootRef.current;
      if (!element) {
        return;
      }
      const isRtl = direction === "rtl";
      const horizontalForwardKey = isRtl ? ARROW_LEFT2 : ARROW_RIGHT2;
      const forwardKey = {
        horizontal: horizontalForwardKey,
        vertical: ARROW_DOWN2,
        both: horizontalForwardKey
      }[orientation];
      const horizontalBackwardKey = isRtl ? ARROW_RIGHT2 : ARROW_LEFT2;
      const backwardKey = {
        horizontal: horizontalBackwardKey,
        vertical: ARROW_UP2,
        both: horizontalBackwardKey
      }[orientation];
      if (isNativeInput(event.target) && !isElementDisabled(event.target)) {
        const selectionStart = event.target.selectionStart;
        const selectionEnd = event.target.selectionEnd;
        const textContent = event.target.value ?? "";
        if (selectionStart == null || event.shiftKey || selectionStart !== selectionEnd) {
          return;
        }
        if (event.key !== backwardKey && selectionStart < textContent.length) {
          return;
        }
        if (event.key !== forwardKey && selectionStart > 0) {
          return;
        }
      }
      let nextIndex = highlightedIndex;
      const minIndex = getMinListIndex(elementsRef, disabledIndices);
      const maxIndex = getMaxListIndex(elementsRef, disabledIndices);
      if (isGrid2) {
        const sizes = itemSizes || Array.from({
          length: elementsRef.current.length
        }, () => ({
          width: 1,
          height: 1
        }));
        const cellMap = createGridCellMap(sizes, cols, dense);
        const minGridIndex = cellMap.findIndex((index) => index != null && !isListIndexDisabled(elementsRef, index, disabledIndices));
        const maxGridIndex = cellMap.reduce((foundIndex, index, cellIndex) => index != null && !isListIndexDisabled(elementsRef, index, disabledIndices) ? cellIndex : foundIndex, -1);
        nextIndex = cellMap[getGridNavigatedIndex({
          current: cellMap.map((itemIndex) => itemIndex ? elementsRef.current[itemIndex] : null)
        }, {
          event,
          orientation,
          loop,
          cols,
          // treat undefined (empty grid spaces) as disabled indices so we
          // don't end up in them
          disabledIndices: getGridCellIndices([...disabledIndices || elementsRef.current.map((_, index) => isListIndexDisabled(elementsRef, index) ? index : void 0), void 0], cellMap),
          minIndex: minGridIndex,
          maxIndex: maxGridIndex,
          prevIndex: getGridCellIndexOfCorner(
            highlightedIndex > maxIndex ? minIndex : highlightedIndex,
            sizes,
            cellMap,
            cols,
            // use a corner matching the edge closest to the direction we're
            // moving in so we don't end up in the same item. Prefer
            // top/left over bottom/right.
            // eslint-disable-next-line no-nested-ternary
            event.key === ARROW_DOWN2 ? "bl" : event.key === ARROW_RIGHT2 ? "tr" : "tl"
          ),
          rtl: isRtl
        })];
      }
      const forwardKeys = {
        horizontal: [horizontalForwardKey],
        vertical: [ARROW_DOWN2],
        both: [horizontalForwardKey, ARROW_DOWN2]
      }[orientation];
      const backwardKeys = {
        horizontal: [horizontalBackwardKey],
        vertical: [ARROW_UP2],
        both: [horizontalBackwardKey, ARROW_UP2]
      }[orientation];
      const preventedKeys = isGrid2 ? RELEVANT_KEYS : {
        horizontal: enableHomeAndEndKeys ? HORIZONTAL_KEYS_WITH_EXTRA_KEYS : HORIZONTAL_KEYS,
        vertical: enableHomeAndEndKeys ? VERTICAL_KEYS_WITH_EXTRA_KEYS : VERTICAL_KEYS,
        both: RELEVANT_KEYS
      }[orientation];
      if (enableHomeAndEndKeys) {
        if (event.key === HOME) {
          nextIndex = minIndex;
        } else if (event.key === END) {
          nextIndex = maxIndex;
        }
      }
      if (nextIndex === highlightedIndex && (forwardKeys.includes(event.key) || backwardKeys.includes(event.key))) {
        if (loop && nextIndex === maxIndex && forwardKeys.includes(event.key)) {
          nextIndex = minIndex;
        } else if (loop && nextIndex === minIndex && backwardKeys.includes(event.key)) {
          nextIndex = maxIndex;
        } else {
          nextIndex = findNonDisabledListIndex(elementsRef, {
            startingIndex: nextIndex,
            decrement: backwardKeys.includes(event.key),
            disabledIndices
          });
        }
      }
      if (nextIndex !== highlightedIndex && !isIndexOutOfListBounds(elementsRef, nextIndex)) {
        if (stopEventPropagation) {
          event.stopPropagation();
        }
        if (preventedKeys.has(event.key)) {
          event.preventDefault();
        }
        onHighlightedIndexChange(nextIndex, true);
        queueMicrotask(() => {
          elementsRef.current[nextIndex]?.focus();
        });
      }
    }
  }), [cols, dense, direction, disabledIndices, elementsRef, enableHomeAndEndKeys, highlightedIndex, isGrid2, itemSizes, loop, mergedRef, modifierKeys, onHighlightedIndexChange, orientation, stopEventPropagation]);
  return React33.useMemo(() => ({
    props,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    disabledIndices,
    onMapChange
  }), [props, highlightedIndex, onHighlightedIndexChange, elementsRef, disabledIndices, onMapChange]);
}
function isModifierKeySet(event, ignoredModifierKeys) {
  for (const key of MODIFIER_KEYS.values()) {
    if (ignoredModifierKeys.includes(key)) {
      continue;
    }
    if (event.getModifierState(key)) {
      return true;
    }
  }
  return false;
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/composite/root/CompositeRoot.js
var import_jsx_runtime105 = __toESM(require_jsx_runtime(), 1);
function CompositeRoot(componentProps) {
  const {
    render: render2,
    className,
    refs = EMPTY_ARRAY6,
    props = EMPTY_ARRAY6,
    state = EMPTY_OBJECT,
    stateAttributesMapping: stateAttributesMapping2,
    highlightedIndex: highlightedIndexProp,
    onHighlightedIndexChange: onHighlightedIndexChangeProp,
    orientation,
    dense,
    itemSizes,
    loop,
    cols,
    enableHomeAndEndKeys,
    onMapChange: onMapChangeProp,
    stopEventPropagation = true,
    rootRef,
    disabledIndices,
    modifierKeys,
    highlightItemOnHover = false,
    tag = "div",
    ...elementProps
  } = componentProps;
  const direction = useDirection();
  const {
    props: defaultProps,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    onMapChange: onMapChangeUnwrapped
  } = useCompositeRoot({
    itemSizes,
    cols,
    loop,
    dense,
    orientation,
    highlightedIndex: highlightedIndexProp,
    onHighlightedIndexChange: onHighlightedIndexChangeProp,
    rootRef,
    stopEventPropagation,
    enableHomeAndEndKeys,
    direction,
    disabledIndices,
    modifierKeys
  });
  const onMapChange = useEventCallback((newMap) => {
    onMapChangeProp?.(newMap);
    onMapChangeUnwrapped(newMap);
  });
  const element = useRenderElement(tag, componentProps, {
    state,
    ref: refs,
    props: [defaultProps, ...props, elementProps],
    stateAttributesMapping: stateAttributesMapping2
  });
  const contextValue = React34.useMemo(() => ({
    highlightedIndex,
    onHighlightedIndexChange,
    highlightItemOnHover
  }), [highlightedIndex, onHighlightedIndexChange, highlightItemOnHover]);
  return /* @__PURE__ */ (0, import_jsx_runtime105.jsx)(CompositeRootContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime105.jsx)(CompositeList, {
      elementsRef,
      onMapChange,
      children: element
    })
  });
}

// ../../../node_modules/.pnpm/@base-ui-components+react@1.0.0-beta.4_@types+react@18.3.26_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@base-ui-components/react/esm/tabs/list/TabsList.js
var import_jsx_runtime106 = __toESM(require_jsx_runtime(), 1);
var EMPTY_ARRAY8 = [];
var TabsList = /* @__PURE__ */ React35.forwardRef(function TabsList2(componentProps, forwardedRef) {
  const {
    activateOnFocus = true,
    className,
    loop = true,
    render: render2,
    ...elementProps
  } = componentProps;
  const {
    getTabElementBySelectedValue,
    onValueChange,
    orientation,
    value,
    setTabMap,
    tabActivationDirection
  } = useTabsRootContext();
  const [highlightedTabIndex, setHighlightedTabIndex] = React35.useState(0);
  const tabsListRef = React35.useRef(null);
  const detectActivationDirection = useActivationDirectionDetector(
    value,
    // the old value
    orientation,
    tabsListRef,
    getTabElementBySelectedValue
  );
  const onTabActivation = useEventCallback((newValue, eventDetails) => {
    if (newValue !== value) {
      const activationDirection = detectActivationDirection(newValue);
      eventDetails.activationDirection = activationDirection;
      onValueChange(newValue, eventDetails);
    }
  });
  const state = React35.useMemo(() => ({
    orientation,
    tabActivationDirection
  }), [orientation, tabActivationDirection]);
  const defaultProps = {
    "aria-orientation": orientation === "vertical" ? "vertical" : void 0,
    role: "tablist"
  };
  const tabsListContextValue = React35.useMemo(() => ({
    activateOnFocus,
    highlightedTabIndex,
    onTabActivation,
    setHighlightedTabIndex,
    tabsListRef,
    value
  }), [activateOnFocus, highlightedTabIndex, onTabActivation, setHighlightedTabIndex, tabsListRef, value]);
  return /* @__PURE__ */ (0, import_jsx_runtime106.jsx)(TabsListContext.Provider, {
    value: tabsListContextValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime106.jsx)(CompositeRoot, {
      render: render2,
      className,
      state,
      refs: [forwardedRef, tabsListRef],
      props: [defaultProps, elementProps],
      stateAttributesMapping: tabsStateAttributesMapping,
      highlightedIndex: highlightedTabIndex,
      enableHomeAndEndKeys: true,
      loop,
      orientation,
      onHighlightedIndexChange: setHighlightedTabIndex,
      onMapChange: setTabMap,
      disabledIndices: EMPTY_ARRAY8
    })
  });
});
if (true) TabsList.displayName = "TabsList";
function getInset(tab, tabsList) {
  const {
    left: tabLeft,
    top: tabTop
  } = tab.getBoundingClientRect();
  const {
    left: listLeft,
    top: listTop
  } = tabsList.getBoundingClientRect();
  const left = tabLeft - listLeft;
  const top = tabTop - listTop;
  return {
    left,
    top
  };
}
function useActivationDirectionDetector(selectedTabValue, orientation, tabsListRef, getTabElement) {
  const previousTabEdge = React35.useRef(null);
  useIsoLayoutEffect(() => {
    if (selectedTabValue == null || tabsListRef.current == null) {
      previousTabEdge.current = null;
      return;
    }
    const activeTab = getTabElement(selectedTabValue);
    if (activeTab == null) {
      previousTabEdge.current = null;
      return;
    }
    const {
      left,
      top
    } = getInset(activeTab, tabsListRef.current);
    previousTabEdge.current = orientation === "horizontal" ? left : top;
  }, [orientation, getTabElement, tabsListRef, selectedTabValue]);
  return React35.useCallback((newValue) => {
    if (newValue === selectedTabValue) {
      return "none";
    }
    if (newValue == null) {
      previousTabEdge.current = null;
      return "none";
    }
    if (newValue != null && tabsListRef.current != null) {
      const selectedTabElement = getTabElement(newValue);
      if (selectedTabElement != null) {
        const {
          left,
          top
        } = getInset(selectedTabElement, tabsListRef.current);
        if (previousTabEdge.current == null) {
          previousTabEdge.current = orientation === "horizontal" ? left : top;
          return "none";
        }
        if (orientation === "horizontal") {
          if (left < previousTabEdge.current) {
            previousTabEdge.current = left;
            return "left";
          }
          if (left > previousTabEdge.current) {
            previousTabEdge.current = left;
            return "right";
          }
        } else if (top < previousTabEdge.current) {
          previousTabEdge.current = top;
          return "up";
        } else if (top > previousTabEdge.current) {
          previousTabEdge.current = top;
          return "down";
        }
      }
    }
    return "none";
  }, [getTabElement, orientation, previousTabEdge, tabsListRef, selectedTabValue]);
}

// src/dashboard/components/tabs/list.tsx
var import_compose12 = __toESM(require_compose(), 1);
var import_react20 = __toESM(require_react(), 1);

// src/dashboard/components/tabs/style.scss
var css = `/**
 * Tabs component styles
 */
:root {
  --wpds-border-width-focus: 1.5px;
  --wpds-color-stroke-interactive-neutral-strong: #1e1e1e;
  --wpds-color-fg-interactive-neutral: #50575e;
  --wpds-color-fg-interactive-neutral-active: #1e1e1e;
  --wpds-color-fg-interactive-neutral-disabled: #ccc;
  --wpds-color-stroke-focus-brand: #2271b1;
  --wpds-color-bg-interactive-neutral-weak-active: #f0f0f1;
  --wpds-border-radius-small: 2px;
  --wpds-spacing-05: 4px;
  --wpds-spacing-10: 8px;
  --wpds-spacing-15: 12px;
  --wpds-spacing-20: 16px;
  --wpds-spacing-50: 40px;
  --wpds-spacing-60: 48px;
}

.jp-forms-tabs__tablist {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  --direction-factor: 1;
  --direction-start: left;
  --direction-end: right;
  position: relative;
}
.jp-forms-tabs__tablist:dir(rtl) {
  --direction-factor: -1;
  --direction-start: right;
  --direction-end: left;
}
.jp-forms-tabs__tablist[data-orientation=horizontal] {
  width: fit-content;
  --fade-width: 4rem;
  --fade-gradient-base: transparent 0%, #000 var(--fade-width);
  --fade-gradient-composed:
  	var(--fade-gradient-base),
  	#000 60%,
  	transparent 50%;
}
.jp-forms-tabs__tablist[data-orientation=horizontal].jp-forms-tabs__is-overflowing-first {
  mask-image: linear-gradient(to var(--direction-end), var(--fade-gradient-base));
}
.jp-forms-tabs__tablist[data-orientation=horizontal].jp-forms-tabs__is-overflowing-last {
  mask-image: linear-gradient(to var(--direction-start), var(--fade-gradient-base));
}
.jp-forms-tabs__tablist[data-orientation=horizontal].jp-forms-tabs__is-overflowing-first.jp-forms-tabs__is-overflowing-last {
  mask-image: linear-gradient(to right, var(--fade-gradient-composed)), linear-gradient(to left, var(--fade-gradient-composed));
}
.jp-forms-tabs__tablist[data-orientation=horizontal].jp-forms-tabs__has-compact-density {
  gap: 1rem;
}
.jp-forms-tabs__tablist[data-orientation=vertical] {
  flex-direction: column;
}

.jp-forms-tabs__indicator {
  position: absolute;
  pointer-events: none;
  /* Windows high contrast mode. */
  outline: 2px solid transparent;
  outline-offset: -1px;
}
@media not (prefers-reduced-motion) {
  .jp-forms-tabs__indicator {
    transition-property: translate, width, height, border-radius, border-block;
    transition-duration: 0.2s;
    transition-timing-function: ease-out;
  }
}
.jp-forms-tabs__indicator[data-orientation=horizontal] {
  z-index: 1;
  left: 0;
  bottom: 0;
  height: var(--wpds-border-width-focus);
  width: var(--active-tab-width);
  translate: var(--active-tab-left) 0;
  background-color: var(--wpds-color-stroke-interactive-neutral-strong);
}
.jp-forms-tabs__indicator[data-orientation=vertical] {
  z-index: 0;
  border-radius: var(--wpds-border-radius-small);
  top: 0;
  left: 50%;
  width: 100%;
  height: var(--active-tab-height);
  translate: -50% var(--active-tab-top);
  background-color: var(--wpds-color-bg-interactive-neutral-weak-active);
}
.jp-forms-tabs__tablist[data-select-on-move=true]:has(:focus-visible) .jp-forms-tabs__indicator[data-orientation=vertical] {
  border: var(--wpds-border-width-focus) solid var(--wpds-color-stroke-focus-brand);
}

.jp-forms-tabs__tab {
  /* Resets */
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  outline: none; /* Focus ring applied to the ::after pseudo-element */
  padding: 0;
  /* Positioning */
  z-index: 1;
  flex: 1 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  /* Appearance */
  cursor: pointer;
  /* Typography */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  white-space: nowrap;
  /*
   * Characters in some languages (e.g. Japanese)
   * may have a native higher line-height.
   */
  line-height: 1.2;
  font-weight: 400;
  color: var(--wpds-color-fg-interactive-neutral);
  /* Focus indicator. */
}
.jp-forms-tabs__tab[data-disabled] {
  cursor: default;
  color: var(--wpds-color-fg-interactive-neutral-disabled);
}
@media (forced-colors: active) {
  .jp-forms-tabs__tab[data-disabled] {
    color: GrayText;
  }
}
.jp-forms-tabs__tab:not([data-disabled]):is(:hover, :focus-visible) {
  color: var(--wpds-color-fg-interactive-neutral-active);
}
.jp-forms-tabs__tab::after {
  position: absolute;
  z-index: -1;
  pointer-events: none;
  /* Outline works for Windows high contrast mode as well. */
  outline: var(--wpds-border-width-focus) solid var(--wpds-color-stroke-focus-brand);
  border-radius: var(--wpds-border-radius-small);
  /* Animation */
  opacity: 0;
}
@media not (prefers-reduced-motion) {
  .jp-forms-tabs__tab::after {
    transition: opacity 0.1s linear;
  }
}
.jp-forms-tabs__tab:focus-visible::after {
  opacity: 1;
}
[data-orientation=horizontal] .jp-forms-tabs__tab {
  padding-inline: var(--wpds-spacing-20);
  height: var(--wpds-spacing-60);
  scroll-margin: 24px;
}
[data-orientation=horizontal] .jp-forms-tabs__tab::after {
  content: "";
  inset: var(--wpds-spacing-15);
}
.jp-forms-tabs__has-compact-density[data-orientation=horizontal] .jp-forms-tabs__tab {
  padding-inline: 0;
}
.jp-forms-tabs__has-compact-density[data-orientation=horizontal] .jp-forms-tabs__tab::after {
  /*
   * Add enough inset to prevent the focus ring (which is 1.5px thick)
   * from being visually clipped by the tablist.
   */
  inset-inline: 2px;
}
[data-orientation=vertical] .jp-forms-tabs__tab {
  padding: var(--wpds-spacing-10) var(--wpds-spacing-15);
  min-height: var(--wpds-spacing-50);
}
[data-orientation=vertical][data-select-on-move=false] .jp-forms-tabs__tab::after {
  content: "";
  inset: var(--wpds-border-width-focus);
}

.jp-forms-tabs__tab__children {
  flex-grow: 1;
  display: flex;
  align-items: center;
}
[data-orientation=horizontal] .jp-forms-tabs__tab__children {
  justify-content: center;
}
[data-orientation=vertical] .jp-forms-tabs__tab__children {
  justify-content: start;
}

.jp-forms-tabs__tab__chevron {
  fill: currentColor;
  height: 24px;
  flex-shrink: 0;
  margin-inline-end: calc(var(--wpds-spacing-05) * -1);
  opacity: 0;
  /*
   * The chevron is transitioned into existence when selectOnMove is enabled,
   * because otherwise it looks jarring, as it shows up outside of the focus
   * indicator that's being animated at the same time.
   */
}
[data-orientation=horizontal] .jp-forms-tabs__tab__chevron {
  display: none;
}
[role=tab]:is([aria-selected=true], :focus-visible, :hover) .jp-forms-tabs__tab__chevron {
  opacity: 1;
}
@media not (prefers-reduced-motion) {
  [data-select-on-move=true] [role=tab]:is([aria-selected=true]) .jp-forms-tabs__tab__chevron {
    transition: opacity 0.15s 0.15s linear;
  }
}
.jp-forms-tabs__tab__chevron:dir(rtl) {
  rotate: 180deg;
}

.jp-forms-tabs__tabpanel:focus {
  box-shadow: none;
  outline: none;
}
.jp-forms-tabs__tabpanel:focus-visible {
  box-shadow: 0 0 0 var(--wpds-border-width-focus) var(--wpds-color-stroke-focus-brand);
  /* Windows high contrast mode. */
  outline: 2px solid transparent;
  outline-offset: 0;
}`;
document.head.appendChild(document.createElement("style")).appendChild(document.createTextNode(css));

// src/dashboard/components/tabs/list.tsx
var import_jsx_runtime107 = __toESM(require_jsx_runtime(), 1);
var DEFAULT_SCROLL_MARGIN = 0;
var List = (0, import_react20.forwardRef)(function TabList({ children, density = "default", className, activateOnFocus, render: render2, ...otherProps }, forwardedRef) {
  const [listEl, setListEl] = (0, import_react20.useState)(null);
  const [overflow, setOverflow] = (0, import_react20.useState)({
    first: false,
    last: false
  });
  (0, import_react20.useEffect)(() => {
    if (!listEl) {
      return;
    }
    const localListEl = listEl;
    function measureOverflow() {
      if (!localListEl) {
        setOverflow({
          first: false,
          last: false
        });
        return;
      }
      const { scrollWidth, clientWidth, scrollLeft } = localListEl;
      setOverflow({
        first: scrollLeft > DEFAULT_SCROLL_MARGIN,
        last: scrollLeft + clientWidth < scrollWidth - DEFAULT_SCROLL_MARGIN
      });
    }
    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(localListEl);
    let scrollTick = false;
    function throttleMeasureOverflowOnScroll() {
      if (!scrollTick) {
        requestAnimationFrame(() => {
          measureOverflow();
          scrollTick = false;
        });
        scrollTick = true;
      }
    }
    localListEl.addEventListener("scroll", throttleMeasureOverflowOnScroll, { passive: true });
    measureOverflow();
    return () => {
      localListEl.removeEventListener("scroll", throttleMeasureOverflowOnScroll);
      resizeObserver.disconnect();
    };
  }, [listEl]);
  const setListElRef = (0, import_react20.useCallback)((el) => setListEl(el), []);
  const mergedListRef = (0, import_compose12.useMergeRefs)([forwardedRef, setListElRef]);
  const renderTabList = (0, import_react20.useCallback)(
    (props, state) => {
      const newProps = {
        ...props,
        tabIndex: props.tabIndex ?? -1
      };
      if ((0, import_react20.isValidElement)(render2)) {
        return (0, import_react20.cloneElement)(render2, newProps);
      } else if (typeof render2 === "function") {
        return render2(newProps, state);
      }
      return /* @__PURE__ */ (0, import_jsx_runtime107.jsx)("div", { ...newProps });
    },
    [render2]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime107.jsxs)(
    index_parts_exports.List,
    {
      ref: mergedListRef,
      activateOnFocus,
      "data-select-on-move": activateOnFocus ? "true" : "false",
      className: clsx_default(
        "jp-forms-tabs__tablist",
        overflow.first && "jp-forms-tabs__is-overflowing-first",
        overflow.last && "jp-forms-tabs__is-overflowing-last",
        `jp-forms-tabs__has-${density}-density`,
        className
      ),
      render: renderTabList,
      ...otherProps,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime107.jsx)(index_parts_exports.Indicator, { className: "jp-forms-tabs__indicator" })
      ]
    }
  );
});

// src/dashboard/components/tabs/panel.tsx
var import_react21 = __toESM(require_react(), 1);
var import_jsx_runtime108 = __toESM(require_jsx_runtime(), 1);
var Panel = (0, import_react21.forwardRef)(function TabPanel2({ className, focusable = true, tabIndex, ...otherProps }, forwardedRef) {
  return /* @__PURE__ */ (0, import_jsx_runtime108.jsx)(
    index_parts_exports.Panel,
    {
      ref: forwardedRef,
      tabIndex: tabIndex ?? (focusable ? 0 : -1),
      className: clsx_default("jp-forms-tabs__tabpanel", className),
      ...otherProps
    }
  );
});

// src/dashboard/components/tabs/root.tsx
var import_react22 = __toESM(require_react(), 1);
var import_jsx_runtime109 = __toESM(require_jsx_runtime(), 1);
var Root = (0, import_react22.forwardRef)(function TabsRoot3({ ...otherProps }, forwardedRef) {
  return /* @__PURE__ */ (0, import_jsx_runtime109.jsx)(index_parts_exports.Root, { ref: forwardedRef, ...otherProps });
});

// src/dashboard/components/tabs/tab.tsx
var import_react23 = __toESM(require_react(), 1);
var import_jsx_runtime110 = __toESM(require_jsx_runtime(), 1);
var ChevronRight = (props) => {
  return (0, import_react23.cloneElement)(chevron_right_default, props);
};
var Tab = (0, import_react23.forwardRef)(function Tab2({ className, children, ...otherProps }, forwardedRef) {
  return /* @__PURE__ */ (0, import_jsx_runtime110.jsxs)(
    index_parts_exports.Tab,
    {
      ref: forwardedRef,
      className: clsx_default("jp-forms-tabs__tab", className),
      ...otherProps,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime110.jsx)("span", { className: "jp-forms-tabs__tab__children", children }),
        /* @__PURE__ */ (0, import_jsx_runtime110.jsx)(ChevronRight, { className: "jp-forms-tabs__tab__chevron" })
      ]
    }
  );
});

// routes/responses/stage.tsx
var import_jsx_runtime111 = __toESM(require_jsx_runtime());
var EMPTY_ARRAY9 = [];
var defaultLayouts = {
  table: {},
  list: {}
};
var DEFAULT_VIEW = {
  type: "table",
  filters: [],
  perPage: 20,
  sort: {
    field: "date",
    direction: "desc"
  },
  titleField: "from",
  fields: ["from", "date", "source"]
};
function getItemId(item) {
  return item.id.toString();
}
function stage() {
  const params = useParams({ from: "/responses/$view" });
  const searchParams = useSearch({ from: "/responses/$view" });
  const navigate = useNavigate();
  const status = params.view === "spam" ? "spam" : params.view === "trash" ? "trash" : "publish";
  const [view, setView] = (0, import_element47.useState)(DEFAULT_VIEW);
  const selection = searchParams?.responseIds ?? [];
  const onChangeView = (0, import_element47.useCallback)((newView) => {
    setView(newView);
  }, []);
  const onChangeSelection = (0, import_element47.useCallback)(
    (items) => {
      navigate({
        search: {
          ...searchParams,
          responseIds: items.length > 0 ? items : void 0
        }
      });
    },
    [searchParams, navigate]
  );
  const { records, isResolving, totalItems, totalPages } = (0, import_core_data.useEntityRecords)(
    "postType",
    "feedback",
    {
      status,
      per_page: view.perPage,
      page: view.page || 1,
      orderby: view.sort?.field || "date",
      order: view.sort?.direction || "desc"
    }
  );
  const fields = (0, import_element47.useMemo)(
    () => [
      {
        id: "from",
        label: (0, import_i18n37.__)("From", "jetpack-forms"),
        render: ({ item }) => item.author_name || item.author_email || "Anonymous",
        enableSorting: false,
        enableHiding: false
      },
      {
        id: "date",
        label: (0, import_i18n37.__)("Date", "jetpack-forms"),
        render: ({ item }) => new Date(item.date).toLocaleDateString(),
        enableSorting: false
      },
      {
        id: "source",
        label: (0, import_i18n37.__)("Source", "jetpack-forms"),
        render: ({ item }) => item.entry_title || "Unknown",
        enableSorting: false
      }
    ],
    []
  );
  const actions = (0, import_element47.useMemo)(
    () => [
      {
        id: "view-details",
        label: (0, import_i18n37.__)("View details", "jetpack-forms"),
        isPrimary: true,
        callback: (items) => {
          const ids = items.map((item) => getItemId(item));
          navigate({
            search: {
              ...searchParams,
              responseIds: ids
            }
          });
        }
      },
      {
        id: "mark-as-spam",
        label: (0, import_i18n37.__)("Mark as spam", "jetpack-forms"),
        supportsBulk: true,
        isDestructive: true,
        callback: (items) => {
          console.log("Mark as spam:", items);
        }
      },
      {
        id: "move-to-trash",
        label: (0, import_i18n37.__)("Move to trash", "jetpack-forms"),
        supportsBulk: true,
        isDestructive: true,
        callback: (items) => {
          console.log("Move to trash:", items);
        }
      }
    ],
    [navigate, searchParams]
  );
  const paginationInfo = (0, import_element47.useMemo)(
    () => ({
      totalItems: totalItems || 0,
      totalPages: totalPages || 1
    }),
    [totalItems, totalPages]
  );
  const statusTabs = [
    { slug: "inbox", label: (0, import_i18n37.__)("Inbox", "jetpack-forms") },
    { slug: "spam", label: (0, import_i18n37.__)("Spam", "jetpack-forms") },
    { slug: "trash", label: (0, import_i18n37.__)("Trash", "jetpack-forms") }
  ];
  const handleTabChange = (0, import_element47.useCallback)(
    (newView) => {
      navigate({
        to: "/responses/$view",
        params: { view: newView }
      });
    },
    [navigate]
  );
  const headerActions = (0, import_element47.useMemo)(() => {
    const actionsArray = [];
    actionsArray.push(
      /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(import_components44.Button, { variant: "secondary", size: "compact", children: (0, import_i18n37.__)("Export", "jetpack-forms") }, "export")
    );
    if (params.view === "trash") {
      actionsArray.push(
        /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(import_components44.Button, { variant: "primary", isDestructive: true, size: "compact", children: (0, import_i18n37.__)("Empty Trash", "jetpack-forms") }, "empty-trash")
      );
    }
    if (params.view === "spam") {
      actionsArray.push(
        /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(import_components44.Button, { variant: "primary", isDestructive: true, size: "compact", children: (0, import_i18n37.__)("Empty Spam", "jetpack-forms") }, "empty-spam")
      );
    }
    return actionsArray;
  }, [params.view]);
  return /* @__PURE__ */ (0, import_jsx_runtime111.jsxs)(
    page_default,
    {
      title: (0, import_i18n37.__)("Forms", "jetpack-forms"),
      subTitle: (0, import_i18n37.__)("View and manage all your form submissions in one place.", "jetpack-forms"),
      actions: headerActions,
      hasPadding: false,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(Root, { value: params.view || "inbox", onValueChange: handleTabChange, children: /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(List, { density: "compact", children: statusTabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(Tab, { value: tab.slug, children: tab.label }, tab.slug)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime111.jsx)(
          dataviews_default,
          {
            data: records || EMPTY_ARRAY9,
            fields,
            view,
            onChangeView,
            paginationInfo,
            isLoading: isResolving,
            getItemId,
            defaultLayouts,
            selection,
            onChangeSelection,
            actions
          }
        )
      ]
    }
  );
}

// routes/responses/inspector.tsx
var import_components45 = __toESM(require_components());
var import_core_data2 = __toESM(require_core_data());
var import_data5 = __toESM(require_data());
var import_date6 = __toESM(require_date());
var import_html_entities = __toESM(require_html_entities());
var import_i18n38 = __toESM(require_i18n());
var import_jsx_runtime112 = __toESM(require_jsx_runtime());
var getDisplayName = (response) => {
  const { author_name, author_email, author_url, ip } = response;
  return (0, import_html_entities.decodeEntities)(author_name || author_email || author_url || ip || "Anonymous");
};
function SingleResponseView({ responseId }) {
  const { response, isLoading } = (0, import_data5.useSelect)(
    (select) => {
      if (!responseId) {
        return { response: null, isLoading: false };
      }
      return {
        response: select(import_core_data2.store).getEntityRecord("postType", "feedback", responseId),
        isLoading: select(import_core_data2.store).isResolving("getEntityRecord", [
          "postType",
          "feedback",
          responseId
        ])
      };
    },
    [responseId]
  );
  if (isLoading) {
    return /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { style: { display: "flex", justifyContent: "center", padding: "40px" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(import_components45.Spinner, {}) });
  }
  if (!response) {
    return /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { style: { padding: "20px" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("p", { children: (0, import_i18n38.__)("Response not found.", "jetpack-forms") }) });
  }
  const displayName = getDisplayName(response);
  const dateSettings = (0, import_date6.getSettings)();
  return /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)("div", { className: "jp-forms__inspector-response", children: [
    /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { className: "jp-forms__inspector-header", style: { marginBottom: "20px" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(import_components45.__experimentalHStack, { alignment: "topLeft", spacing: "3", children: /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)(import_components45.__experimentalVStack, { spacing: "0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("h3", { style: { margin: 0 }, children: displayName }),
      response.author_email && displayName !== response.author_email && /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("p", { style: { margin: "4px 0 0", color: "#666" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("a", { href: `mailto:${response.author_email}`, children: response.author_email }) })
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { className: "jp-forms__inspector-meta", style: { marginBottom: "20px" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("table", { style: { width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)("tbody", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(
          "th",
          {
            style: {
              textAlign: "left",
              padding: "4px 8px 4px 0",
              fontWeight: "normal",
              color: "#666"
            },
            children: (0, import_i18n38.__)("Date:", "jetpack-forms")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("td", { style: { padding: "4px 0" }, children: (0, import_i18n38.sprintf)(
          /* Translators: %1$s is the date, %2$s is the time. */
          (0, import_i18n38.__)("%1$s at %2$s", "jetpack-forms"),
          (0, import_date6.dateI18n)(dateSettings.formats.date, response.date),
          (0, import_date6.dateI18n)(dateSettings.formats.time, response.date)
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(
          "th",
          {
            style: {
              textAlign: "left",
              padding: "4px 8px 4px 0",
              fontWeight: "normal",
              color: "#666"
            },
            children: (0, import_i18n38.__)("Source:", "jetpack-forms")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("td", { style: { padding: "4px 0" }, children: response.entry_permalink ? /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(import_components45.ExternalLink, { href: response.entry_permalink, children: (0, import_html_entities.decodeEntities)(response.entry_title) || response.entry_permalink }) : (0, import_html_entities.decodeEntities)(response.entry_title) || (0, import_i18n38.__)("Unknown", "jetpack-forms") })
      ] }),
      response.ip && /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(
          "th",
          {
            style: {
              textAlign: "left",
              padding: "4px 8px 4px 0",
              fontWeight: "normal",
              color: "#666"
            },
            children: (0, import_i18n38.__)("IP address:", "jetpack-forms")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("td", { style: { padding: "4px 0" }, children: response.ip })
      ] })
    ] }) }) }),
    response.fields && Object.keys(response.fields).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { className: "jp-forms__inspector-fields", children: Object.entries(response.fields).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime112.jsxs)(
      "div",
      {
        style: {
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid #eee"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(
            "div",
            {
              style: {
                fontWeight: "600",
                marginBottom: "4px",
                color: "#1e1e1e"
              },
              children: key.endsWith("?") ? key : `${key}:`
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { style: { color: "#3c434a" }, children: renderFieldValue(value) })
        ]
      },
      key
    )) })
  ] });
}
function renderFieldValue(value) {
  if (value === null || value === void 0) {
    return "-";
  }
  if (value && typeof value === "object" && "files" in value) {
    return /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("ul", { style: { margin: 0, paddingLeft: "20px" }, children: value.files.map((file, index) => /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(import_components45.ExternalLink, { href: file.url, children: (0, import_html_entities.decodeEntities)(file.name) }) }, index)) });
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  const emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (typeof value === "string" && emailRegEx.test(value)) {
    return /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("a", { href: `mailto:${value}`, children: value });
  }
  return String(value);
}
function inspector() {
  const searchParams = useSearch({ from: "/responses/$view" });
  const navigate = useNavigate();
  const responseIds = searchParams?.responseIds || [];
  if (!responseIds.length) {
    return null;
  }
  const isBulk = responseIds.length > 1;
  const handleClose = () => {
    navigate({
      search: {
        ...searchParams,
        responseIds: void 0
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(
    page_default,
    {
      title: isBulk ? (0, import_i18n38.sprintf)(
        /* Translators: %d is the number of selected responses */
        (0, import_i18n38.__)("%d Responses Selected", "jetpack-forms"),
        responseIds.length
      ) : (0, import_i18n38.__)("Response Details", "jetpack-forms"),
      actions: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(
        import_components45.Button,
        {
          icon: close_default,
          label: (0, import_i18n38.__)("Close", "jetpack-forms"),
          onClick: handleClose,
          size: "compact"
        }
      ),
      showSidebarToggle: false,
      children: isBulk ? /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("div", { style: { padding: "20px" }, children: /* @__PURE__ */ (0, import_jsx_runtime112.jsx)("p", { children: (0, import_i18n38.sprintf)(
        /* Translators: %d is the number of selected responses */
        (0, import_i18n38.__)(
          "%d responses selected. Select a single response to view details.",
          "jetpack-forms"
        ),
        responseIds.length
      ) }) }) : /* @__PURE__ */ (0, import_jsx_runtime112.jsx)(SingleResponseView, { responseId: Number(responseIds[0]) })
    }
  );
}
export {
  inspector,
  stage
};
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-shim.development.js:
  (**
   * @license React
   * use-sync-external-store-shim.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-shim/with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
