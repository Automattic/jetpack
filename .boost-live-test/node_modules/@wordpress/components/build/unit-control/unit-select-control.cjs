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

// packages/components/src/unit-control/unit-select-control.tsx
var unit_select_control_exports = {};
__export(unit_select_control_exports, {
  default: () => unit_select_control_default
});
module.exports = __toCommonJS(unit_select_control_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_unit_control_styles = require("./styles/unit-control-styles.cjs");
var import_utils = require("./utils.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnitSelectControl({
  className,
  isUnitSelectTabbable: isTabbable = true,
  onChange,
  size = "default",
  unit = "px",
  units = import_utils.CSS_UNITS,
  ...props
}, ref) {
  if (!(0, import_utils.hasUnits)(units) || units?.length === 1) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_unit_control_styles.UnitLabel, {
      className: "components-unit-control__unit-label",
      selectSize: size,
      children: unit
    });
  }
  const handleOnChange = (event) => {
    const {
      value: unitValue
    } = event.target;
    const data = units.find((option) => option.value === unitValue);
    onChange?.(unitValue, {
      event,
      data
    });
  };
  const classes = (0, import_clsx.default)("components-unit-control__select", className);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_unit_control_styles.UnitSelect, {
    ref,
    className: classes,
    onChange: handleOnChange,
    selectSize: size,
    tabIndex: isTabbable ? void 0 : -1,
    value: unit,
    ...props,
    children: units.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
      value: option.value,
      children: option.label
    }, option.value))
  });
}
var unit_select_control_default = (0, import_element.forwardRef)(UnitSelectControl);
//# sourceMappingURL=unit-select-control.cjs.map
