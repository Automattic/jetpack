"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContextMenuTrigger = void 0;
var React = _interopRequireWildcard(require("react"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _owner = require("@base-ui/utils/owner");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _utils = require("../../floating-ui-react/utils");
var _ContextMenuRootContext = require("../root/ContextMenuRootContext");
var _MenuRootContext = require("../../menu/root/MenuRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _reasons = require("../../internals/reasons");
var _findRootOwnerId = require("../../menu/utils/findRootOwnerId");
const LONG_PRESS_DELAY = 500;

/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
const ContextMenuTrigger = exports.ContextMenuTrigger = /*#__PURE__*/React.forwardRef(function ContextMenuTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    setAnchor,
    actionsRef,
    internalBackdropRef,
    backdropRef,
    positionerRef,
    allowMouseUpTriggerRef,
    initialCursorPointRef,
    rootId
  } = (0, _ContextMenuRootContext.useContextMenuRootContext)(false);
  const {
    store
  } = (0, _MenuRootContext.useMenuRootContext)(false);
  const open = store.useState('open');
  const disabled = store.useState('disabled');
  const triggerRef = React.useRef(null);
  const touchPositionRef = React.useRef(null);
  const longPressTimeout = (0, _useTimeout.useTimeout)();
  const allowMouseUpTimeout = (0, _useTimeout.useTimeout)();
  const allowMouseUpRef = React.useRef(false);
  const mouseUpAbortControllerRef = React.useRef(null);
  function handleLongPress(x, y, event) {
    const isTouchEvent = event.type.startsWith('touch');
    initialCursorPointRef.current = {
      x,
      y
    };
    setAnchor({
      getBoundingClientRect() {
        return DOMRect.fromRect({
          width: isTouchEvent ? 10 : 0,
          height: isTouchEvent ? 10 : 0,
          x,
          y
        });
      }
    });
    allowMouseUpRef.current = false;
    actionsRef.current?.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerPress, event));
    allowMouseUpTimeout.start(LONG_PRESS_DELAY, () => {
      allowMouseUpRef.current = true;
    });
  }
  function handleContextMenu(event) {
    if (disabled) {
      return;
    }
    allowMouseUpTriggerRef.current = true;
    (0, _utils.stopEvent)(event);
    handleLongPress(event.clientX, event.clientY, event.nativeEvent);
    const doc = (0, _owner.ownerDocument)(triggerRef.current);

    // Abort a listener from a previous trigger that never saw its mouseup, and scope this
    // one to a fresh controller so it's removed on unmount if the mouseup never arrives.
    mouseUpAbortControllerRef.current?.abort();
    const mouseUpAbortController = new AbortController();
    mouseUpAbortControllerRef.current = mouseUpAbortController;
    doc.addEventListener('mouseup', mouseEvent => {
      allowMouseUpTriggerRef.current = false;
      if (!allowMouseUpRef.current) {
        return;
      }
      allowMouseUpTimeout.clear();
      allowMouseUpRef.current = false;
      const mouseUpTarget = (0, _utils.getTarget)(mouseEvent);
      if ((0, _utils.contains)(positionerRef.current, mouseUpTarget)) {
        return;
      }
      if (rootId && mouseUpTarget && (0, _findRootOwnerId.findRootOwnerId)(mouseUpTarget) === rootId) {
        return;
      }
      actionsRef.current?.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.cancelOpen, mouseEvent));
    }, {
      once: true,
      signal: mouseUpAbortController.signal
    });
  }
  function cancelLongPress() {
    longPressTimeout.clear();
    touchPositionRef.current = null;
  }
  function handleTouchStart(event) {
    if (disabled) {
      cancelLongPress();
      return;
    }
    allowMouseUpTriggerRef.current = false;
    if (event.touches.length !== 1) {
      cancelLongPress();
      return;
    }
    event.stopPropagation();
    const touch = event.touches[0];
    const touchPosition = {
      x: touch.clientX,
      y: touch.clientY
    };
    touchPositionRef.current = touchPosition;
    longPressTimeout.start(LONG_PRESS_DELAY, () => {
      handleLongPress(touchPosition.x, touchPosition.y, event.nativeEvent);
    });
  }
  function handleTouchMove(event) {
    if (event.touches.length !== 1) {
      cancelLongPress();
      return;
    }
    if (longPressTimeout.isStarted() && touchPositionRef.current) {
      const touch = event.touches[0];
      const moveThreshold = 10;
      const deltaX = Math.abs(touch.clientX - touchPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchPositionRef.current.y);
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        cancelLongPress();
      }
    }
  }
  React.useEffect(() => () => {
    // Abort a pending mouseup listener if the trigger unmounts before it fires.
    mouseUpAbortControllerRef.current?.abort();
  }, []);
  React.useEffect(() => {
    function handleDocumentContextMenu(event) {
      if (disabled) {
        return;
      }
      const target = (0, _utils.getTarget)(event);
      const targetElement = target;
      if ((0, _utils.contains)(triggerRef.current, targetElement) || (0, _utils.contains)(internalBackdropRef.current, targetElement) || (0, _utils.contains)(backdropRef.current, targetElement)) {
        event.preventDefault();
      }
    }
    const doc = (0, _owner.ownerDocument)(triggerRef.current);
    return (0, _addEventListener.addEventListener)(doc, 'contextmenu', handleDocumentContextMenu);
  }, [backdropRef, disabled, internalBackdropRef]);
  const state = {
    open
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [triggerRef, forwardedRef],
    props: [{
      onContextMenu: handleContextMenu,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: cancelLongPress,
      onTouchCancel: cancelLongPress,
      style: {
        WebkitTouchCallout: 'none'
      }
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.pressableTriggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ContextMenuTrigger.displayName = "ContextMenuTrigger";