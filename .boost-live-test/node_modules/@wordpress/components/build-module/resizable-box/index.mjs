// packages/components/src/resizable-box/index.tsx
import { forwardRef } from "@wordpress/element";
import clsx from "clsx";
import { Resizable } from "re-resizable";
import ResizeTooltip from "./resize-tooltip/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var HANDLE_CLASS_NAME = "components-resizable-box__handle";
var SIDE_HANDLE_CLASS_NAME = "components-resizable-box__side-handle";
var CORNER_HANDLE_CLASS_NAME = "components-resizable-box__corner-handle";
var HANDLE_CLASSES = {
  top: clsx(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-top"),
  right: clsx(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-right"),
  bottom: clsx(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-bottom"),
  left: clsx(HANDLE_CLASS_NAME, SIDE_HANDLE_CLASS_NAME, "components-resizable-box__handle-left"),
  topLeft: clsx(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-top", "components-resizable-box__handle-left"),
  topRight: clsx(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-top", "components-resizable-box__handle-right"),
  bottomRight: clsx(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-bottom", "components-resizable-box__handle-right"),
  bottomLeft: clsx(HANDLE_CLASS_NAME, CORNER_HANDLE_CLASS_NAME, "components-resizable-box__handle-bottom", "components-resizable-box__handle-left")
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
  return /* @__PURE__ */ _jsxs(Resizable, {
    className: clsx("components-resizable-box__container", showHandle && "has-show-handle", className),
    handleComponent: Object.fromEntries(Object.keys(HANDLE_CLASSES).map((key) => [key, /* @__PURE__ */ _jsx("div", {
      tabIndex: -1
    }, key)])),
    handleClasses: HANDLE_CLASSES,
    handleStyles: HANDLE_STYLES,
    ref,
    ...props,
    children: [children, showTooltip && /* @__PURE__ */ _jsx(ResizeTooltip, {
      ...tooltipProps
    })]
  });
}
var ResizableBox = forwardRef(UnforwardedResizableBox);
ResizableBox.displayName = "ResizableBox";
var resizable_box_default = ResizableBox;
export {
  ResizableBox,
  resizable_box_default as default
};
//# sourceMappingURL=index.mjs.map
