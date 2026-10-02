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

// packages/components/src/toolbar/toolbar-item/index.tsx
var toolbar_item_exports = {};
__export(toolbar_item_exports, {
  ToolbarItem: () => ToolbarItem2,
  default: () => toolbar_item_default
});
module.exports = __toCommonJS(toolbar_item_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_warning = __toESM(require("@wordpress/warning"));
var import_toolbar_context = __toESM(require("../toolbar-context/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedToolbarItem({
  children,
  as: Component,
  ...props
}, ref) {
  const accessibleToolbarStore = (0, import_element.useContext)(import_toolbar_context.default);
  const isRenderProp = typeof children === "function";
  if (!isRenderProp && !Component) {
    globalThis.SCRIPT_DEBUG === true ? (0, import_warning.default)("`ToolbarItem` is a generic headless component. You must pass either a `children` prop as a function or an `as` prop as a component. See https://developer.wordpress.org/block-editor/components/toolbar-item/") : void 0;
    return null;
  }
  const allProps = {
    ...props,
    ref,
    "data-toolbar-item": true
  };
  if (!accessibleToolbarStore) {
    if (Component) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
        ...allProps,
        children
      });
    }
    if (!isRenderProp) {
      return null;
    }
    return children(allProps);
  }
  const render = isRenderProp ? children : Component && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
    children
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.ToolbarItem, {
    accessibleWhenDisabled: true,
    ...allProps,
    store: accessibleToolbarStore,
    render
  });
}
var ToolbarItem2 = (0, import_element.forwardRef)(UnforwardedToolbarItem);
ToolbarItem2.displayName = "ToolbarItem";
var toolbar_item_default = ToolbarItem2;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolbarItem
});
//# sourceMappingURL=index.cjs.map
