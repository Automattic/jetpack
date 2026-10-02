"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "activeElement", {
  enumerable: true,
  get: function () {
    return _shadowDom.activeElement;
  }
});
Object.defineProperty(exports, "contains", {
  enumerable: true,
  get: function () {
    return _shadowDom.contains;
  }
});
exports.getFloatingFocusElement = getFloatingFocusElement;
Object.defineProperty(exports, "getTarget", {
  enumerable: true,
  get: function () {
    return _shadowDom.getTarget;
  }
});
exports.isEventTargetWithin = isEventTargetWithin;
exports.isInteractiveElement = isInteractiveElement;
exports.isRootElement = isRootElement;
exports.isTargetInsideEnabledTrigger = isTargetInsideEnabledTrigger;
exports.isTypeableCombobox = isTypeableCombobox;
exports.isTypeableElement = isTypeableElement;
exports.matchesFocusVisible = matchesFocusVisible;
var _dom = require("@floating-ui/utils/dom");
var _platform = require("@base-ui/utils/platform");
var _shadowDom = require("@base-ui/utils/shadowDom");
var _constants = require("./constants");
var TooltipTriggerDataAttributes = _interopRequireWildcard(require("../../tooltip/trigger/TooltipTriggerDataAttributes"));
function isTargetInsideEnabledTrigger(target, triggerElements) {
  if (!(0, _dom.isElement)(target)) {
    return false;
  }
  const targetElement = target;
  if (triggerElements.hasElement(targetElement)) {
    return !targetElement.hasAttribute(TooltipTriggerDataAttributes.triggerDisabled);
  }
  for (const [, trigger] of triggerElements.entries()) {
    if ((0, _shadowDom.contains)(trigger, targetElement)) {
      return !trigger.hasAttribute(TooltipTriggerDataAttributes.triggerDisabled);
    }
  }
  return false;
}
function isEventTargetWithin(event, node) {
  if (node == null) {
    return false;
  }
  if ('composedPath' in event) {
    return event.composedPath().includes(node);
  }

  // TS thinks `event` is of type never as it assumes all browsers support composedPath, but browsers without shadow dom don't
  const eventAgain = event;
  return eventAgain.target != null && node.contains(eventAgain.target);
}
function isRootElement(element) {
  return element.matches('html,body');
}
function isTypeableElement(element) {
  return (0, _dom.isHTMLElement)(element) && element.matches(_constants.TYPEABLE_SELECTOR);
}
function isInteractiveElement(element) {
  return element?.closest(`button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${_constants.TYPEABLE_SELECTOR}`) != null;
}
function isTypeableCombobox(element) {
  if (!element) {
    return false;
  }
  return element.getAttribute('role') === 'combobox' && isTypeableElement(element);
}
function matchesFocusVisible(element) {
  // We don't want to block focus from working with `visibleOnly`
  // (JSDOM doesn't match `:focus-visible` when the element has `:focus`)
  if (!element || _platform.platform.env.jsdom) {
    return true;
  }
  try {
    return element.matches(':focus-visible');
  } catch (_e) {
    return true;
  }
}
function getFloatingFocusElement(floatingElement) {
  if (!floatingElement) {
    return null;
  }
  // Try to find the element that has `{...getFloatingProps()}` spread on it.
  // This indicates the floating element is acting as a positioning wrapper, and
  // so focus should be managed on the child element with the event handlers and
  // aria props.
  return floatingElement.hasAttribute(_constants.FOCUSABLE_ATTRIBUTE) ? floatingElement : floatingElement.querySelector(`[${_constants.FOCUSABLE_ATTRIBUTE}]`) || floatingElement;
}