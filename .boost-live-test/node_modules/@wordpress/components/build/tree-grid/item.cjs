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

// packages/components/src/tree-grid/item.tsx
var item_exports = {};
__export(item_exports, {
  TreeGridItem: () => TreeGridItem,
  default: () => item_default
});
module.exports = __toCommonJS(item_exports);
var import_element = require("@wordpress/element");
var import_roving_tab_index_item = __toESM(require("./roving-tab-index-item.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedTreeGridItem({
  children,
  ...props
}, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_roving_tab_index_item.default, {
    ref,
    ...props,
    children
  });
}
var TreeGridItem = (0, import_element.forwardRef)(UnforwardedTreeGridItem);
TreeGridItem.displayName = "TreeGridItem";
var item_default = TreeGridItem;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TreeGridItem
});
//# sourceMappingURL=item.cjs.map
