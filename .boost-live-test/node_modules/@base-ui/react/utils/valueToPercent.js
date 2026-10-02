"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valueToPercent = valueToPercent;
function valueToPercent(value, min, max) {
  return (value - min) * 100 / (max - min);
}