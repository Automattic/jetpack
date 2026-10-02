"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useEnhancedClickHandler = useEnhancedClickHandler;
var React = _interopRequireWildcard(require("react"));
/**
 * Provides a cross-browser way to determine the type of the pointer used to click.
 * Safari and Firefox do not provide the PointerEvent to the click handler (they use MouseEvent) yet.
 * Additionally, this implementation detects if the click was triggered by the keyboard.
 *
 * @param handler The function to be called when the button is clicked. The first parameter is the original event and the second parameter is the pointer type.
 */
function useEnhancedClickHandler(handler) {
  const lastClickInteractionTypeRef = React.useRef('');
  const handlePointerDown = React.useCallback(event => {
    if (event.defaultPrevented) {
      return;
    }
    lastClickInteractionTypeRef.current = event.pointerType;
    handler(event, event.pointerType);
  }, [handler]);
  const handleClick = React.useCallback(event => {
    // event.detail has the number of clicks performed on the element. 0 means it was triggered by the keyboard.
    if (event.detail === 0) {
      handler(event, 'keyboard');
      return;
    }
    if ('pointerType' in event) {
      // Chrome and Edge correctly use PointerEvent
      handler(event, event.pointerType);
    } else {
      handler(event, lastClickInteractionTypeRef.current);
    }
    lastClickInteractionTypeRef.current = '';
  }, [handler]);
  return {
    onClick: handleClick,
    onPointerDown: handlePointerDown
  };
}