"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDelay = getDelay;
exports.getRestMs = getRestMs;
exports.isClickLikeOpenEvent = isClickLikeOpenEvent;
exports.isHoverOpenEvent = isHoverOpenEvent;
Object.defineProperty(exports, "isInsideEnabledTrigger", {
  enumerable: true,
  get: function () {
    return _element.isTargetInsideEnabledTrigger;
  }
});
var _event = require("../utils/event");
var _element = require("../utils/element");
function resolveValue(value, pointerType) {
  if (pointerType != null && !(0, _event.isMouseLikePointerType)(pointerType)) {
    return 0;
  }
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
function getDelay(value, prop, pointerType) {
  const result = resolveValue(value, pointerType);
  if (typeof result === 'number') {
    return result;
  }
  return result?.[prop];
}
function getRestMs(value) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
function isClickLikeOpenEvent(openEventType, interactedInside) {
  return interactedInside || openEventType === 'click' || openEventType === 'mousedown';
}
function isHoverOpenEvent(openEventType) {
  return openEventType?.includes('mouse') && openEventType !== 'mousedown';
}