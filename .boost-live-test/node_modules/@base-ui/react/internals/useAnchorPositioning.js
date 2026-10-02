"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useAnchorPositioning = useAnchorPositioning;
exports.useAnchorPositioningWithHook = useAnchorPositioningWithHook;
var React = _interopRequireWildcard(require("react"));
var _utils = require("@floating-ui/utils");
var _owner = require("@base-ui/utils/owner");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _floatingUiReact = require("../floating-ui-react");
var _useFloating = require("../floating-ui-react/hooks/useFloating");
var _DirectionContext = require("./direction-context/DirectionContext");
var _arrow = require("../floating-ui-react/middleware/arrow");
var _hideMiddleware = require("../utils/hideMiddleware");
var _adaptiveOriginConstants = require("../utils/adaptiveOriginConstants");
var CommonPositionerCssVars = _interopRequireWildcard(require("../utils/CommonPositionerCssVars"));
const AVAILABLE_WIDTH_VAR = CommonPositionerCssVars.availableWidth;
const AVAILABLE_HEIGHT_VAR = CommonPositionerCssVars.availableHeight;
function getLogicalSide(sideParam, renderedSide, isRtl) {
  const isLogicalSideParam = sideParam === 'inline-start' || sideParam === 'inline-end';
  const logicalRight = isRtl ? 'inline-start' : 'inline-end';
  const logicalLeft = isRtl ? 'inline-end' : 'inline-start';
  return {
    top: 'top',
    right: isLogicalSideParam ? logicalRight : 'right',
    bottom: 'bottom',
    left: isLogicalSideParam ? logicalLeft : 'left'
  }[renderedSide];
}
function getOffsetData(state, sideParam, isRtl) {
  const {
    rects,
    placement
  } = state;
  const data = {
    side: getLogicalSide(sideParam, (0, _utils.getSide)(placement), isRtl),
    align: (0, _utils.getAlignment)(placement) || 'center',
    anchor: {
      width: rects.reference.width,
      height: rects.reference.height
    },
    positioner: {
      width: rects.floating.width,
      height: rects.floating.height
    }
  };
  return data;
}
/**
 * Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
 * `useFloating` hook.
 */
function useAnchorPositioning(params) {
  return useAnchorPositioningWithHook(params, _useFloating.useBaseUIFloating);
}
function useAnchorPositioningWithHook(params, useFloatingHook) {
  const {
    // Public parameters
    anchor,
    positionMethod = 'absolute',
    side: sideParam = 'bottom',
    sideOffset = 0,
    align = 'center',
    alignOffset = 0,
    collisionBoundary,
    collisionPadding: collisionPaddingParam = 5,
    sticky = false,
    arrowPadding = 5,
    disableAnchorTracking = false,
    inline: inlineMiddleware,
    // Private parameters
    keepMounted = false,
    floatingRootContext,
    mounted,
    collisionAvoidance,
    shift,
    nodeId,
    adaptiveOrigin,
    lazyFlip = false,
    externalTree
  } = params;
  const [mountSide, setMountSide] = React.useState(null);
  if (!mounted && mountSide !== null) {
    setMountSide(null);
  }
  const collisionAvoidanceSide = collisionAvoidance.side || 'flip';
  const collisionAvoidanceAlign = collisionAvoidance.align || 'flip';
  const collisionAvoidanceFallbackAxisSide = collisionAvoidance.fallbackAxisSide || 'end';
  const shiftCrossAxis = shift?.crossAxis ?? false;
  const shiftRootBoundary = shift?.rootBoundary;
  const anchorFn = typeof anchor === 'function' ? anchor : undefined;
  const anchorFnCallback = (0, _useStableCallback.useStableCallback)(anchorFn);
  const anchorDep = anchorFn ? anchorFnCallback : anchor;
  const anchorValueRef = (0, _useValueAsRef.useValueAsRef)(anchor);
  const mountedRef = (0, _useValueAsRef.useValueAsRef)(mounted);
  const direction = (0, _DirectionContext.useDirection)();
  const isRtl = direction === 'rtl';
  const side = mountSide || {
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    'inline-end': isRtl ? 'left' : 'right',
    'inline-start': isRtl ? 'right' : 'left'
  }[sideParam];
  const placement = align === 'center' ? side : `${side}-${align}`;
  let collisionPadding = collisionPaddingParam;
  if (typeof collisionPadding === 'number') {
    collisionPadding = {
      top: collisionPadding,
      right: collisionPadding,
      bottom: collisionPadding,
      left: collisionPadding
    };
  } else if (collisionPadding) {
    collisionPadding = {
      top: collisionPadding.top || 0,
      right: collisionPadding.right || 0,
      bottom: collisionPadding.bottom || 0,
      left: collisionPadding.left || 0
    };
  }

  // Create a bias to the preferred side.
  // On iOS, when the mobile software keyboard opens, the input is exactly centered
  // in the viewport, but this can cause it to flip to the top undesirably.
  // The bias is only applied to `flip()` so it doesn't shift the resting position
  // computed by `shift()` and `size()` away from the requested `collisionPadding`.
  const bias = 1;
  const biasTop = sideParam === 'bottom' ? bias : 0;
  const biasBottom = sideParam === 'top' ? bias : 0;
  const biasLeft = sideParam === 'right' ? bias : 0;
  const biasRight = sideParam === 'left' ? bias : 0;
  const commonCollisionProps = {
    boundary: collisionBoundary === 'clipping-ancestors' ? 'clippingAncestors' : collisionBoundary,
    padding: collisionPadding
  };

  // Using a ref assumes that the arrow element is always present in the DOM for the lifetime of the
  // popup. If this assumption ends up being false, we can switch to state to manage the arrow's
  // presence.
  const arrowRef = React.useRef(null);

  // Keep these reactive if they're not functions
  const sideOffsetRef = (0, _useValueAsRef.useValueAsRef)(sideOffset);
  const alignOffsetRef = (0, _useValueAsRef.useValueAsRef)(alignOffset);
  const sideOffsetDep = typeof sideOffset !== 'function' ? sideOffset : 0;
  const alignOffsetDep = typeof alignOffset !== 'function' ? alignOffset : 0;
  const middleware = [];
  if (inlineMiddleware) {
    middleware.push(inlineMiddleware);
  }
  middleware.push((0, _floatingUiReact.offset)(state => {
    const data = getOffsetData(state, sideParam, isRtl);
    const sideAxis = typeof sideOffsetRef.current === 'function' ? sideOffsetRef.current(data) : sideOffsetRef.current;
    const alignAxis = typeof alignOffsetRef.current === 'function' ? alignOffsetRef.current(data) : alignOffsetRef.current;
    return {
      mainAxis: sideAxis,
      crossAxis: alignAxis,
      alignmentAxis: alignAxis
    };
  }, [sideOffsetDep, alignOffsetDep, isRtl, sideParam]));
  const shiftDisabled = collisionAvoidanceAlign === 'none' && collisionAvoidanceSide !== 'shift';
  const crossAxisShiftEnabled = !shiftDisabled && (sticky || shiftCrossAxis || collisionAvoidanceSide === 'shift');
  const flipMiddleware = collisionAvoidanceSide === 'none' ? null : (0, _floatingUiReact.flip)({
    ...commonCollisionProps,
    // Ensure the popup flips if it's been limited by its --available-height and it resizes.
    // Since the size() padding is smaller than the flip() padding, flip() will take precedence.
    padding: {
      top: collisionPadding.top + bias + biasTop,
      right: collisionPadding.right + bias + biasRight,
      bottom: collisionPadding.bottom + bias + biasBottom,
      left: collisionPadding.left + bias + biasLeft
    },
    mainAxis: !shiftCrossAxis && collisionAvoidanceSide === 'flip',
    crossAxis: collisionAvoidanceAlign === 'flip' ? 'alignment' : false,
    fallbackAxisSideDirection: collisionAvoidanceFallbackAxisSide
  });
  const shiftMiddleware = shiftDisabled ? null : (0, _floatingUiReact.shift)({
    ...commonCollisionProps,
    // Use the Layout Viewport to avoid shifting around when pinch-zooming.
    rootBoundary: shiftRootBoundary,
    mainAxis: collisionAvoidanceAlign !== 'none',
    crossAxis: crossAxisShiftEnabled,
    limiter: sticky || shiftCrossAxis ? undefined : (0, _floatingUiReact.limitShift)(limitData => {
      if (!arrowRef.current) {
        return {};
      }
      const {
        width,
        height
      } = arrowRef.current.getBoundingClientRect();
      const sideAxis = (0, _utils.getSideAxis)((0, _utils.getSide)(limitData.placement));
      const arrowSize = sideAxis === 'y' ? width : height;
      const offsetAmount = sideAxis === 'y' ? collisionPadding.left + collisionPadding.right : collisionPadding.top + collisionPadding.bottom;
      return {
        offset: arrowSize / 2 + offsetAmount / 2
      };
    })
  }, [commonCollisionProps, sticky, shiftCrossAxis, shiftRootBoundary, collisionPadding, collisionAvoidanceAlign]);

  // https://floating-ui.com/docs/flip#combining-with-shift
  if (collisionAvoidanceSide === 'shift' || collisionAvoidanceAlign === 'shift' || align === 'center') {
    middleware.push(shiftMiddleware, flipMiddleware);
  } else {
    middleware.push(flipMiddleware, shiftMiddleware);
  }
  middleware.push((0, _floatingUiReact.size)({
    ...commonCollisionProps,
    apply({
      elements: {
        floating
      },
      availableWidth,
      availableHeight,
      rects
    }) {
      if (!mountedRef.current) {
        return;
      }
      const floatingStyle = floating.style;
      floatingStyle.setProperty(AVAILABLE_WIDTH_VAR, `${availableWidth}px`);
      floatingStyle.setProperty(AVAILABLE_HEIGHT_VAR, `${availableHeight}px`);

      // Snap anchor dimensions to device pixels to ensure the popup's visual width matches the anchor's one.
      const dpr = (0, _owner.ownerWindow)(floating).devicePixelRatio || 1;
      const {
        x,
        y,
        width,
        height
      } = rects.reference;
      const anchorWidth = (Math.round((x + width) * dpr) - Math.round(x * dpr)) / dpr;
      const anchorHeight = (Math.round((y + height) * dpr) - Math.round(y * dpr)) / dpr;
      floatingStyle.setProperty(CommonPositionerCssVars.anchorWidth, `${anchorWidth}px`);
      floatingStyle.setProperty(CommonPositionerCssVars.anchorHeight, `${anchorHeight}px`);
    }
  }), (0, _arrow.arrow)(state => ({
    // `transform-origin` calculations rely on an element existing. If the arrow hasn't been set,
    // we'll create a fake element.
    element: arrowRef.current || (0, _owner.ownerDocument)(state.elements.floating).createElement('div'),
    // No padding for the fake arrow: it would displace aligned popups on narrow anchors.
    padding: arrowRef.current ? arrowPadding : 0,
    offsetParent: 'floating'
  }), [arrowPadding]), {
    name: 'transformOrigin',
    fn(state) {
      const {
        elements: {
          floating
        },
        middlewareData,
        placement: renderedPlacement,
        platform,
        rects,
        y
      } = state;
      const renderedSide = (0, _utils.getSide)(renderedPlacement);
      const renderedAlign = (0, _utils.getAlignment)(renderedPlacement);
      const isVertical = (0, _utils.getSideAxis)(renderedSide) === 'y';
      const arrowEl = arrowRef.current;
      const sideOffsetValue = typeof sideOffset === 'function' ? sideOffset(getOffsetData(state, sideParam, isRtl)) : sideOffset;

      // An aligned arrowless popup grows from its aligned edge, until a shift (beyond subpixel)
      // breaks its alignment with the anchor. Everything else grows from the arrow, real or fake.
      let crossOrigin;
      if (!arrowEl && renderedAlign && Math.abs(isVertical ? middlewareData.shift?.x || 0 : middlewareData.shift?.y || 0) <= 1) {
        // The platform direction, not `isRtl`: it must match what Floating UI placed with.
        crossOrigin = renderedAlign === 'start' === (isVertical && platform.isRTL?.(floating) === true) ? '100%' : '0%';
      } else {
        const arrowOffset = isVertical ? middlewareData.arrow?.x || 0 : middlewareData.arrow?.y || 0;
        const arrowSize = isVertical ? arrowEl?.clientWidth || 0 : arrowEl?.clientHeight || 0;
        crossOrigin = `${arrowOffset + arrowSize / 2}px`;
      }

      // Side axis: the anchor-facing edge, or the anchor's center when the popup overlaps it.
      let sideOrigin = renderedSide === 'top' || renderedSide === 'left' ? `calc(100% + ${sideOffsetValue}px)` : `${-sideOffsetValue}px`;
      if (crossAxisShiftEnabled && isVertical && Math.abs(middlewareData.shift?.y || 0) > sideOffsetValue) {
        sideOrigin = `${rects.reference.y + rects.reference.height / 2 - y}px`;
      }
      floating.style.setProperty(CommonPositionerCssVars.transformOrigin, isVertical ? `${crossOrigin} ${sideOrigin}` : `${sideOrigin} ${crossOrigin}`);
      return {};
    }
  }, _hideMiddleware.hide, adaptiveOrigin);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // Ensure positioning doesn't run initially for `keepMounted` elements that
    // aren't initially open.
    if (!mounted && floatingRootContext) {
      floatingRootContext.update({
        referenceElement: null,
        floatingElement: null,
        domReferenceElement: null,
        positionReference: null
      });
    }
  }, [mounted, floatingRootContext]);
  const autoUpdateOptions = React.useMemo(() => ({
    ancestorScroll: !disableAnchorTracking,
    elementResize: !disableAnchorTracking && typeof ResizeObserver !== 'undefined',
    layoutShift: !disableAnchorTracking && typeof IntersectionObserver !== 'undefined'
  }), [disableAnchorTracking]);
  const {
    refs,
    elements,
    x,
    y,
    middlewareData,
    update,
    placement: renderedPlacement,
    context,
    isPositioned,
    floatingStyles: originalFloatingStyles
  } = useFloatingHook({
    rootContext: floatingRootContext,
    open: keepMounted ? mounted : undefined,
    placement,
    middleware,
    strategy: positionMethod,
    whileElementsMounted: keepMounted ? undefined : (...args) => (0, _floatingUiReact.autoUpdate)(...args, autoUpdateOptions),
    nodeId,
    externalTree
  });
  const {
    sideX,
    sideY
  } = middlewareData.adaptiveOrigin || _adaptiveOriginConstants.DEFAULT_SIDES;

  // Default to `fixed` when not positioned to prevent `autoFocus` scroll jumps.
  // This ensures the popup is inside the viewport initially before it gets positioned.
  const resolvedPosition = isPositioned ? positionMethod : 'fixed';
  const floatingStyles = React.useMemo(() => {
    let base;
    if (!isPositioned) {
      // Until a position for the current open is computed, ignore any coordinates retained from a
      // previous open (or from a pass that measured the hidden popup as 0x0). Rendering the
      // full-size popup at such stale coordinates can overflow the layout viewport, which makes
      // mobile Chrome zoom the page out and reflow everything the popup is anchored to.
      base = {
        position: resolvedPosition,
        top: 0,
        left: 0
      };
    } else if (adaptiveOrigin) {
      base = {
        position: resolvedPosition,
        [sideX]: x,
        [sideY]: y
      };
    } else {
      base = {
        ...originalFloatingStyles,
        position: resolvedPosition
      };
    }

    // Seed the available size vars so consumer `max-height: min(x, var(--available-height))` rules
    // resolve to a valid length on the first positioning pass, before `size()` writes the real
    // values. Without a fallback the unresolved `var()` invalidates the whole declaration, so the
    // popup is measured unconstrained while `flip()` picks its side, against the full content
    // height rather than the capped one. Seeded unconditionally (not only while `!isPositioned`):
    // the keys must stay present with a constant value so React's per-property style diff never
    // rewrites them after mount, preserving the px values `size()` sets imperatively. Moving them
    // into the `!isPositioned` branch makes React remove them once positioned, wiping `size()`'s
    // values and leaving the popup unconstrained.
    base[AVAILABLE_WIDTH_VAR] = '100vw';
    base[AVAILABLE_HEIGHT_VAR] = '100vh';
    if (!isPositioned) {
      base.opacity = 0;
    }
    return base;
  }, [adaptiveOrigin, resolvedPosition, sideX, x, sideY, y, originalFloatingStyles, isPositioned]);
  const registeredPositionReferenceRef = React.useRef(null);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!mounted) {
      return;
    }
    const anchorValue = anchorValueRef.current;
    const resolvedAnchor = typeof anchorValue === 'function' ? anchorValue() : anchorValue;
    const unwrappedElement = (isRef(resolvedAnchor) ? resolvedAnchor.current : resolvedAnchor) || null;
    const finalAnchor = unwrappedElement || null;
    if (finalAnchor !== registeredPositionReferenceRef.current) {
      refs.setPositionReference(finalAnchor);
      registeredPositionReferenceRef.current = finalAnchor;
    }
  }, [mounted, refs, anchorDep, anchorValueRef]);
  React.useEffect(() => {
    if (!mounted) {
      return;
    }
    const anchorValue = anchorValueRef.current;

    // Refs from parent components are set after useLayoutEffect runs and are available in useEffect.
    // Therefore, if the anchor is a ref, we need to update the position reference in useEffect.
    if (typeof anchorValue === 'function') {
      return;
    }
    if (isRef(anchorValue) && anchorValue.current !== registeredPositionReferenceRef.current) {
      refs.setPositionReference(anchorValue.current);
      registeredPositionReferenceRef.current = anchorValue.current;
    }
  }, [mounted, refs, anchorDep, anchorValueRef]);
  React.useEffect(() => {
    if (keepMounted && mounted && elements.reference && elements.floating) {
      return (0, _floatingUiReact.autoUpdate)(elements.reference, elements.floating, update, autoUpdateOptions);
    }
    return undefined;
  }, [keepMounted, mounted, elements, update, autoUpdateOptions]);
  const renderedSide = (0, _utils.getSide)(renderedPlacement);
  const logicalRenderedSide = getLogicalSide(sideParam, renderedSide, isRtl);
  const renderedAlign = (0, _utils.getAlignment)(renderedPlacement) || 'center';
  const anchorHidden = Boolean(middlewareData.hide?.referenceHidden);

  // Locks the flip (makes it "sticky") so it doesn't prefer a given placement
  // and flips back lazily, not eagerly. Ideal for filtered lists that change
  // the size of the popup dynamically to avoid unwanted flipping when typing.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (lazyFlip && mounted && isPositioned && renderedSide !== side) {
      setMountSide(renderedSide);
    }
  }, [lazyFlip, mounted, isPositioned, renderedSide, side]);
  const arrowStyles = React.useMemo(() => ({
    position: 'absolute',
    top: middlewareData.arrow?.y,
    left: middlewareData.arrow?.x
  }), [middlewareData.arrow]);
  const arrowUncentered = middlewareData.arrow?.centerOffset !== 0;
  return React.useMemo(() => ({
    positionerStyles: floatingStyles,
    arrowStyles,
    arrowRef,
    arrowUncentered,
    side: logicalRenderedSide,
    align: renderedAlign,
    physicalSide: renderedSide,
    anchorHidden,
    refs,
    context,
    isPositioned,
    update
  }), [floatingStyles, arrowStyles, arrowRef, arrowUncentered, logicalRenderedSide, renderedAlign, renderedSide, anchorHidden, refs, context, isPositioned, update]);
}
function isRef(param) {
  return param != null && 'current' in param;
}