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

// packages/components/src/tooltip/index.tsx
var tooltip_exports = {};
__export(tooltip_exports, {
  TOOLTIP_DELAY: () => TOOLTIP_DELAY,
  Tooltip: () => Tooltip2,
  default: () => tooltip_default
});
module.exports = __toCommonJS(tooltip_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_clsx = __toESM(require("clsx"));
var import_compose = require("@wordpress/compose");
var import_element = require("@wordpress/element");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_shortcut = __toESM(require("../shortcut/index.cjs"));
var import_utils = require("../popover/utils.cjs");
var import_context = require("./context.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
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
  } = (0, import_element.useContext)(import_context.TooltipInternalContext);
  const baseId = (0, import_compose.useInstanceId)(Tooltip2, "tooltip");
  const describedById = text || shortcut ? baseId : void 0;
  const isOnlyChild = import_element.Children.count(children) === 1;
  if (!isOnlyChild) {
    if ("development" === process.env.NODE_ENV) {
      console.error("wp-components.Tooltip should be called with only a single child element.");
    }
  }
  let computedPlacement;
  if (placement !== void 0) {
    computedPlacement = placement;
  } else if (position !== void 0) {
    computedPlacement = (0, import_utils.positionToPlacement)(position);
    (0, import_deprecated.default)("`position` prop in wp.components.tooltip", {
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
    return isOnlyChild ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.Role, {
      ...restProps,
      render: children
    }) : children;
  }
  function addDescribedById(element) {
    return describedById && mounted && element.props["aria-describedby"] === void 0 && element.props["aria-label"] !== text ? (0, import_element.cloneElement)(element, {
      "aria-describedby": describedById
    }) : element;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_context.TooltipInternalContext.Provider, {
    value: CONTEXT_VALUE,
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.TooltipAnchor, {
      onClick: hideOnClick ? tooltipStore.hide : void 0,
      store: tooltipStore,
      render: isOnlyChild ? addDescribedById(children) : void 0,
      ref,
      children: isOnlyChild ? void 0 : children
    }), isOnlyChild && (text || shortcut) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ariakit.Tooltip, {
      ...restProps,
      className: (0, import_clsx.default)("components-tooltip", className),
      unmountOnHide: true,
      gutter: 4,
      id: describedById,
      overflowPadding: 0.5,
      store: tooltipStore,
      children: [text, shortcut && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_shortcut.default, {
        className: text ? "components-tooltip__shortcut" : "",
        shortcut
      })]
    })]
  });
}
var Tooltip2 = (0, import_element.forwardRef)(UnforwardedTooltip);
var tooltip_default = Tooltip2;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TOOLTIP_DELAY,
  Tooltip
});
//# sourceMappingURL=index.cjs.map
