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

// packages/components/src/toolbar/toolbar-group/index.tsx
var toolbar_group_exports = {};
__export(toolbar_group_exports, {
  default: () => toolbar_group_default
});
module.exports = __toCommonJS(toolbar_group_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_toolbar_button = __toESM(require("../toolbar-button/index.cjs"));
var import_toolbar_group_container = __toESM(require("./toolbar-group-container.cjs"));
var import_toolbar_group_collapsed = __toESM(require("./toolbar-group-collapsed.cjs"));
var import_toolbar_context = __toESM(require("../toolbar-context/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function isNestedArray(arr) {
  return Array.isArray(arr) && Array.isArray(arr[0]);
}
function ToolbarGroup({
  controls = [],
  children,
  className,
  isCollapsed,
  title,
  ...props
}) {
  const accessibleToolbarState = (0, import_element.useContext)(import_toolbar_context.default);
  if ((!controls || !controls.length) && !children) {
    return null;
  }
  const finalClassName = (0, import_clsx.default)(
    // Unfortunately, there's legacy code referencing to `.components-toolbar`
    // So we can't get rid of it
    accessibleToolbarState ? "components-toolbar-group" : "components-toolbar",
    className
  );
  let controlSets;
  if (isNestedArray(controls)) {
    controlSets = controls;
  } else {
    controlSets = [controls];
  }
  if (isCollapsed) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_group_collapsed.default, {
      label: title,
      controls: controlSets,
      className: finalClassName,
      children,
      ...props
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_toolbar_group_container.default, {
    className: finalClassName,
    ...props,
    children: [controlSets?.flatMap((controlSet, indexOfSet) => controlSet.map((control, indexOfControl) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_button.default, {
      containerClassName: indexOfSet > 0 && indexOfControl === 0 ? "has-left-divider" : void 0,
      ...control
    }, [indexOfSet, indexOfControl].join()))), children]
  });
}
var toolbar_group_default = ToolbarGroup;
//# sourceMappingURL=index.cjs.map
