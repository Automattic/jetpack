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

// packages/components/src/toolbar/toolbar-group/toolbar-group-collapsed.tsx
var toolbar_group_collapsed_exports = {};
__export(toolbar_group_collapsed_exports, {
  default: () => toolbar_group_collapsed_default
});
module.exports = __toCommonJS(toolbar_group_collapsed_exports);
var import_element = require("@wordpress/element");
var import_dropdown_menu = __toESM(require("../../dropdown-menu/index.cjs"));
var import_toolbar_context = __toESM(require("../toolbar-context/index.cjs"));
var import_toolbar_item = __toESM(require("../toolbar-item/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function ToolbarGroupCollapsed({
  controls = [],
  toggleProps,
  ...props
}) {
  const accessibleToolbarState = (0, import_element.useContext)(import_toolbar_context.default);
  const renderDropdownMenu = (internalToggleProps) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dropdown_menu.default, {
    controls,
    toggleProps: {
      ...internalToggleProps,
      "data-toolbar-item": true
    },
    ...props
  });
  if (accessibleToolbarState) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_item.default, {
      ...toggleProps,
      children: renderDropdownMenu
    });
  }
  return renderDropdownMenu(toggleProps);
}
var toolbar_group_collapsed_default = ToolbarGroupCollapsed;
//# sourceMappingURL=toolbar-group-collapsed.cjs.map
