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

// packages/components/src/custom-select-control-v2/item.tsx
var item_exports = {};
__export(item_exports, {
  CustomSelectItem: () => CustomSelectItem,
  default: () => item_default
});
module.exports = __toCommonJS(item_exports);
var import_element = require("@wordpress/element");
var import_icons = require("@wordpress/icons");
var Styled = __toESM(require("./styles.cjs"));
var import_custom_select = require("./custom-select.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function CustomSelectItem({
  children,
  ...props
}) {
  const customSelectContext = (0, import_element.useContext)(import_custom_select.CustomSelectContext);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Styled.SelectItem, {
    store: customSelectContext?.store,
    size: customSelectContext?.size ?? "default",
    ...props,
    children: [children ?? props.value, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Styled.SelectedItemCheck, {
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icons.Icon, {
        icon: import_icons.check
      })
    })]
  });
}
CustomSelectItem.displayName = "CustomSelectControlV2.Item";
var item_default = CustomSelectItem;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomSelectItem
});
//# sourceMappingURL=item.cjs.map
