"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectPopup = void 0;
var React = _interopRequireWildcard(require("react"));
var _utils = require("@floating-ui/utils");
var _addEventListener = require("@base-ui/utils/addEventListener");
var _platform = require("@base-ui/utils/platform");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _owner = require("@base-ui/utils/owner");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _clamp = require("@base-ui/utils/clamp");
var _floatingUiReact = require("../../floating-ui-react");
var _SelectRootContext = require("../root/SelectRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _SelectPositionerContext = require("../positioner/SelectPositionerContext");
var _styles = require("../../utils/styles");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useRenderElement = require("../../internals/useRenderElement");
var _utils2 = require("./utils");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _ToolbarRootContext = require("../../toolbar/root/ToolbarRootContext");
var _composite = require("../../internals/composite/composite");
var _getDisabledMountTransitionStyles = require("../../internals/getDisabledMountTransitionStyles");
var _scrollEdges = require("../../utils/scrollEdges");
var _CSPContext = require("../../internals/csp-context/CSPContext");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var SelectPositionerCssVars = _interopRequireWildcard(require("../positioner/SelectPositionerCssVars"));
var _jsxRuntime = require("react/jsx-runtime");
const stateAttributesMapping = {
  ..._popupStateMapping.popupStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};

/**
 * A container for the select list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectPopup = exports.SelectPopup = /*#__PURE__*/React.forwardRef(function SelectPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    finalFocus,
    ...elementProps
  } = componentProps;
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const {
    multiple,
    readOnly,
    highlightItemOnHover
  } = (0, _SelectRootContext.useSelectRootPropsContext)();
  const floatingRootContext = (0, _SelectRootContext.useSelectFloatingContext)();
  const {
    side,
    align,
    alignItemWithTriggerActive,
    isPositioned,
    setControlledAlignItemWithTrigger
  } = (0, _SelectPositionerContext.useSelectPositionerContext)();
  const insideToolbar = (0, _ToolbarRootContext.useToolbarRootContext)(true) != null;
  const direction = (0, _DirectionContext.useDirection)();
  const {
    nonce,
    disableStyleElements
  } = (0, _CSPContext.useCSPContext)();
  const id = store.useState('id');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const mounted = store.useState('mounted');
  const popupProps = store.useState('popupProps');
  const transitionStatus = store.useState('transitionStatus');
  const triggerElement = store.useState('triggerElement');
  const positionerElement = store.useState('positionerElement');
  const listElement = store.useState('listElement');
  const reachedMaxHeightRef = React.useRef(false);
  const initialPlacedRef = React.useRef(false);
  const originalPositionerStylesRef = React.useRef({});
  const scrollArrowFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const handleScroll = (0, _useStableCallback.useStableCallback)(scroller => {
    if (!positionerElement || !store.context.popupRef.current || !initialPlacedRef.current) {
      return;
    }
    const isTopPositioned = positionerElement.style.top === '0px';
    const isBottomPositioned = positionerElement.style.bottom === '0px';
    if (reachedMaxHeightRef.current || !alignItemWithTriggerActive || !isTopPositioned && !isBottomPositioned) {
      store.context.handleScrollArrowVisibility(scroller);
      return;
    }
    const scale = getScale(positionerElement);
    const currentHeight = normalizeSize(positionerElement.getBoundingClientRect().height, 'y', scale);
    const doc = (0, _owner.ownerDocument)(positionerElement);
    const win = (0, _owner.ownerWindow)(positionerElement);
    const positionerStyles = win.getComputedStyle(positionerElement);
    const marginTop = parseFloat(positionerStyles.marginTop);
    const marginBottom = parseFloat(positionerStyles.marginBottom);
    const maxPopupHeight = getMaxPopupHeight(win.getComputedStyle(store.context.popupRef.current));
    const maxAvailableHeight = Math.min(doc.documentElement.clientHeight - marginTop - marginBottom, maxPopupHeight);
    const scrollTop = scroller.scrollTop;
    const maxScrollTop = getMaxScrollTop(scroller);

    // `Infinity` requests a scroll to the recomputed maximum offset.
    let nextScrollTop = null;
    const setHeight = height => {
      positionerElement.style.height = `${height}px`;
    };
    const diff = isTopPositioned ? maxScrollTop - scrollTop : scrollTop;
    const nextHeight = Math.min(currentHeight + diff, maxAvailableHeight);
    if (diff <= _scrollEdges.SCROLL_EDGE_TOLERANCE_PX) {
      const heightDelta = (0, _clamp.clamp)(diff, 0, maxAvailableHeight - currentHeight);
      if (heightDelta > 0) {
        // Consume the remaining scroll in height.
        setHeight(currentHeight + heightDelta);
      }
      scroller.scrollTop = isTopPositioned ? maxScrollTop : 0;
      if (maxAvailableHeight - (currentHeight + heightDelta) <= _scrollEdges.SCROLL_EDGE_TOLERANCE_PX) {
        reachedMaxHeightRef.current = true;
      }
      store.context.handleScrollArrowVisibility(scroller);
      return;
    }
    if (maxAvailableHeight - nextHeight > _scrollEdges.SCROLL_EDGE_TOLERANCE_PX) {
      nextScrollTop = isTopPositioned ? Infinity : 0;
    } else if (isBottomPositioned && scrollTop < maxScrollTop) {
      const overshoot = currentHeight + diff - maxAvailableHeight;
      nextScrollTop = scrollTop - (diff - overshoot);
    }
    const nextPositionerHeight = Math.ceil(nextHeight);
    if (nextPositionerHeight !== 0) {
      setHeight(nextPositionerHeight);
    }
    if (nextScrollTop != null) {
      // Recompute bounds after resizing (clientHeight likely changed).
      const target = (0, _clamp.clamp)(nextScrollTop, 0, getMaxScrollTop(scroller));

      // Avoid adjustments that re-trigger scroll events forever.
      if (Math.abs(scroller.scrollTop - target) > _scrollEdges.SCROLL_EDGE_TOLERANCE_PX) {
        scroller.scrollTop = target;
      }
    }
    if (nextPositionerHeight >= maxAvailableHeight - _scrollEdges.SCROLL_EDGE_TOLERANCE_PX) {
      reachedMaxHeightRef.current = true;
    }
    store.context.handleScrollArrowVisibility(scroller);
  });
  React.useImperativeHandle(store.context.scrollHandlerRef, () => handleScroll, [handleScroll]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete(true);
      }
    }
  });
  const state = {
    open,
    transitionStatus,
    side,
    align
  };
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!positionerElement || !store.context.popupRef.current || Object.keys(originalPositionerStylesRef.current).length) {
      return;
    }
    originalPositionerStylesRef.current = {
      top: positionerElement.style.top || '0',
      left: positionerElement.style.left || '0',
      right: positionerElement.style.right,
      height: positionerElement.style.height,
      bottom: positionerElement.style.bottom,
      minHeight: positionerElement.style.minHeight,
      maxHeight: positionerElement.style.maxHeight,
      marginTop: positionerElement.style.marginTop,
      marginBottom: positionerElement.style.marginBottom
    };
  }, [store, positionerElement]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (open || alignItemWithTriggerActive) {
      return;
    }
    initialPlacedRef.current = false;
    reachedMaxHeightRef.current = false;
    (0, _utils2.clearStyles)(positionerElement, originalPositionerStylesRef.current);
  }, [open, alignItemWithTriggerActive, positionerElement]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const popupElement = store.context.popupRef.current;

    // Wait for Floating UI's first positioning pass before reading DOM geometry.
    // We replace the final coordinates for aligned selects, but still need middleware
    // like `size()` to set CSS variables such as `--anchor-width`.
    if (!open || !triggerElement || !positionerElement || !popupElement || alignItemWithTriggerActive && !isPositioned || store.state.transitionStatus === 'ending') {
      return;
    }
    initialPlacedRef.current = true;
    popupElement.style.removeProperty(SelectPositionerCssVars.transformOrigin);
    if (!alignItemWithTriggerActive) {
      // The wrapper supplies the scroller: the list owns scrolling once it has mounted, and
      // this effect re-runs (cancelling the stale frame) when that happens.
      scrollArrowFrame.request(() => store.context.handleScrollArrowVisibility(listElement || popupElement));
      return;
    }

    // Ensure we remove any transforms that can affect the location of the popup
    // and therefore the calculations.
    const restoreTransformStyles = unsetTransformStyles(popupElement);
    try {
      let textElement = store.context.selectedItemTextRef.current;
      if (!textElement?.isConnected) {
        const hasSelectedValue = store.select('hasSelectedValue');
        textElement = !hasSelectedValue && store.context.firstItemTextRef.current?.isConnected ? store.context.firstItemTextRef.current : null;
      }
      const valueElement = store.context.valueRef.current;
      const win = (0, _owner.ownerWindow)(positionerElement);
      const positionerStyles = win.getComputedStyle(positionerElement);
      const popupStyles = win.getComputedStyle(popupElement);
      const doc = (0, _owner.ownerDocument)(triggerElement);
      const scale = getScale(triggerElement);
      const triggerRect = normalizeRect(triggerElement.getBoundingClientRect(), scale);
      const positionerRect = normalizeRect(positionerElement.getBoundingClientRect(), scale);
      const triggerHeight = triggerRect.height;
      const scroller = listElement || popupElement;
      const scrollHeight = scroller.scrollHeight;
      const borderBottom = parseFloat(popupStyles.borderBottomWidth);
      // The `|| N` fallbacks cover an unset/`auto` value (parses to `NaN`). Note a literal `0`
      // also resolves to the fallback, so an explicit `margin: 0` or `min-height: 0` still takes
      // the default below.
      const marginTop = parseFloat(positionerStyles.marginTop) || 10;
      const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
      const minHeight = parseFloat(positionerStyles.minHeight) || 100;
      const maxPopupHeight = getMaxPopupHeight(popupStyles);
      const paddingLeft = 5;
      const paddingRight = 5;
      const triggerCollisionThreshold = 20;
      const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
      const viewportWidth = doc.documentElement.clientWidth;
      const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;
      let textRect;
      let alignedLeft = direction === 'rtl' ? triggerRect.right - positionerRect.width : triggerRect.left;
      let offsetY = 0;
      if (textElement && valueElement) {
        const valueRect = normalizeRect(valueElement.getBoundingClientRect(), scale);
        textRect = normalizeRect(textElement.getBoundingClientRect(), scale);
        alignedLeft = positionerRect.left + (direction === 'rtl' ? valueRect.right - textRect.right : valueRect.left - textRect.left);
        const valueCenterFromTriggerTop = valueRect.top - triggerRect.top + valueRect.height / 2;
        const textCenterFromPositionerTop = textRect.top - positionerRect.top + textRect.height / 2;
        offsetY = textCenterFromPositionerTop - valueCenterFromTriggerTop;
      }
      const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
      let height = Math.min(viewportHeight, idealHeight);
      const maxHeight = viewportHeight - marginTop - marginBottom;
      const scrollTop = idealHeight - height;
      const maxRight = viewportWidth - paddingRight;
      positionerElement.style.left = `${(0, _clamp.clamp)(alignedLeft, paddingLeft, maxRight - positionerRect.width)}px`;
      positionerElement.style.height = `${height}px`;
      // `none` (not the invalid `auto`) so the explicit height governs in align mode and isn't
      // clamped by a `max-height` from user CSS.
      positionerElement.style.maxHeight = 'none';
      positionerElement.style.marginTop = `${marginTop}px`;
      positionerElement.style.marginBottom = `${marginBottom}px`;
      popupElement.style.height = '100%';
      const maxScrollTop = getMaxScrollTop(scroller);
      const isTopPositioned = scrollTop >= maxScrollTop - _scrollEdges.SCROLL_EDGE_TOLERANCE_PX;
      if (isTopPositioned) {
        height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
      }

      // When the trigger is too close to the top or bottom of the viewport, or the minHeight is
      // reached, we fallback to aligning the popup to the trigger as the UX is poor otherwise.
      const fallbackToAlignPopupToTrigger = triggerRect.top < triggerCollisionThreshold || triggerRect.bottom > viewportHeight - triggerCollisionThreshold || Math.ceil(height) + _scrollEdges.SCROLL_EDGE_TOLERANCE_PX < Math.min(scrollHeight, minHeight);

      // Safari doesn't position the popup correctly when pinch-zoomed.
      const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && _platform.platform.engine.webkit;
      if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
        (0, _utils2.clearStyles)(positionerElement, originalPositionerStylesRef.current);
        setControlledAlignItemWithTrigger(false);
        return;
      }
      const initialHeight = Math.max(minHeight, height);
      if (isTopPositioned) {
        const topOffset = Math.max(0, viewportHeight - idealHeight);
        positionerElement.style.top = positionerRect.height >= maxHeight ? '0' : `${topOffset}px`;
        positionerElement.style.height = `${height}px`;
        scroller.scrollTop = getMaxScrollTop(scroller);
      } else {
        positionerElement.style.bottom = '0';
        scroller.scrollTop = scrollTop;
      }
      if (textRect) {
        const popupTop = positionerRect.top;
        const popupHeight = positionerRect.height;
        const textCenterY = textRect.top + textRect.height / 2;
        const clampedY = (0, _clamp.clamp)(popupHeight > 0 ? (textCenterY - popupTop) / popupHeight * 100 : 50, 0, 100);
        popupElement.style.setProperty(SelectPositionerCssVars.transformOrigin, `50% ${clampedY}%`);
      }
      if (initialHeight === viewportHeight || height >= maxPopupHeight) {
        reachedMaxHeightRef.current = true;
      }
      store.context.handleScrollArrowVisibility(scroller);
      if (highlightItemOnHover && store.state.selectedIndex === null && store.state.activeIndex === null && store.context.listRef.current[0] != null) {
        store.set('activeIndex', 0);
      }
    } finally {
      restoreTransformStyles();
    }
  }, [store, open, positionerElement, triggerElement, alignItemWithTriggerActive, setControlledAlignItemWithTrigger, scrollArrowFrame, listElement, highlightItemOnHover, direction, isPositioned]);
  React.useEffect(() => {
    if (!alignItemWithTriggerActive || !positionerElement || !open) {
      return undefined;
    }
    const win = (0, _owner.ownerWindow)(positionerElement);
    function handleResize(event) {
      store.context.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.windowResize, event));
    }
    return (0, _addEventListener.addEventListener)(win, 'resize', handleResize);
  }, [store, alignItemWithTriggerActive, positionerElement, open]);
  const defaultProps = {
    ...(listElement ? {
      role: 'presentation'
    } : {
      role: 'listbox',
      'aria-multiselectable': multiple || undefined,
      'aria-readonly': readOnly || undefined,
      id: `${id}-list`
    }),
    onKeyDown(event) {
      if (insideToolbar && _composite.COMPOSITE_KEYS.has(event.key)) {
        event.stopPropagation();
      }
    },
    onScroll(event) {
      if (listElement) {
        return;
      }
      handleScroll(event.currentTarget);
    },
    ...(alignItemWithTriggerActive && {
      style: listElement ? {
        height: '100%'
      } : _utils2.LIST_FUNCTIONAL_STYLES
    }),
    className: !listElement && alignItemWithTriggerActive ? _styles.styleDisableScrollbar.className : undefined
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, store.context.popupRef],
    state,
    stateAttributesMapping,
    props: [popupProps, defaultProps, (0, _getDisabledMountTransitionStyles.getDisabledMountTransitionStyles)(transitionStatus), elementProps]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
    children: [!disableStyleElements && _styles.styleDisableScrollbar.getElement(nonce), /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingFocusManager, {
      context: floatingRootContext,
      modal: false,
      disabled: !mounted,
      openInteractionType: openMethod,
      returnFocus: finalFocus,
      restoreFocus: true,
      children: element
    })]
  });
});
if (process.env.NODE_ENV !== "production") SelectPopup.displayName = "SelectPopup";
function getMaxPopupHeight(popupStyles) {
  const maxHeightStyle = popupStyles.maxHeight;
  return maxHeightStyle.endsWith('px') ? parseFloat(maxHeightStyle) || Infinity : Infinity;
}
function getMaxScrollTop(scroller) {
  return (0, _scrollEdges.getMaxScrollOffset)(scroller.scrollHeight, scroller.clientHeight);
}
function getScale(element) {
  // The platform API is async-capable, but the DOM platform returns a plain scale object.
  return _floatingUiReact.platform.getScale(element);
}
function normalizeSize(size, axis, scale) {
  return size / scale[axis];
}
function normalizeRect(rect, scale) {
  return (0, _utils.rectToClientRect)({
    x: normalizeSize(rect.x, 'x', scale),
    y: normalizeSize(rect.y, 'y', scale),
    width: normalizeSize(rect.width, 'x', scale),
    height: normalizeSize(rect.height, 'y', scale)
  });
}
const TRANSFORM_STYLE_RESETS = [['transform', 'none'], ['scale', '1'], ['translate', '0 0']];
function unsetTransformStyles(popupElement) {
  const {
    style
  } = popupElement;
  const originalStyles = {};
  for (const [property, value] of TRANSFORM_STYLE_RESETS) {
    originalStyles[property] = style.getPropertyValue(property);
    style.setProperty(property, value, 'important');
  }
  return () => {
    for (const [property] of TRANSFORM_STYLE_RESETS) {
      const originalValue = originalStyles[property];
      if (originalValue) {
        style.setProperty(property, originalValue);
      } else {
        style.removeProperty(property);
      }
    }
  };
}