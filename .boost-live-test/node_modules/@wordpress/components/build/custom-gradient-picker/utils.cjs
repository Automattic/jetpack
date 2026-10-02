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

// packages/components/src/custom-gradient-picker/utils.ts
var utils_exports = {};
__export(utils_exports, {
  getGradientAstWithControlPoints: () => getGradientAstWithControlPoints,
  getGradientAstWithDefault: () => getGradientAstWithDefault,
  getLinearGradientRepresentation: () => getLinearGradientRepresentation,
  getStopCssColor: () => getStopCssColor
});
module.exports = __toCommonJS(utils_exports);
var import_gradient_parser = __toESM(require("gradient-parser"));
var import_colord = require("colord");
var import_names = __toESM(require("colord/plugins/names"));
var import_constants = require("./constants.cjs");
var import_serializer = require("./serializer.cjs");
(0, import_colord.extend)([import_names.default]);
function getLinearGradientRepresentation(gradientAST) {
  return (0, import_serializer.serializeGradient)({
    type: "linear-gradient",
    orientation: import_constants.HORIZONTAL_GRADIENT_ORIENTATION,
    colorStops: gradientAST.colorStops
  });
}
function hasUnsupportedLength(item) {
  return item.length === void 0 || item.length.type !== "%";
}
function getGradientAstWithDefault(value) {
  let gradientAST;
  let hasGradient = !!value;
  const valueToParse = value ?? import_constants.DEFAULT_GRADIENT;
  try {
    gradientAST = import_gradient_parser.default.parse(valueToParse)[0];
  } catch (error) {
    console.warn("wp.components.CustomGradientPicker failed to parse the gradient with error", error);
    gradientAST = import_gradient_parser.default.parse(import_constants.DEFAULT_GRADIENT)[0];
    hasGradient = false;
  }
  if (!Array.isArray(gradientAST.orientation) && gradientAST.orientation?.type === "directional") {
    gradientAST.orientation = {
      type: "angular",
      value: import_constants.DIRECTIONAL_ORIENTATION_ANGLE_MAP[gradientAST.orientation.value].toString()
    };
  }
  if (gradientAST.colorStops.some(hasUnsupportedLength)) {
    const {
      colorStops
    } = gradientAST;
    const step = 100 / (colorStops.length - 1);
    colorStops.forEach((stop, index) => {
      stop.length = {
        value: `${step * index}`,
        type: "%"
      };
    });
  }
  return {
    gradientAST,
    hasGradient
  };
}
function getGradientAstWithControlPoints(gradientAST, newControlPoints) {
  return {
    ...gradientAST,
    colorStops: newControlPoints.map(({
      position,
      color
    }) => {
      const {
        r,
        g,
        b,
        a
      } = (0, import_colord.colord)(color).toRgb();
      return {
        length: {
          type: "%",
          value: position?.toString()
        },
        type: a < 1 ? "rgba" : "rgb",
        value: a < 1 ? [`${r}`, `${g}`, `${b}`, `${a}`] : [`${r}`, `${g}`, `${b}`]
      };
    })
  };
}
function getStopCssColor(colorStop) {
  switch (colorStop.type) {
    case "hex":
      return `#${colorStop.value}`;
    case "literal":
      return colorStop.value;
    case "var":
      return `${colorStop.type}(${colorStop.value})`;
    case "rgb":
    case "rgba":
      return `${colorStop.type}(${colorStop.value.join(",")})`;
    case "hsl": {
      const [hue, saturation, lightness] = colorStop.value;
      return `hsl(${hue},${saturation}%,${lightness}%)`;
    }
    case "hsla": {
      const [hue, saturation, lightness, alpha] = colorStop.value;
      return `hsla(${hue},${saturation}%,${lightness}%,${alpha})`;
    }
    default:
      return "transparent";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getGradientAstWithControlPoints,
  getGradientAstWithDefault,
  getLinearGradientRepresentation,
  getStopCssColor
});
//# sourceMappingURL=utils.cjs.map
