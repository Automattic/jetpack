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

// packages/components/src/slot-fill/slot.tsx
var slot_exports = {};
__export(slot_exports, {
  default: () => slot_default
});
module.exports = __toCommonJS(slot_exports);
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_context = __toESM(require("./context.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function isFunction(maybeFunc) {
  return typeof maybeFunc === "function";
}
function addKeysToChildren(children) {
  return import_element.Children.map(children, (child, childIndex) => {
    if (!child || typeof child === "string") {
      return child;
    }
    let childKey = childIndex;
    if (typeof child === "object" && "key" in child && child?.key) {
      childKey = child.key;
    }
    return (0, import_element.cloneElement)(child, {
      key: childKey
    });
  });
}
function Slot(props) {
  const {
    name,
    children,
    fillProps = {}
  } = props;
  const registry = (0, import_element.useContext)(import_context.default);
  const instanceRef = (0, import_element.useRef)({});
  (0, import_element.useLayoutEffect)(() => {
    const instance = instanceRef.current;
    registry.registerSlot(name, {
      type: "children",
      instance
    });
    return () => registry.unregisterSlot(name, instance);
  }, [registry, name]);
  let fills = (0, import_compose.useObservableValue)(registry.fills, name) ?? [];
  const currentSlot = (0, import_compose.useObservableValue)(registry.slots, name);
  if (!currentSlot || currentSlot.instance !== instanceRef.current) {
    fills = [];
  }
  const renderedFills = fills.map((fill) => {
    const fillChildren = isFunction(fill.children) ? fill.children(fillProps) : fill.children;
    return addKeysToChildren(fillChildren);
  }).filter(
    // In some cases fills are rendered only when some conditions apply.
    // This ensures that we only use non-empty fills when rendering, i.e.,
    // it allows us to render wrappers only when the fills are actually present.
    (element) => !(0, import_element.isEmptyElement)(element)
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {
    children: isFunction(children) ? children(renderedFills) : renderedFills
  });
}
var slot_default = Slot;
//# sourceMappingURL=slot.cjs.map
