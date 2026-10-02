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

// packages/components/src/panel/index.tsx
var panel_exports = {};
__export(panel_exports, {
  Panel: () => Panel,
  default: () => panel_default
});
module.exports = __toCommonJS(panel_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_header = __toESM(require("./header.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedPanel({
  header,
  className,
  children
}, ref) {
  const classNames = (0, import_clsx.default)(className, "components-panel");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className: classNames,
    ref,
    children: [header && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_header.default, {
      label: header
    }), children]
  });
}
var Panel = (0, import_element.forwardRef)(UnforwardedPanel);
Panel.displayName = "Panel";
var panel_default = Panel;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Panel
});
//# sourceMappingURL=index.cjs.map
