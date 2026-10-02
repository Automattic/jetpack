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

// packages/components/src/range-control/tooltip.tsx
var tooltip_exports = {};
__export(tooltip_exports, {
  default: () => SimpleTooltip
});
module.exports = __toCommonJS(tooltip_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_range_control_styles = require("./styles/range-control-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function SimpleTooltip(props) {
  const {
    className,
    inputRef,
    tooltipPlacement,
    show = false,
    style = {},
    value = 0,
    renderTooltipContent = (v) => v,
    zIndex = 100,
    ...restProps
  } = props;
  const placement = useTooltipPlacement({
    inputRef,
    tooltipPlacement
  });
  const classes = (0, import_clsx.default)("components-simple-tooltip", className);
  const styles = {
    ...style,
    zIndex
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_range_control_styles.Tooltip, {
    ...restProps,
    "aria-hidden": "false",
    className: classes,
    placement,
    show,
    role: "tooltip",
    style: styles,
    children: renderTooltipContent(value)
  });
}
function useTooltipPlacement({
  inputRef,
  tooltipPlacement
}) {
  const [placement, setPlacement] = (0, import_element.useState)();
  const setTooltipPlacement = (0, import_element.useCallback)(() => {
    if (inputRef && inputRef.current) {
      setPlacement(tooltipPlacement);
    }
  }, [tooltipPlacement, inputRef]);
  (0, import_element.useEffect)(() => {
    setTooltipPlacement();
  }, [setTooltipPlacement]);
  (0, import_element.useEffect)(() => {
    window.addEventListener("resize", setTooltipPlacement);
    return () => {
      window.removeEventListener("resize", setTooltipPlacement);
    };
  });
  return placement;
}
//# sourceMappingURL=tooltip.cjs.map
