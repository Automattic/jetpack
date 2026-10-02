"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/border-box-control/utils.ts
var utils_exports = {};
__export(utils_exports, {
  getBorderDiff: () => getBorderDiff,
  getCommonBorder: () => getCommonBorder,
  getMostCommonUnit: () => getMostCommonUnit,
  getShorthandBorderStyle: () => getShorthandBorderStyle,
  getSplitBorders: () => getSplitBorders,
  hasMixedBorders: () => hasMixedBorders,
  hasSplitBorders: () => hasSplitBorders,
  isCompleteBorder: () => isCompleteBorder,
  isDefinedBorder: () => isDefinedBorder,
  isEmptyBorder: () => isEmptyBorder
});
module.exports = __toCommonJS(utils_exports);
var import_unit_values = require("../utils/unit-values.cjs");
var sides = ["top", "right", "bottom", "left"];
var borderProps = ["color", "style", "width"];
var isEmptyBorder = (border) => {
  if (!border) {
    return true;
  }
  return !borderProps.some((prop) => border[prop] !== void 0);
};
var isDefinedBorder = (border) => {
  if (!border) {
    return false;
  }
  if (hasSplitBorders(border)) {
    const allSidesEmpty = sides.every((side) => isEmptyBorder(border[side]));
    return !allSidesEmpty;
  }
  return !isEmptyBorder(border);
};
var isCompleteBorder = (border) => {
  if (!border) {
    return false;
  }
  return borderProps.every((prop) => border[prop] !== void 0);
};
var hasSplitBorders = (border = {}) => {
  return Object.keys(border).some((side) => sides.indexOf(side) !== -1);
};
var hasMixedBorders = (borders) => {
  if (!hasSplitBorders(borders)) {
    return false;
  }
  const shorthandBorders = sides.map((side) => getShorthandBorderStyle(borders?.[side]));
  return !shorthandBorders.every((border) => border === shorthandBorders[0]);
};
var getSplitBorders = (border) => {
  if (!border || isEmptyBorder(border)) {
    return void 0;
  }
  return {
    top: border,
    right: border,
    bottom: border,
    left: border
  };
};
var getBorderDiff = (original, updated) => {
  const diff = {};
  if (original.color !== updated.color) {
    diff.color = updated.color;
  }
  if (original.style !== updated.style) {
    diff.style = updated.style;
  }
  if (original.width !== updated.width) {
    diff.width = updated.width;
  }
  return diff;
};
var getCommonBorder = (borders) => {
  if (!borders) {
    return void 0;
  }
  const colors = [];
  const styles = [];
  const widths = [];
  sides.forEach((side) => {
    colors.push(borders[side]?.color);
    styles.push(borders[side]?.style);
    widths.push(borders[side]?.width);
  });
  const allColorsMatch = colors.every((value) => value === colors[0]);
  const allStylesMatch = styles.every((value) => value === styles[0]);
  const allWidthsMatch = widths.every((value) => value === widths[0]);
  return {
    color: allColorsMatch ? colors[0] : void 0,
    style: allStylesMatch ? styles[0] : void 0,
    width: allWidthsMatch ? widths[0] : getMostCommonUnit(widths)
  };
};
var getShorthandBorderStyle = (border, fallbackBorder) => {
  if (isEmptyBorder(border)) {
    return fallbackBorder;
  }
  const {
    color: fallbackColor,
    style: fallbackStyle,
    width: fallbackWidth
  } = fallbackBorder || {};
  const {
    color = fallbackColor,
    style = fallbackStyle,
    width = fallbackWidth
  } = border;
  const hasVisibleBorder = !!width && width !== "0" || !!color;
  const borderStyle = hasVisibleBorder ? style || "solid" : style;
  return [width, borderStyle, color].filter(Boolean).join(" ");
};
var getMostCommonUnit = (values) => {
  const units = values.map((value) => value === void 0 ? void 0 : (0, import_unit_values.parseCSSUnitValue)(`${value}`)[1]);
  const filteredUnits = units.filter((value) => value !== void 0);
  return mode(filteredUnits);
};
function mode(values) {
  if (values.length === 0) {
    return void 0;
  }
  const map = {};
  let maxCount = 0;
  let currentMode;
  values.forEach((value) => {
    map[value] = map[value] === void 0 ? 1 : map[value] + 1;
    if (map[value] > maxCount) {
      currentMode = value;
      maxCount = map[value];
    }
  });
  return currentMode;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getBorderDiff,
  getCommonBorder,
  getMostCommonUnit,
  getShorthandBorderStyle,
  getSplitBorders,
  hasMixedBorders,
  hasSplitBorders,
  isCompleteBorder,
  isDefinedBorder,
  isEmptyBorder
});
//# sourceMappingURL=utils.cjs.map
