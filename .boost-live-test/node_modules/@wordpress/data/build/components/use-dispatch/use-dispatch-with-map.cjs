"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/data/src/components/use-dispatch/use-dispatch-with-map.ts
var use_dispatch_with_map_exports = {};
__export(use_dispatch_with_map_exports, {
  default: () => use_dispatch_with_map_default
});
module.exports = __toCommonJS(use_dispatch_with_map_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_use_registry = __toESM(require("../registry-provider/use-registry.cjs"));
var useDispatchWithMap = (dispatchMap, deps) => {
  const registry = (0, import_use_registry.default)();
  const currentDispatchMapRef = (0, import_element.useRef)(dispatchMap);
  (0, import_compose.useIsomorphicLayoutEffect)(() => {
    currentDispatchMapRef.current = dispatchMap;
  });
  return (0, import_element.useMemo)(() => {
    const currentDispatchProps = currentDispatchMapRef.current(
      registry.dispatch,
      registry
    );
    return Object.fromEntries(
      Object.entries(currentDispatchProps).map(
        ([propName, dispatcher]) => {
          if (typeof dispatcher !== "function") {
            console.warn(
              `Property ${propName} returned from dispatchMap in useDispatchWithMap must be a function.`
            );
          }
          return [
            propName,
            (...args) => currentDispatchMapRef.current(registry.dispatch, registry)[propName](...args)
          ];
        }
      )
    );
  }, [registry, ...deps]);
};
var use_dispatch_with_map_default = useDispatchWithMap;
//# sourceMappingURL=use-dispatch-with-map.cjs.map
