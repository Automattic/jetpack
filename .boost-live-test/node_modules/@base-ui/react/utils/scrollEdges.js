"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SCROLL_EDGE_TOLERANCE_PX = void 0;
exports.getMaxScrollOffset = getMaxScrollOffset;
exports.normalizeScrollOffset = normalizeScrollOffset;
var _clamp = require("@base-ui/utils/clamp");
const SCROLL_EDGE_TOLERANCE_PX = exports.SCROLL_EDGE_TOLERANCE_PX = 1;
function getMaxScrollOffset(scrollSize, clientSize) {
  return Math.max(0, scrollSize - clientSize);
}
function normalizeScrollOffset(value, max) {
  if (max <= 0) {
    return 0;
  }
  const clamped = (0, _clamp.clamp)(value, 0, max);
  const startDistance = clamped;
  const endDistance = max - clamped;
  const withinStartTolerance = startDistance <= SCROLL_EDGE_TOLERANCE_PX;
  const withinEndTolerance = endDistance <= SCROLL_EDGE_TOLERANCE_PX;
  if (withinStartTolerance && withinEndTolerance) {
    return startDistance <= endDistance ? 0 : max;
  }
  if (withinStartTolerance) {
    return 0;
  }
  if (withinEndTolerance) {
    return max;
  }
  return clamped;
}