"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSliderValue = getSliderValue;
var _clamp = require("@base-ui/utils/clamp");
var _asc = require("./asc");
function getSliderValue(valueInput, index, min, max, range, values) {
  const clamped = (0, _clamp.clamp)(valueInput, min, max);
  if (!range) {
    return clamped;
  }
  const output = values.slice();
  // Bound the new value to the thumb's neighbours.
  output[index] = (0, _clamp.clamp)(clamped, values[index - 1] ?? -Infinity, values[index + 1] ?? Infinity);
  return output.sort(_asc.asc);
}