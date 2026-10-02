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

// packages/components/src/slot-fill/bubbles-virtually/use-slot-fills.ts
var use_slot_fills_exports = {};
__export(use_slot_fills_exports, {
  default: () => useSlotFills
});
module.exports = __toCommonJS(use_slot_fills_exports);
var import_element = require("@wordpress/element");
var import_context = __toESM(require("../context.cjs"));
function useObservableValueWithSelector(map, name, selector) {
  const subscribe = (0, import_element.useMemo)(() => (listener) => map.subscribe(name, listener), [map, name]);
  const getValue = () => selector(map.get(name));
  return (0, import_element.useSyncExternalStore)(subscribe, getValue, getValue);
}
function getLength(array) {
  return array?.length;
}
function useSlotFills(name) {
  const registry = (0, import_element.useContext)(import_context.default);
  const length = useObservableValueWithSelector(registry.fills, name, getLength);
  const fills = (0, import_element.useMemo)(() => {
    return length !== void 0 ? Array.from({
      length
    }) : void 0;
  }, [length]);
  return fills;
}
//# sourceMappingURL=use-slot-fills.cjs.map
