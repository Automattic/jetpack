"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleInputPress = handleInputPress;
var _dom = require("@floating-ui/utils/dom");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _element = require("../../floating-ui-react/utils/element");
function handleInputPress(event, store, disabled, shouldIgnoreTarget) {
  if (event.baseUIHandlerPrevented) {
    return;
  }
  const target = (0, _element.getTarget)(event.nativeEvent);
  const targetElement = (0, _dom.isElement)(target) ? target : null;
  if (targetElement !== event.currentTarget && (shouldIgnoreTarget?.(targetElement) || (0, _element.isInteractiveElement)(targetElement))) {
    return;
  }
  event.preventDefault();
  if (disabled) {
    return;
  }
  store.context.inputRef.current?.focus();
  if (store.state.openOnInputClick) {
    store.context.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.inputPress, event.nativeEvent));
  }
}