// packages/components/src/border-box-control/utils.ts
import { parseCSSUnitValue } from "../utils/unit-values.mjs";
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
  const units = values.map((value) => value === void 0 ? void 0 : parseCSSUnitValue(`${value}`)[1]);
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
export {
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
};
//# sourceMappingURL=utils.mjs.map
