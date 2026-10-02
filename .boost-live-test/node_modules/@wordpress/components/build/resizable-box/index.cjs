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

// packages/components/src/resizable-box/index.tsx
var resizable_box_exports = {};
__export(resizable_box_exports, {
  ResizableBox: () => ResizableBox,
  default: () => resizable_box_default
});
module.exports = __toCommonJS(resizable_box_exports);
var import_element = require("@wordpress/element");
var import_clsx = __toESM(require("clsx"));
var import_re_resizable = require("re-resizable");
var import_resize_tooltip = __toESM(require("./resize-tooltip/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var HANDLE_CLASS_NAME = "components-resizable-box__handle";
var SIDE_HANDLE_CLASS_NAME = "components-resizable-box__side-handle";
var CORNER_HANDLE_CLASS_NAME = "components-resizable-box__corner-handle";
var HANDLE_CLASSES = {
  top: (0, import_clsx.default)(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-top"),
  right: (0, import_clsx.default)(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-right"),
  bottom: (0, import_clsx.default)(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-bottom"),
  left: (0, import_clsx.default)(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-left"),
  topLeft: (0, import_clsx.default)(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-top", "components-resizable-box__handle-left"),
  topRight: (0, import_clsx.default)(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-top", "components-resizable-box__handle-right"),
  bottomRight: (0, import_clsx.default)(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-bottom", "components-resizable-box__handle-right"),
  bottomLeft: (0, import_clsx.default)(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-bottom", "components-resizable-box__handle-left")
};
var HANDLE_STYLES_OVERRIDES = {
  width: void 0,
  height: void 0,
  top: void 0,
  right: void 0,
  bottom: void 0,
  left: void 0
};
var HANDLE_STYLES = {
  top: HANDLE_STYLES_OVERRIDES,
  right: HANDLE_STYLES_OVERRIDES,
  bottom: HANDLE_STYLES_OVERRIDES,
  left: HANDLE_STYLES_OVERRIDES,
  topLeft: HANDLE_STYLES_OVERRIDES,
  topRight: HANDLE_STYLES_OVERRIDES,
  bottomRight: HANDLE_STYLES_OVERRIDES,
  bottomLeft: HANDLE_STYLES_OVERRIDES
};
function UnforwardedResizableBox({
  className,
  children,
  showHandle = true,
  __experimentalShowTooltip: showTooltip = false,
  __experimentalTooltipProps: tooltipProps = {},
  ...props
}, ref) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_re_resizable.Resizable, {
    className: (0, import_clsx.default)("components-resizable-box__container", showHandle && "has-show-handle", className),
    handleComponent: Object.fromEntries(Object.keys(HANDLE_CLASSES).map((key) => [key, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      tabIndex: -1
    }, key)])),
    handleClasses: HANDLE_CLASSES,
    handleStyles: HANDLE_STYLES,
    ref,
    ...props,
    children: [children, showTooltip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_resize_tooltip.default, {
      ...tooltipProps
    })]
  });
}
var ResizableBox = (0, import_element.forwardRef)(UnforwardedResizableBox);
ResizableBox.displayName = "ResizableBox";
var resizable_box_default = ResizableBox;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ResizableBox
});
//# sourceMappingURL=index.cjs.map
