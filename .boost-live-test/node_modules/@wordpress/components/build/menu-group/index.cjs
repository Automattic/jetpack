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

// packages/components/src/menu-group/index.tsx
var menu_group_exports = {};
__export(menu_group_exports, {
  MenuGroup: () => MenuGroup,
  default: () => menu_group_default
});
module.exports = __toCommonJS(menu_group_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_jsx_runtime = require("react/jsx-runtime");
function MenuGroup(props) {
  const {
    children,
    className = "",
    label,
    hideSeparator
  } = props;
  const instanceId = (0, import_compose.useInstanceId)(MenuGroup);
  if (!import_element.Children.count(children)) {
    return null;
  }
  const labelId = `components-menu-group-label-${instanceId}`;
  const classNames = (0, import_clsx.default)(className, "components-menu-group", {
    "has-hidden-separator": hideSeparator
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className: classNames,
    children: [label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      className: "components-menu-group__label",
      id: labelId,
      "aria-hidden": "true",
      children: label
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      role: "group",
      "aria-labelledby": label ? labelId : void 0,
      children
    })]
  });
}
var menu_group_default = MenuGroup;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MenuGroup
});
//# sourceMappingURL=index.cjs.map
