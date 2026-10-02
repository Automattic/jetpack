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

// packages/components/src/toolbar/toolbar/toolbar-container.tsx
var toolbar_container_exports = {};
__export(toolbar_container_exports, {
  ToolbarContainer: () => ToolbarContainer,
  default: () => toolbar_container_default
});
module.exports = __toCommonJS(toolbar_container_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_i18n = require("@wordpress/i18n");
var import_toolbar_context = __toESM(require("../toolbar-context/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedToolbarContainer({
  label,
  ...props
}, ref) {
  const toolbarStore = Ariakit.useToolbarStore({
    focusLoop: true,
    rtl: (0, import_i18n.isRTL)()
  });
  return (
    // This will provide state for `ToolbarButton`'s
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_context.default.Provider, {
      value: toolbarStore,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.Toolbar, {
        ref,
        "aria-label": label,
        store: toolbarStore,
        ...props
      })
    })
  );
}
var ToolbarContainer = (0, import_element.forwardRef)(UnforwardedToolbarContainer);
ToolbarContainer.displayName = "ToolbarContainer";
var toolbar_container_default = ToolbarContainer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolbarContainer
});
//# sourceMappingURL=toolbar-container.cjs.map
