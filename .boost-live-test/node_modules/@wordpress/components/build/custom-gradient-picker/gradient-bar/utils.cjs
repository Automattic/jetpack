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

// packages/components/src/custom-gradient-picker/gradient-bar/utils.ts
var utils_exports = {};
__export(utils_exports, {
  addControlPoint: () => addControlPoint,
  clampPercent: () => clampPercent,
  getHorizontalRelativeGradientPosition: () => getHorizontalRelativeGradientPosition,
  isOverlapping: () => isOverlapping,
  removeControlPoint: () => removeControlPoint,
  updateControlPoint: () => updateControlPoint,
  updateControlPointColor: () => updateControlPointColor,
  updateControlPointColorByPosition: () => updateControlPointColorByPosition,
  updateControlPointPosition: () => updateControlPointPosition
});
module.exports = __toCommonJS(utils_exports);
var import_constants = require("./constants.cjs");
function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}
function isOverlapping(value, initialIndex, newPosition, minDistance = import_constants.MINIMUM_DISTANCE_BETWEEN_POINTS) {
  const initialPosition = value[initialIndex].position;
  const minPosition = Math.min(initialPosition, newPosition);
  const maxPosition = Math.max(initialPosition, newPosition);
  return value.some(({
    position
  }, index) => {
    return index !== initialIndex && (Math.abs(position - newPosition) < minDistance || minPosition < position && position < maxPosition);
  });
}
function addControlPoint(points, position, color) {
  const nextIndex = points.findIndex((point) => point.position > position);
  const newPoint = {
    color,
    position
  };
  const newPoints = points.slice();
  newPoints.splice(nextIndex - 1, 0, newPoint);
  return newPoints;
}
function removeControlPoint(points, index) {
  return points.filter((_point, pointIndex) => {
    return pointIndex !== index;
  });
}
function updateControlPoint(points, index, newPoint) {
  const newValue = points.slice();
  newValue[index] = newPoint;
  return newValue;
}
function updateControlPointPosition(points, index, newPosition) {
  if (isOverlapping(points, index, newPosition)) {
    return points;
  }
  const newPoint = {
    ...points[index],
    position: newPosition
  };
  return updateControlPoint(points, index, newPoint);
}
function updateControlPointColor(points, index, newColor) {
  const newPoint = {
    ...points[index],
    color: newColor
  };
  return updateControlPoint(points, index, newPoint);
}
function updateControlPointColorByPosition(points, position, newColor) {
  const index = points.findIndex((point) => point.position === position);
  return updateControlPointColor(points, index, newColor);
}
function getHorizontalRelativeGradientPosition(mouseXCoordinate, containerElement) {
  if (!containerElement) {
    return;
  }
  const {
    x,
    width
  } = containerElement.getBoundingClientRect();
  const absolutePositionValue = mouseXCoordinate - x;
  return Math.round(clampPercent(absolutePositionValue * 100 / width));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addControlPoint,
  clampPercent,
  getHorizontalRelativeGradientPosition,
  isOverlapping,
  removeControlPoint,
  updateControlPoint,
  updateControlPointColor,
  updateControlPointColorByPosition,
  updateControlPointPosition
});
//# sourceMappingURL=utils.cjs.map
