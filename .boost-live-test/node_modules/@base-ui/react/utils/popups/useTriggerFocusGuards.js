"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTriggerFocusGuards = useTriggerFocusGuards;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _utils = require("../../floating-ui-react/utils");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
/**
 * Minimal store interface required by the focus guard hook.
 * Both PopoverStore and MenuStore satisfy this interface.
 */

/**
 * Provides focus guard handlers for popup triggers (Popover, Menu).
 *
 * When the popup is open, invisible focus guard elements are placed before and after
 * the trigger. These handlers close the popup and move focus to the appropriate
 * tabbable element when the guards receive focus (i.e. when the user tabs out).
 */
function useTriggerFocusGuards(store, triggerElementRef) {
  const preFocusGuardRef = React.useRef(null);
  function handlePreFocusGuardFocus(event) {
    ReactDOM.flushSync(() => {
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event.nativeEvent, event.currentTarget));
    });
    const previousTabbable = (0, _utils.getTabbableBeforeElement)(preFocusGuardRef.current);
    previousTabbable?.focus();
  }
  function handleFocusTargetFocus(event) {
    const positionerElement = store.select('positionerElement');
    if (positionerElement && (0, _utils.isOutsideEvent)(event, positionerElement)) {
      store.context.beforeContentFocusGuardRef.current?.focus();
    } else {
      ReactDOM.flushSync(() => {
        store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event.nativeEvent, event.currentTarget));
      });
      let nextTabbable = (0, _utils.getTabbableAfterElement)(store.context.triggerFocusTargetRef.current || triggerElementRef.current);
      while (nextTabbable !== null && (0, _utils.contains)(positionerElement, nextTabbable)) {
        const prevTabbable = nextTabbable;
        nextTabbable = (0, _utils.getNextTabbable)(nextTabbable);
        if (nextTabbable === prevTabbable) {
          break;
        }
      }
      nextTabbable?.focus();
    }
  }
  return {
    preFocusGuardRef,
    handlePreFocusGuardFocus,
    handleFocusTargetFocus
  };
}