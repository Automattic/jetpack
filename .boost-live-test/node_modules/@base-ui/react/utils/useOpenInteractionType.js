"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useOpenInteractionType = useOpenInteractionType;
exports.useOpenMethodTriggerProps = useOpenMethodTriggerProps;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useEnhancedClickHandler = require("@base-ui/utils/useEnhancedClickHandler");
var _platform = require("@base-ui/utils/platform");
var _useValueChanged = require("../internals/useValueChanged");
function useOpenMethodTriggerProps(open, setOpenMethod) {
  const handleTriggerClick = (0, _useStableCallback.useStableCallback)((_, interactionType) => {
    const isOpen = typeof open === 'function' ? open() : open;
    if (!isOpen) {
      setOpenMethod(interactionType || (
      // On iOS Safari, the hitslop around touch targets means tapping outside an element's
      // bounds does not fire `pointerdown` but does fire `mousedown`. The `interactionType`
      // will be "" in that case.
      _platform.platform.os.ios ? 'touch' : ''));
    }
  });
  const {
    onClick,
    onPointerDown
  } = (0, _useEnhancedClickHandler.useEnhancedClickHandler)(handleTriggerClick);
  return React.useMemo(() => ({
    onClick,
    onPointerDown
  }), [onClick, onPointerDown]);
}

/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
function useOpenInteractionType(open) {
  const [openMethod, setOpenMethod] = React.useState(null);
  const triggerProps = useOpenMethodTriggerProps(open, setOpenMethod);
  (0, _useValueChanged.useValueChanged)(open, previousOpen => {
    if (previousOpen && !open) {
      setOpenMethod(null);
    }
  });
  return React.useMemo(() => ({
    openMethod,
    triggerProps
  }), [openMethod, triggerProps]);
}