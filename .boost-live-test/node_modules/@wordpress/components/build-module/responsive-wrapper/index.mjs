// packages/components/src/responsive-wrapper/index.tsx
import clsx from "clsx";
import { cloneElement, Children } from "@wordpress/element";
import { jsx as _jsx } from "react/jsx-runtime";
function ResponsiveWrapper({
  naturalWidth,
  naturalHeight,
  children,
  isInline = false
}) {
  if (Children.count(children) !== 1) {
    return null;
  }
  const TagName = isInline ? "span" : "div";
  let aspectRatio;
  if (naturalWidth && naturalHeight) {
    aspectRatio = `${naturalWidth} / ${naturalHeight}`;
  }
  return /* @__PURE__ */ _jsx(TagName, {
    className: "components-responsive-wrapper",
    children: /* @__PURE__ */ _jsx("div", {
      children: cloneElement(children, {
        className: clsx("components-responsive-wrapper__content", children.props.className),
        style: {
          ...children.props.style,
          aspectRatio
        }
      })
    })
  });
}
var responsive_wrapper_default = ResponsiveWrapper;
export {
  responsive_wrapper_default as default
};
//# sourceMappingURL=index.mjs.map
