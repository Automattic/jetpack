"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuTrigger = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _addEventListener = require("@base-ui/utils/addEventListener");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _owner = require("@base-ui/utils/owner");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _empty = require("@base-ui/utils/empty");
var _floatingUiReact = require("../../floating-ui-react");
var _useHoverInteractionSharedState = require("../../floating-ui-react/hooks/useHoverInteractionSharedState");
var _utils = require("../../floating-ui-react/utils");
var _NavigationMenuItemContext = require("../item/NavigationMenuItemContext");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _constants = require("../../internals/constants");
var _FocusGuard = require("../../utils/FocusGuard");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _isOutsideMenuEvent = require("../utils/isOutsideMenuEvent");
var _CompositeItem = require("../../internals/composite/item/CompositeItem");
var _useButton = require("../../internals/use-button");
var _useAnimationsFinished = require("../../internals/useAnimationsFinished");
var _getCssDimensions = require("../../utils/getCssDimensions");
var _constants2 = require("../utils/constants");
var _setSharedFixedSize = require("../utils/setSharedFixedSize");
var _NavigationMenuDismissContext = require("../list/NavigationMenuDismissContext");
var NavigationMenuPopupCssVars = _interopRequireWildcard(require("../popup/NavigationMenuPopupCssVars"));
var NavigationMenuPositionerCssVars = _interopRequireWildcard(require("../positioner/NavigationMenuPositionerCssVars"));
var _mergeProps = require("../../merge-props");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _jsxRuntime = require("react/jsx-runtime");
const DEFAULT_SIZE = {
  width: 0,
  height: 0
};

/**
 * Opens the navigation menu popup when hovered or clicked, revealing the
 * associated content.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuTrigger = exports.NavigationMenuTrigger = /*#__PURE__*/React.forwardRef(function NavigationMenuTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    nativeButton = true,
    disabled = false,
    ...elementProps
  } = componentProps;
  const {
    value,
    setValue,
    mounted,
    open,
    positionerElement,
    setActivationDirection,
    setFloatingRootContext,
    popupElement,
    viewportElement,
    transitionStatus,
    rootRef,
    beforeOutsideRef,
    afterOutsideRef,
    afterInsideRef,
    beforeInsideRef,
    prevTriggerElementRef,
    popupAutoSizeResetRef,
    currentContentRef,
    delay,
    closeDelay,
    orientation,
    setViewportInert,
    nested
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const {
    value: itemValue
  } = (0, _NavigationMenuItemContext.useNavigationMenuItemContext)();
  const nodeId = (0, _NavigationMenuRootContext.useNavigationMenuTreeContext)();
  const tree = (0, _floatingUiReact.useFloatingTree)();
  const dismissProps = (0, _NavigationMenuDismissContext.useNavigationMenuDismissContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const stickIfOpenTimeout = (0, _useTimeout.useTimeout)();
  const mutationFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const resizeFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const sizeFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const [triggerElement, setTriggerElement] = React.useState(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const [pointerType, setPointerType] = React.useState('');
  const triggerElementRef = React.useRef(null);
  const prevSizeRef = React.useRef(DEFAULT_SIZE);
  const skipAutoSizeSyncRef = React.useRef(false);
  const isActiveItem = open && value === itemValue;
  const isActiveItemRef = (0, _useValueAsRef.useValueAsRef)(isActiveItem);
  const interactionsEnabled = (positionerElement != null || value == null) && !disabled;
  const hoverFloatingElement = positionerElement || viewportElement;
  const hoverInteractionsEnabled = (hoverFloatingElement != null || value == null) && !disabled;
  const runOnceAnimationsFinish = (0, _useAnimationsFinished.useAnimationsFinished)(popupElement);
  const handleTriggerElement = React.useCallback(element => {
    triggerElementRef.current = element;
    setTriggerElement(element);
  }, []);
  const cancelAutoSizeReset = (0, _useStableCallback.useStableCallback)((force = false) => {
    if (!force && popupAutoSizeResetRef.current.owner !== itemValue) {
      return;
    }
    popupAutoSizeResetRef.current.abortController?.abort();
    popupAutoSizeResetRef.current.abortController = null;
    popupAutoSizeResetRef.current.owner = null;
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (isActiveItem) {
      return;
    }
    mutationFrame.cancel();
    sizeFrame.cancel();
    cancelAutoSizeReset();
  }, [isActiveItem, mutationFrame, sizeFrame, cancelAutoSizeReset]);
  function setAutoSizes(element) {
    element.style.setProperty(NavigationMenuPopupCssVars.popupWidth, 'auto');
    element.style.setProperty(NavigationMenuPopupCssVars.popupHeight, 'auto');
  }
  function clearFixedSizes(popup, positioner) {
    popup.style.removeProperty(NavigationMenuPopupCssVars.popupWidth);
    popup.style.removeProperty(NavigationMenuPopupCssVars.popupHeight);
    positioner.style.removeProperty(NavigationMenuPositionerCssVars.positionerWidth);
    positioner.style.removeProperty(NavigationMenuPositionerCssVars.positionerHeight);
  }
  function scheduleAutoSizeReset(popup) {
    cancelAutoSizeReset(true);
    const abortController = new AbortController();
    popupAutoSizeResetRef.current.abortController = abortController;
    popupAutoSizeResetRef.current.owner = itemValue;
    runOnceAnimationsFinish(() => {
      popupAutoSizeResetRef.current.abortController = null;
      popupAutoSizeResetRef.current.owner = null;
      setAutoSizes(popup);
    }, abortController.signal);
  }
  const handleValueChange = (0, _useStableCallback.useStableCallback)((popup, positioner, currentWidth, currentHeight) => {
    cancelAutoSizeReset(true);
    clearFixedSizes(popup, positioner);
    const {
      width,
      height
    } = (0, _getCssDimensions.getCssDimensions)(popup);
    const measuredWidth = width || prevSizeRef.current.width;
    const measuredHeight = height || prevSizeRef.current.height;
    if (currentHeight === 0 || currentWidth === 0) {
      currentWidth = measuredWidth;
      currentHeight = measuredHeight;
    }
    popup.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${currentWidth}px`);
    popup.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${currentHeight}px`);
    positioner.style.setProperty(NavigationMenuPositionerCssVars.positionerWidth, `${measuredWidth}px`);
    positioner.style.setProperty(NavigationMenuPositionerCssVars.positionerHeight, `${measuredHeight}px`);
    sizeFrame.request(() => {
      if (!isActiveItemRef.current) {
        return;
      }
      popup.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${measuredWidth}px`);
      popup.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${measuredHeight}px`);
      scheduleAutoSizeReset(popup);
    });
  });
  const handleInterruptedMutationResize = (0, _useStableCallback.useStableCallback)((popup, positioner, currentWidth, currentHeight) => {
    sizeFrame.cancel();
    mutationFrame.cancel();
    cancelAutoSizeReset(true);
    if (currentWidth === 0 || currentHeight === 0) {
      return;
    }
    (0, _setSharedFixedSize.setSharedFixedSize)(popup, positioner, currentWidth, currentHeight);
    mutationFrame.request(() => {
      mutationFrame.request(() => {
        clearFixedSizes(popup, positioner);
        const {
          width,
          height
        } = (0, _getCssDimensions.getCssDimensions)(popup);
        const measuredWidth = width || currentWidth;
        const measuredHeight = height || currentHeight;
        (0, _setSharedFixedSize.setSharedFixedSize)(popup, positioner, currentWidth, currentHeight);
        sizeFrame.request(() => {
          if (!isActiveItemRef.current) {
            return;
          }
          (0, _setSharedFixedSize.setSharedFixedSize)(popup, positioner, measuredWidth, measuredHeight);
          scheduleAutoSizeReset(popup);
        });
      });
    });
  });
  const syncCurrentSize = (0, _useStableCallback.useStableCallback)((popup, positioner) => {
    sizeFrame.cancel();
    cancelAutoSizeReset(true);
    clearFixedSizes(popup, positioner);
    const {
      width,
      height
    } = (0, _getCssDimensions.getCssDimensions)(popup);
    if (width === 0 || height === 0) {
      return;
    }
    prevSizeRef.current = {
      width,
      height
    };
    setAutoSizes(popup);
    positioner.style.setProperty(NavigationMenuPositionerCssVars.positionerWidth, `${width}px`);
    positioner.style.setProperty(NavigationMenuPositionerCssVars.positionerHeight, `${height}px`);
  });
  const getMutationBaseline = (0, _useStableCallback.useStableCallback)(popup => {
    const popupWidth = popup.style.getPropertyValue(NavigationMenuPopupCssVars.popupWidth);
    const popupHeight = popup.style.getPropertyValue(NavigationMenuPopupCssVars.popupHeight);
    const isResizing = popupWidth !== '' && popupWidth !== 'auto' && popupHeight !== '' && popupHeight !== 'auto';
    if (!isResizing) {
      return {
        size: prevSizeRef.current,
        syncPositioner: false
      };
    }
    return {
      size: {
        width: popup.offsetWidth || prevSizeRef.current.width,
        height: popup.offsetHeight || prevSizeRef.current.height
      },
      syncPositioner: true
    };
  });
  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
      mutationFrame.cancel();
      resizeFrame.cancel();
      sizeFrame.cancel();
      cancelAutoSizeReset(true);
      skipAutoSizeSyncRef.current = false;
      setPointerType('');
    }
  }, [stickIfOpenTimeout, open, mutationFrame, resizeFrame, sizeFrame, cancelAutoSizeReset]);
  React.useEffect(() => {
    if (!mounted) {
      prevSizeRef.current = DEFAULT_SIZE;
    }
  }, [mounted]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!popupElement || typeof ResizeObserver !== 'function') {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(() => {
      prevSizeRef.current = {
        width: popupElement.offsetWidth,
        height: popupElement.offsetHeight
      };
    });
    resizeObserver.observe(popupElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [popupElement]);
  React.useEffect(() => {
    if (!open || !isActiveItem || !popupElement || !positionerElement) {
      return undefined;
    }
    const popup = popupElement;
    const positioner = positionerElement;
    const win = (0, _owner.ownerWindow)(positioner);
    function handleResize() {
      resizeFrame.cancel();
      resizeFrame.request(() => syncCurrentSize(popup, positioner));
    }
    const unsubscribe = (0, _addEventListener.addEventListener)(win, 'resize', handleResize);
    return () => {
      resizeFrame.cancel();
      unsubscribe();
    };
  }, [open, isActiveItem, popupElement, positionerElement, resizeFrame, syncCurrentSize]);
  React.useEffect(() => {
    const observedElement = currentContentRef.current;
    if (!observedElement || !popupElement || !positionerElement || !isActiveItem || typeof MutationObserver !== 'function') {
      return undefined;
    }
    const mutationObserver = new MutationObserver(() => {
      if (transitionStatus === 'starting' || popupElement.hasAttribute(_stateAttributesMapping.TransitionStatusDataAttributes.startingStyle)) {
        syncCurrentSize(popupElement, positionerElement);
        return;
      }
      const {
        size,
        syncPositioner
      } = getMutationBaseline(popupElement);
      if (syncPositioner) {
        handleInterruptedMutationResize(popupElement, positionerElement, size.width, size.height);
        return;
      }
      handleValueChange(popupElement, positionerElement, size.width, size.height);
    });
    mutationObserver.observe(observedElement, {
      childList: true,
      subtree: true,
      characterData: true,
      // `keepMounted` submenu switches update dimensions by toggling hidden
      // content rather than inserting or removing content nodes.
      attributes: true,
      attributeFilter: ['hidden']
    });
    return () => {
      mutationObserver.disconnect();
    };
  }, [currentContentRef, popupElement, positionerElement, isActiveItem, transitionStatus, getMutationBaseline, handleInterruptedMutationResize, handleValueChange, syncCurrentSize]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (isActiveItemRef.current && open && popupElement && positionerElement) {
      if (skipAutoSizeSyncRef.current) {
        skipAutoSizeSyncRef.current = false;
        return undefined;
      }
      const {
        width,
        height
      } = (0, _getCssDimensions.getCssDimensions)(popupElement);
      handleValueChange(popupElement, positionerElement, width, height);
    }
    return undefined;
  }, [currentContentRef, handleValueChange, isActiveItemRef, open, popupElement, positionerElement, transitionStatus]);
  function handleOpenChange(nextOpen, eventDetails) {
    const isHover = eventDetails.reason === _reasons.REASONS.triggerHover;
    if (!interactionsEnabled) {
      return;
    }
    if (pointerType === 'touch' && isHover) {
      return;
    }
    if (!nextOpen && value !== itemValue) {
      return;
    }
    function changeState() {
      if (isHover) {
        // Only allow "patient" clicks to close the popup if it's open.
        // If they clicked within 500ms of the popup opening, keep it open.
        setStickIfOpen(true);
        stickIfOpenTimeout.clear();
        stickIfOpenTimeout.start(_constants.PATIENT_CLICK_THRESHOLD, () => {
          setStickIfOpen(false);
        });
      }
      if (nextOpen) {
        setValue(itemValue, eventDetails);
      } else {
        setValue(null, eventDetails);
        setPointerType('');
      }
    }
    if (isHover) {
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
  }
  const context = (0, _floatingUiReact.useFloatingRootContext)({
    open,
    onOpenChange: handleOpenChange,
    elements: {
      reference: triggerElement,
      floating: hoverFloatingElement
    }
  });
  const hoverInteractionState = (0, _useHoverInteractionSharedState.useHoverInteractionSharedState)(context);
  const shouldBlockSafePolygonPointerEvents = pointerType !== 'touch';
  React.useEffect(() => {
    if (!open) {
      context.context.dataRef.current.openEvent = undefined;
      hoverInteractionState.pointerType = undefined;
      hoverInteractionState.interactedInside = false;
      hoverInteractionState.restTimeoutPending = false;
      hoverInteractionState.openChangeTimeout.clear();
      hoverInteractionState.restTimeout.clear();
    }
    return () => {
      (0, _useHoverInteractionSharedState.clearSafePolygonPointerEventsMutation)(hoverInteractionState);
    };
  }, [context, hoverInteractionState, open]);
  const getInlineHandleCloseContext = (0, _useStableCallback.useStableCallback)(() => {
    if (!nested || positionerElement || !triggerElementRef.current || !hoverFloatingElement) {
      return null;
    }
    return getHandleCloseContext(triggerElementRef.current, hoverFloatingElement, nodeId);
  });
  function getScope() {
    if (nested && positionerElement) {
      return null;
    }
    return triggerElementRef.current?.closest('ul') ?? null;
  }
  const hoverProps = (0, _floatingUiReact.useHoverReferenceInteraction)(context, {
    enabled: hoverInteractionsEnabled,
    move: false,
    handleClose: (0, _floatingUiReact.safePolygon)({
      blockPointerEvents: shouldBlockSafePolygonPointerEvents,
      getScope
    }),
    restMs: mounted && positionerElement ? 0 : delay,
    delay: {
      close: closeDelay
    },
    triggerElementRef,
    getHandleCloseContext: getInlineHandleCloseContext
  });
  const hover = React.useMemo(() => hoverProps ? {
    reference: hoverProps
  } : undefined, [hoverProps]);
  const click = (0, _floatingUiReact.useClick)(context, {
    enabled: interactionsEnabled,
    stickIfOpen,
    toggle: isActiveItem
  });
  const referenceProps = React.useMemo(() => (0, _mergeProps.mergeProps)(click.reference, hover?.reference), [click.reference, hover]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (isActiveItem) {
      setFloatingRootContext(context);
      prevTriggerElementRef.current = triggerElement;
    }
  }, [isActiveItem, context, setFloatingRootContext, prevTriggerElementRef, triggerElement]);
  function handleActivation(event) {
    ReactDOM.flushSync(() => {
      const currentTarget = event.currentTarget;
      const prevTriggerRect = prevTriggerElementRef.current?.getBoundingClientRect();
      if (mounted && prevTriggerRect && triggerElement) {
        const nextTriggerRect = triggerElement.getBoundingClientRect();
        const isMovingRight = nextTriggerRect.left > prevTriggerRect.left;
        const isMovingDown = nextTriggerRect.top > prevTriggerRect.top;
        if (orientation === 'horizontal' && nextTriggerRect.left !== prevTriggerRect.left) {
          setActivationDirection(isMovingRight ? 'right' : 'left');
        } else if (orientation === 'vertical' && nextTriggerRect.top !== prevTriggerRect.top) {
          setActivationDirection(isMovingDown ? 'down' : 'up');
        }
      }

      // Reset the `openEvent` to `undefined` when the active item changes so that a
      // `click` -> `hover` on new trigger -> `hover` back to old trigger doesn't unexpectedly
      // cause the popup to remain stuck open when leaving the old trigger.
      if (event.type !== 'click' && value != null) {
        context.context.dataRef.current.openEvent = undefined;
      }
      if (pointerType === 'touch' && event.type !== 'click') {
        return;
      }

      // Keyboard open events reach this activation path after `onKeyDown` has already set
      // the value with the `listNavigation` reason.
      if (value != null && event.type !== 'keydown') {
        setValue(itemValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(event.type === 'mouseenter' ? _reasons.REASONS.triggerHover : _reasons.REASONS.triggerPress, event.nativeEvent));
      }
      if (event.type === 'mouseenter' && shouldBlockSafePolygonPointerEvents && (!nested || !positionerElement) && hoverFloatingElement) {
        const applyPointerEventsMutation = () => {
          const scopeElement = getScope() ?? currentTarget.ownerDocument.body;
          (0, _useHoverInteractionSharedState.applySafePolygonPointerEventsMutation)(hoverInteractionState, {
            scopeElement,
            referenceElement: currentTarget,
            floatingElement: hoverFloatingElement
          });
        };
        if (value != null && value !== itemValue) {
          queueMicrotask(applyPointerEventsMutation);
        } else {
          applyPointerEventsMutation();
        }
      }
    });
  }
  const handleOpenEvent = (0, _useStableCallback.useStableCallback)(event => {
    if (disabled) {
      return;
    }
    if (!popupElement || !positionerElement) {
      handleActivation(event);
      return;
    }
    const {
      width,
      height
    } = (0, _getCssDimensions.getCssDimensions)(popupElement);
    const shouldSkipAutoSizeSync = value != null && value !== itemValue && (event.type === 'click' || pointerType !== 'touch');
    handleActivation(event);
    if (shouldSkipAutoSizeSync) {
      skipAutoSizeSyncRef.current = true;
    }
    handleValueChange(popupElement, positionerElement, width, height);
  });
  const state = {
    open: isActiveItem,
    disabled
  };
  function handleSetPointerType(event) {
    setPointerType(event.pointerType);
  }
  function handleTriggerPointerDown(event) {
    handleSetPointerType(event);
    (0, _useHoverInteractionSharedState.clearSafePolygonPointerEventsMutation)(hoverInteractionState);
  }
  const defaultProps = {
    tabIndex: 0,
    onMouseEnter: handleOpenEvent,
    onClick: handleOpenEvent,
    onPointerEnter: handleSetPointerType,
    onPointerDown: handleTriggerPointerDown,
    'aria-expanded': isActiveItem,
    'aria-controls': isActiveItem ? popupElement?.id : undefined,
    [_constants2.NAVIGATION_MENU_TRIGGER_IDENTIFIER]: '',
    onFocus() {
      if (!isActiveItem) {
        return;
      }
      setViewportInert(false);
    },
    onMouseLeave() {
      if (value == null) {
        (0, _useHoverInteractionSharedState.clearSafePolygonPointerEventsMutation)(hoverInteractionState);
      }
    },
    onKeyDown(event) {
      // For nested (submenu) triggers, don't intercept arrow keys that are used for
      // navigation in the parent content. The arrow keys should be handled by the
      // parent's CompositeRoot for navigating between items.
      if (nested) {
        return;
      }
      const verticalOpenKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const openHorizontal = orientation === 'horizontal' && event.key === 'ArrowDown';
      const openVertical = orientation === 'vertical' && event.key === verticalOpenKey;
      if (openHorizontal || openVertical) {
        setValue(itemValue, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.listNavigation, event.nativeEvent));
        handleOpenEvent(event);
        (0, _utils.stopEvent)(event);
      }
    },
    onBlur(event) {
      if (positionerElement && popupElement && (0, _isOutsideMenuEvent.isOutsideMenuEvent)({
        currentTarget: event.currentTarget,
        relatedTarget: event.relatedTarget
      }, {
        popupElement,
        rootRef,
        tree,
        nodeId
      })) {
        setValue(null, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event.nativeEvent));
      }
    }
  };
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton
  });
  const referenceElement = hoverFloatingElement;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
      tag: "button",
      render: render,
      className: className,
      style: style,
      state: state,
      stateAttributesMapping: _popupStateMapping.pressableTriggerOpenStateMapping,
      refs: [forwardedRef, handleTriggerElement, buttonRef],
      props: [referenceProps, dismissProps?.reference || _empty.EMPTY_ARRAY, defaultProps, elementProps, getButtonProps]
    }), isActiveItem && /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
        ref: beforeOutsideRef,
        onFocus: event => {
          if (referenceElement && (0, _utils.isOutsideEvent)(event, referenceElement)) {
            beforeInsideRef.current?.focus();
          } else {
            const prevTabbable = (0, _utils.getPreviousTabbable)(triggerElement);
            prevTabbable?.focus();
          }
        }
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        "aria-owns": viewportElement?.id,
        style: _constants.ownerVisuallyHidden
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_FocusGuard.FocusGuard, {
        ref: afterOutsideRef,
        onFocus: event => {
          if (referenceElement && (0, _utils.isOutsideEvent)(event, referenceElement)) {
            ReactDOM.flushSync(() => {
              setViewportInert(false);
            });
            const elementToFocus = afterInsideRef.current || triggerElement;
            elementToFocus?.focus();
          } else {
            let nextTabbable = (0, _utils.getNextTabbable)(triggerElement);
            if (nested && !positionerElement && referenceElement && nextTabbable && (0, _utils.contains)(referenceElement, nextTabbable)) {
              nextTabbable = (0, _utils.getTabbableAfterElement)(afterInsideRef.current);
            }
            nextTabbable?.focus();
            if ((!nested || positionerElement) && !(0, _utils.contains)(rootRef.current, nextTabbable)) {
              setValue(null, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event.nativeEvent));
            }
          }
        }
      })]
    })]
  });
});
if (process.env.NODE_ENV !== "production") NavigationMenuTrigger.displayName = "NavigationMenuTrigger";
function getPlacementFromElements(domReferenceElement, floatingElement) {
  const referenceRect = domReferenceElement.getBoundingClientRect();
  const floatingRect = floatingElement.getBoundingClientRect();
  const referenceCenterX = referenceRect.left + referenceRect.width / 2;
  const referenceCenterY = referenceRect.top + referenceRect.height / 2;
  const floatingCenterX = floatingRect.left + floatingRect.width / 2;
  const floatingCenterY = floatingRect.top + floatingRect.height / 2;
  const deltaX = floatingCenterX - referenceCenterX;
  const deltaY = floatingCenterY - referenceCenterY;
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? 'right' : 'left';
  }
  return deltaY >= 0 ? 'bottom' : 'top';
}
function getHandleCloseContext(domReferenceElement, floatingElement, nodeId) {
  return {
    placement: getPlacementFromElements(domReferenceElement, floatingElement),
    elements: {
      domReference: domReferenceElement,
      floating: floatingElement
    },
    nodeId
  };
}