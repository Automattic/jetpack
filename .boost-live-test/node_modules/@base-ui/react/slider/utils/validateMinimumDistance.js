"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateMinimumDistance = validateMinimumDistance;
function validateMinimumDistance(values, step, minStepsBetweenValues) {
  if (!Array.isArray(values)) {
    return true;
  }
  const minDistance = step * minStepsBetweenValues;
  for (let i = 0; i < values.length - 1; i += 1) {
    if (!(Math.abs(values[i] - values[i + 1]) >= minDistance)) {
      return false;
    }
  }
  return true;
}