// packages/components/src/tooltip/index.tsx
import * as Ariakit from "@ariakit/react";
import clsx from "clsx";
import { useInstanceId } from "@wordpress/compose";
import { Children, useContext, forwardRef, cloneElement } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import Shortcut from "../shortcut/index.mjs";
import { positionToPlacement } from "../popover/utils.mjs";
import { TooltipInternalContext } from "./context.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var TOOLTIP_DELAY = 700;
var CONTEXT_VALUE = {
  isNestedInTooltip: true
};
function UnforwardedTooltip(props, ref) {
  const {
    children,
    className,
    delay = TOOLTIP_DELAY,
    hideOnClick = true,
    placement,
    position,
    shortcut,
    text,
    ...restProps
  } = props;
  const {
    isNestedInTooltip
  } = useContext(TooltipInternalContext);
  const baseId = useInstanceId(Tooltip2, "tooltip");
  const describedById = text || shortcut ? baseId : void 0;
  const isOnlyChild = Children.count(children) === 1;
  if (!isOnlyChild) {
    if ("development" === process.env.NODE_ENV) {
      console.error("wp-components.Tooltip should be called with only a single child element.");
    }
  }
  let computedPlacement;
  if (placement !== void 0) {
    computedPlacement = placement;
  } else if (position !== void 0) {
    computedPlacement = positionToPlacement(position);
    deprecated("`position` prop in wp.components.tooltip", {
      since: "6.4",
      alternative: "`placement` prop"
    });
  }
  computedPlacement = computedPlacement || "top";
  const tooltipStore = Ariakit.useTooltipStore({
    placement: computedPlacement,
    showTimeout: delay
  });
  const mounted = Ariakit.useStoreState(tooltipStore, "mounted");
  if (isNestedInTooltip) {
    return isOnlyChild ? /* @__PURE__ */ _jsx(Ariakit.Role, {
      ...restProps,
      render: children
    }) : children;
  }
  function addDescribedById(element) {
    return describedById && mounted && element.props["aria-describedby"] === void 0 && element.props["aria-label"] !== text ? cloneElement(element, {
      "aria-describedby": describedById
    }) : element;
  }
  return /* @__PURE__ */ _jsxs(TooltipInternalContext.Provider, {
    value: CONTEXT_VALUE,
    children: [/* @__PURE__ */ _jsx(Ariakit.TooltipAnchor, {
      onClick: hideOnClick ? tooltipStore.hide : void 0,
      store: tooltipStore,
      render: isOnlyChild ? addDescribedById(children) : void 0,
      ref,
      children: isOnlyChild ? void 0 : children
    }), isOnlyChild && (text || shortcut) && /* @__PURE__ */ _jsxs(Ariakit.Tooltip, {
      ...restProps,
      className: clsx("components-tooltip", className),
      unmountOnHide: true,
      gutter: 4,
      id: describedById,
      overflowPadding: 0.5,
      store: tooltipStore,
      children: [text, shortcut && /* @__PURE__ */ _jsx(Shortcut, {
        className: text ? "components-tooltip__shortcut" : "",
        shortcut
      })]
    })]
  });
}
var Tooltip2 = forwardRef(UnforwardedTooltip);
var tooltip_default = Tooltip2;
export {
  TOOLTIP_DELAY,
  Tooltip2 as Tooltip,
  tooltip_default as default
};
//# sourceMappingURL=index.mjs.map
