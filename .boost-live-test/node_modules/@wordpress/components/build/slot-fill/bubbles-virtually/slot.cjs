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

// packages/components/src/slot-fill/bubbles-virtually/slot.tsx
var slot_exports = {};
__export(slot_exports, {
  default: () => slot_default
});
module.exports = __toCommonJS(slot_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_view = require("../../view/index.cjs");
var import_context = __toESM(require("../context.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function Slot(props, forwardedRef) {
  const {
    name,
    fillProps = {},
    as,
    // `children` is not allowed. However, if it is passed,
    // it will be displayed as is, so remove `children`.
    children,
    ...restProps
  } = props;
  const registry = (0, import_element.useContext)(import_context.default);
  const instanceRef = (0, import_element.useRef)({});
  const ref = (0, import_element.useRef)(null);
  const fillPropsRef = (0, import_element.useRef)(fillProps);
  (0, import_element.useLayoutEffect)(() => {
    fillPropsRef.current = fillProps;
  }, [fillProps]);
  (0, import_element.useLayoutEffect)(() => {
    const instance = instanceRef.current;
    registry.registerSlot(name, {
      type: "portal",
      instance,
      ref,
      fillProps: fillPropsRef.current
    });
    return () => registry.unregisterSlot(name, instance);
  }, [registry, name]);
  (0, import_element.useLayoutEffect)(() => {
    registry.updateSlot(name, {
      type: "portal",
      instance: instanceRef.current,
      ref,
      fillProps: fillPropsRef.current
    });
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_view.View, {
    as,
    ref: (0, import_compose.useMergeRefs)([forwardedRef, ref]),
    ...restProps
  });
}
var slot_default = (0, import_element.forwardRef)(Slot);
//# sourceMappingURL=slot.cjs.map
