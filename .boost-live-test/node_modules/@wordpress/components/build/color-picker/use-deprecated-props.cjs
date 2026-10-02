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

// packages/components/src/color-picker/use-deprecated-props.ts
var use_deprecated_props_exports = {};
__export(use_deprecated_props_exports, {
  useDeprecatedProps: () => useDeprecatedProps
});
module.exports = __toCommonJS(use_deprecated_props_exports);
var import_colord = require("colord");
var import_memize = __toESM(require("memize"));
var import_element = require("@wordpress/element");
function isLegacyProps(props) {
  return typeof props.onChangeComplete !== "undefined" || typeof props.disableAlpha !== "undefined" || typeof props.color?.hex === "string";
}
function getColorFromLegacyProps(color) {
  if (color === void 0) {
    return;
  }
  if (typeof color === "string") {
    return color;
  }
  if (color.hex) {
    return color.hex;
  }
  return void 0;
}
var transformColorStringToLegacyColor = (0, import_memize.default)((color) => {
  const colordColor = (0, import_colord.colord)(color);
  const hex = colordColor.toHex();
  const rgb = colordColor.toRgb();
  const hsv = colordColor.toHsv();
  const hsl = colordColor.toHsl();
  return {
    hex,
    rgb,
    hsv,
    hsl,
    source: "hex",
    oldHue: hsl.h
  };
});
function useDeprecatedProps(props) {
  const {
    onChangeComplete
  } = props;
  const legacyChangeHandler = (0, import_element.useCallback)((color) => {
    onChangeComplete(transformColorStringToLegacyColor(color));
  }, [onChangeComplete]);
  if (isLegacyProps(props)) {
    return {
      color: getColorFromLegacyProps(props.color),
      enableAlpha: !props.disableAlpha,
      onChange: legacyChangeHandler
    };
  }
  return {
    ...props,
    color: props.color,
    enableAlpha: props.enableAlpha,
    onChange: props.onChange
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useDeprecatedProps
});
//# sourceMappingURL=use-deprecated-props.cjs.map
