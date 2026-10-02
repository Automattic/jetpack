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

// packages/components/src/button-group/index.tsx
var button_group_exports = {};
__export(button_group_exports, {
  ButtonGroup: () => ButtonGroup,
  default: () => button_group_default
});
module.exports = __toCommonJS(button_group_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedButtonGroup(props, ref) {
  const {
    className,
    __shouldNotWarnDeprecated,
    ...restProps
  } = props;
  const classes = (0, import_clsx.default)("components-button-group", className);
  if (!__shouldNotWarnDeprecated) {
    (0, import_deprecated.default)("wp.components.ButtonGroup", {
      since: "6.8",
      alternative: "wp.components.__experimentalToggleGroupControl"
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    ref,
    role: "group",
    className: classes,
    ...restProps
  });
}
var ButtonGroup = (0, import_element.forwardRef)(UnforwardedButtonGroup);
ButtonGroup.displayName = "ButtonGroup";
var button_group_default = ButtonGroup;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ButtonGroup
});
//# sourceMappingURL=index.cjs.map
