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

// packages/components/src/menu-items-choice/index.tsx
var menu_items_choice_exports = {};
__export(menu_items_choice_exports, {
  default: () => menu_items_choice_default
});
module.exports = __toCommonJS(menu_items_choice_exports);
var import_icons = require("@wordpress/icons");
var import_menu_item = __toESM(require("../menu-item/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var noop = () => {
};
function MenuItemsChoice({
  choices = [],
  onHover = noop,
  onSelect,
  value
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {
    children: choices.map((item) => {
      const isSelected = value === item.value;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_menu_item.default, {
        role: "menuitemradio",
        disabled: item.disabled,
        icon: isSelected ? import_icons.check : null,
        info: item.info,
        isSelected,
        shortcut: item.shortcut,
        className: "components-menu-items-choice",
        onClick: () => {
          if (!isSelected) {
            onSelect(item.value);
          }
        },
        onMouseEnter: () => onHover(item.value),
        onMouseLeave: () => onHover(null),
        "aria-label": item["aria-label"],
        children: item.label
      }, item.value);
    })
  });
}
var menu_items_choice_default = MenuItemsChoice;
//# sourceMappingURL=index.cjs.map
