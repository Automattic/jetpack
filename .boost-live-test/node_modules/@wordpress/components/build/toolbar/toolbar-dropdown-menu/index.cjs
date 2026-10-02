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

// packages/components/src/toolbar/toolbar-dropdown-menu/index.tsx
var toolbar_dropdown_menu_exports = {};
__export(toolbar_dropdown_menu_exports, {
  ToolbarDropdownMenu: () => ToolbarDropdownMenu,
  default: () => toolbar_dropdown_menu_default
});
module.exports = __toCommonJS(toolbar_dropdown_menu_exports);
var import_element = require("@wordpress/element");
var import_toolbar_item = __toESM(require("../toolbar-item/index.cjs"));
var import_toolbar_context = __toESM(require("../toolbar-context/index.cjs"));
var import_dropdown_menu = __toESM(require("../../dropdown-menu/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedToolbarDropdownMenu(props, ref) {
  const accessibleToolbarState = (0, import_element.useContext)(import_toolbar_context.default);
  if (!accessibleToolbarState) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dropdown_menu.default, {
      ...props
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_item.default, {
    ref,
    ...props.toggleProps,
    children: (toolbarItemProps) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dropdown_menu.default, {
      ...props,
      popoverProps: {
        ...props.popoverProps
      },
      toggleProps: toolbarItemProps
    })
  });
}
var ToolbarDropdownMenu = (0, import_element.forwardRef)(UnforwardedToolbarDropdownMenu);
ToolbarDropdownMenu.displayName = "ToolbarDropdownMenu";
var toolbar_dropdown_menu_default = ToolbarDropdownMenu;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolbarDropdownMenu
});
//# sourceMappingURL=index.cjs.map
