"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScrollAreaViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _platform = require("@base-ui/utils/platform");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _clamp = require("@base-ui/utils/clamp");
var _ScrollAreaRootContext = require("../root/ScrollAreaRootContext");
var _ScrollAreaViewportContext = require("./ScrollAreaViewportContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _getOffset = require("../utils/getOffset");
var _constants = require("../constants");
var _styles = require("../../utils/styles");
var _stateAttributes = require("../root/stateAttributes");
var _scrollEdges = require("../../utils/scrollEdges");
var ScrollAreaViewportCssVars = _interopRequireWildcard(require("./ScrollAreaViewportCssVars"));
var ScrollAreaScrollbarCssVars = _interopRequireWildcard(require("../scrollbar/ScrollAreaScrollbarCssVars"));
var _jsxRuntime = require("react/jsx-runtime");
const OVERFLOW_EDGE_VARS = [ScrollAreaViewportCssVars.scrollAreaOverflowXStart, ScrollAreaViewportCssVars.scrollAreaOverflowXEnd, ScrollAreaViewportCssVars.scrollAreaOverflowYStart, ScrollAreaViewportCssVars.scrollAreaOverflowYEnd];

// Module-level flag to ensure we only register the CSS properties once,
// regardless of how many Scroll Area components are mounted.
let scrollAreaOverflowVarsRegistered = false;

/**
 * Removes inheritance of the scroll area overflow CSS variables, which
 * improves rendering performance in complex scroll areas with deep subtrees.
 * Instead, each child must manually opt-in to using these properties by
 * specifying `inherit`.
 * See https://motion.dev/blog/web-animation-performance-tier-list
 * under the "Improving CSS variable performance" section.
 */
function removeCSSVariableInheritance() {
  if (scrollAreaOverflowVarsRegistered ||
  // When `inherits: false`, specifying `inherit` on child elements doesn't work
  // in Safari. To let CSS features work correctly, this optimization must be skipped.
  _platform.platform.engine.webkit) {
    return;
  }
  if (typeof CSS !== 'undefined' && 'registerProperty' in CSS) {
    OVERFLOW_EDGE_VARS.forEach(name => {
      try {
        CSS.registerProperty({
          name,
          syntax: '<length>',
          inherits: false,
          initialValue: '0px'
        });
      } catch {
        /* ignore already-registered */
      }
    });
  }
  scrollAreaOverflowVarsRegistered = true;
}

/**
 * The actual scrollable container of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
const ScrollAreaViewport = exports.ScrollAreaViewport = /*#__PURE__*/React.forwardRef(function ScrollAreaViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    cornerRef,
    cornerSize,
    setCornerSize,
    setThumbSize,
    rootId,
    setHiddenState,
    hiddenState,
    setHasMeasuredScrollbar,
    handleScroll,
    touchModality,
    setHovering,
    setOverflowEdges,
    overflowEdgeThreshold,
    viewportState
  } = (0, _ScrollAreaRootContext.useScrollAreaRootContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const programmaticScrollRef = React.useRef(true);
  const lastMeasuredViewportMetricsRef = React.useRef([NaN, NaN, NaN, NaN]);
  const scrollEndTimeout = (0, _useTimeout.useTimeout)();
  const waitForAnimationsTimeout = (0, _useTimeout.useTimeout)();
  const computeThumbPosition = (0, _useStableCallback.useStableCallback)(() => {
    const viewportEl = viewportRef.current;
    const scrollbarYEl = scrollbarYRef.current;
    const scrollbarXEl = scrollbarXRef.current;
    const thumbYEl = thumbYRef.current;
    const thumbXEl = thumbXRef.current;
    const cornerEl = cornerRef.current;
    if (!viewportEl) {
      return;
    }
    const scrollableContentHeight = viewportEl.scrollHeight;
    const scrollableContentWidth = viewportEl.scrollWidth;
    const viewportHeight = viewportEl.clientHeight;
    const viewportWidth = viewportEl.clientWidth;
    const scrollTop = viewportEl.scrollTop;
    const scrollLeft = viewportEl.scrollLeft;
    const lastMeasuredViewportMetrics = lastMeasuredViewportMetricsRef.current;
    const isFirstMeasurement = Number.isNaN(lastMeasuredViewportMetrics[0]);
    lastMeasuredViewportMetrics[0] = viewportHeight;
    lastMeasuredViewportMetrics[1] = scrollableContentHeight;
    lastMeasuredViewportMetrics[2] = viewportWidth;
    lastMeasuredViewportMetrics[3] = scrollableContentWidth;
    if (isFirstMeasurement) {
      setHasMeasuredScrollbar(true);
    }
    if (scrollableContentHeight === 0 || scrollableContentWidth === 0) {
      return;
    }
    const nextHiddenState = getHiddenState(viewportEl);
    const scrollbarYHidden = nextHiddenState.y;
    const scrollbarXHidden = nextHiddenState.x;
    const ratioX = viewportWidth / scrollableContentWidth;
    const ratioY = viewportHeight / scrollableContentHeight;
    const maxScrollLeft = Math.max(0, scrollableContentWidth - viewportWidth);
    const maxScrollTop = Math.max(0, scrollableContentHeight - viewportHeight);
    let scrollLeftFromStart = 0;
    let scrollLeftFromEnd = 0;
    if (!scrollbarXHidden) {
      // `normalizeScrollOffset` clamps internally.
      scrollLeftFromStart = (0, _scrollEdges.normalizeScrollOffset)(direction === 'rtl' ? -scrollLeft : scrollLeft, maxScrollLeft);
      scrollLeftFromEnd = maxScrollLeft - scrollLeftFromStart;
    }
    const scrollTopFromStart = scrollbarYHidden ? 0 : (0, _scrollEdges.normalizeScrollOffset)(scrollTop, maxScrollTop);
    const scrollTopFromEnd = scrollbarYHidden ? 0 : maxScrollTop - scrollTopFromStart;
    const nextWidth = scrollbarXHidden ? 0 : viewportWidth;
    const nextHeight = scrollbarYHidden ? 0 : viewportHeight;
    let nextCornerWidth = 0;
    let nextCornerHeight = 0;
    if (!scrollbarXHidden && !scrollbarYHidden) {
      nextCornerWidth = scrollbarYEl?.offsetWidth || 0;
      nextCornerHeight = scrollbarXEl?.offsetHeight || 0;
    }

    // Only subtract corner size from scrollbar dimensions if the corner hasn't been sized yet.
    // Once sized, the layout will already account for it.
    const cornerNotYetSized = cornerSize.width === 0 && cornerSize.height === 0;
    const cornerWidthOffset = cornerNotYetSized ? nextCornerWidth : 0;
    const cornerHeightOffset = cornerNotYetSized ? nextCornerHeight : 0;
    const scrollbarXOffset = (0, _getOffset.getOffset)(scrollbarXEl, 'padding', 'x');
    const scrollbarYOffset = (0, _getOffset.getOffset)(scrollbarYEl, 'padding', 'y');
    const thumbXOffset = (0, _getOffset.getOffset)(thumbXEl, 'margin', 'x');
    const thumbYOffset = (0, _getOffset.getOffset)(thumbYEl, 'margin', 'y');
    const idealNextWidth = nextWidth - scrollbarXOffset - thumbXOffset;
    const idealNextHeight = nextHeight - scrollbarYOffset - thumbYOffset;
    const maxNextWidth = scrollbarXEl ? Math.min(scrollbarXEl.offsetWidth - cornerWidthOffset, idealNextWidth) : idealNextWidth;
    const maxNextHeight = scrollbarYEl ? Math.min(scrollbarYEl.offsetHeight - cornerHeightOffset, idealNextHeight) : idealNextHeight;
    const clampedNextWidth = Math.max(_constants.MIN_THUMB_SIZE, maxNextWidth * ratioX);
    const clampedNextHeight = Math.max(_constants.MIN_THUMB_SIZE, maxNextHeight * ratioY);
    setThumbSize(prevSize => pickState(prevSize, {
      width: clampedNextWidth,
      height: clampedNextHeight
    }));

    // Handle Y (vertical) scroll
    if (scrollbarYEl && thumbYEl) {
      const maxThumbOffsetY = scrollbarYEl.offsetHeight - clampedNextHeight - scrollbarYOffset - thumbYOffset;
      const thumbOffsetY = applyOverscrollThumb(thumbYEl, ScrollAreaScrollbarCssVars.scrollAreaThumbHeight, scrollTop, maxScrollTop, scrollableContentHeight, clampedNextHeight, maxThumbOffsetY);
      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX = scrollbarXEl.offsetWidth - clampedNextWidth - scrollbarXOffset - thumbXOffset;
      // RTL scrolls from 0 down to `-maxScrollLeft`; measure from the inline start edge so the
      // overscroll math is direction-agnostic, then flip the resulting offset back below.
      const scrollFromStart = direction === 'rtl' ? -scrollLeft : scrollLeft;
      const offsetX = applyOverscrollThumb(thumbXEl, ScrollAreaScrollbarCssVars.scrollAreaThumbWidth, scrollFromStart, maxScrollLeft, scrollableContentWidth, clampedNextWidth, maxThumbOffsetX);
      thumbXEl.style.transform = `translate3d(${direction === 'rtl' ? -offsetX : offsetX}px,0,0)`;
    }
    const overflowMetricsPx = [scrollLeftFromStart, scrollLeftFromEnd, scrollTopFromStart, scrollTopFromEnd];
    OVERFLOW_EDGE_VARS.forEach((cssVar, index) => {
      viewportEl.style.setProperty(cssVar, `${overflowMetricsPx[index]}px`);
    });
    if (cornerEl) {
      // Bail when the size is unchanged (like `setThumbSize` above); otherwise a
      // fresh object literal on every scroll frame rebuilds the root context and
      // re-renders every scroll-area part.
      // `nextCornerWidth`/`nextCornerHeight` stay 0 when either scrollbar is hidden.
      setCornerSize(prevSize => pickState(prevSize, {
        width: nextCornerWidth,
        height: nextCornerHeight
      }));
    }
    setHiddenState(prevState => pickState(prevState, nextHiddenState));
    const nextOverflowEdges = {
      xStart: !scrollbarXHidden && scrollLeftFromStart > overflowEdgeThreshold.xStart,
      xEnd: !scrollbarXHidden && scrollLeftFromEnd > overflowEdgeThreshold.xEnd,
      yStart: !scrollbarYHidden && scrollTopFromStart > overflowEdgeThreshold.yStart,
      yEnd: !scrollbarYHidden && scrollTopFromEnd > overflowEdgeThreshold.yEnd
    };
    setOverflowEdges(prev => pickState(prev, nextOverflowEdges));
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    removeCSSVariableInheritance();
  }, []);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // Wait for scrollbar and thumb refs after hidden-state toggles, refresh math on direction
    // flips, and re-evaluate overflow edges when the threshold changes.
    queueMicrotask(computeThumbPosition);
  }, [computeThumbPosition, hiddenState, direction, overflowEdgeThreshold.xStart, overflowEdgeThreshold.xEnd, overflowEdgeThreshold.yStart, overflowEdgeThreshold.yEnd]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // `onMouseEnter` doesn't fire upon load, so we need to check if the viewport is already
    // being hovered.
    if (viewportRef.current?.matches(':hover')) {
      setHovering(true);
    }
  }, [viewportRef, setHovering]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const viewport = viewportRef.current;
    if (typeof ResizeObserver === 'undefined' || !viewport) {
      return undefined;
    }
    let hasInitialized = false;
    const resizeObserver = new ResizeObserver(() => {
      // Avoid duplicate mount-time recompute when observer data matches what the mount
      // scheduling pass already measured. If dimensions changed before the first observer
      // delivery, keep the recompute so overflow transitions stay in sync.
      if (!hasInitialized) {
        hasInitialized = true;
        const lastMeasuredViewportMetrics = lastMeasuredViewportMetricsRef.current;
        if (lastMeasuredViewportMetrics[0] === viewport.clientHeight && lastMeasuredViewportMetrics[1] === viewport.scrollHeight && lastMeasuredViewportMetrics[2] === viewport.clientWidth && lastMeasuredViewportMetrics[3] === viewport.scrollWidth) {
          return;
        }
      }
      computeThumbPosition();
    });
    resizeObserver.observe(viewport);

    // Wait for subtree animations to finish, then recompute thumb geometry that
    // may have been affected by transform-based animations.
    waitForAnimationsTimeout.start(0, () => {
      const animations = viewport.getAnimations({
        subtree: true
      });
      if (animations.length === 0) {
        return;
      }

      // `allSettled` never rejects, but `computeThumbPosition` can still run against a
      // torn-down tree once the animations resolve. Swallow instead of leaking an unhandled
      // rejection; `void` alone would only silence the floating-promise lint.
      Promise.allSettled(animations.map(animation => animation.finished)).then(computeThumbPosition).catch(() => {});
    });
    return () => {
      resizeObserver.disconnect();
      waitForAnimationsTimeout.clear();
    };
  }, [computeThumbPosition, viewportRef, waitForAnimationsTimeout]);
  function handleUserInteraction() {
    programmaticScrollRef.current = false;
  }
  const props = {
    role: 'presentation',
    ...(rootId && {
      'data-id': `${rootId}-viewport`
    }),
    // https://accessibilityinsights.io/info-examples/web/scrollable-region-focusable/
    // Keep non-scrollable viewports out of tab order.
    tabIndex: hiddenState.x && hiddenState.y ? -1 : 0,
    className: _styles.styleDisableScrollbar.className,
    style: {
      overflow: 'scroll'
    },
    onScroll() {
      if (!viewportRef.current) {
        return;
      }
      computeThumbPosition();

      // WebKit consumes a touch that catches an in-flight momentum scroll or
      // rubber-band bounce without dispatching any DOM events for the whole
      // gesture (not even `touchstart`), so scrolls cannot be attributed to
      // the user through events. Treat every scroll in touch modality as
      // user-driven instead.
      if (touchModality || !programmaticScrollRef.current) {
        handleScroll({
          x: viewportRef.current.scrollLeft,
          y: viewportRef.current.scrollTop
        });
      }

      // Debounce the restoration of the programmatic flag so that it only
      // flips back to `true` once scrolling has come to a rest. This ensures
      // that momentum scrolling (where no further user-interaction events fire)
      // is still treated as user-driven.
      // 100 ms without scroll events ≈ scroll end
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event
      scrollEndTimeout.start(100, () => {
        programmaticScrollRef.current = true;
      });
    },
    onWheel: handleUserInteraction,
    onPointerMove: handleUserInteraction,
    onPointerEnter: handleUserInteraction,
    onKeyDown: handleUserInteraction
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, viewportRef],
    state: viewportState,
    props: [props, elementProps],
    stateAttributesMapping: _stateAttributes.scrollAreaStateAttributesMapping
  });
  const contextValue = React.useMemo(() => ({
    computeThumbPosition
  }), [computeThumbPosition]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ScrollAreaViewportContext.ScrollAreaViewportContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ScrollAreaViewport.displayName = "ScrollAreaViewport";
function getHiddenState(viewport) {
  const y = viewport.clientHeight >= viewport.scrollHeight;
  const x = viewport.clientWidth >= viewport.scrollWidth;
  return {
    y,
    x,
    corner: y || x
  };
}

/**
 * Returns `prev` when `next` is shallow-equal to it so setState bails out and
 * scroll-frame updates don't rebuild the root context.
 */
function pickState(prev, next) {
  for (const key in next) {
    if (prev[key] !== next[key]) {
      return next;
    }
  }
  return prev;
}

/**
 * Sizes the thumb and returns its axis offset. On overscroll (Safari rubber-band only) it shrinks
 * against the pinned edge, damped by `content / (content + overscroll)` to match native feedback;
 * the size flows through the thumb-size variable so the resting `var(...)` still applies.
 */
function applyOverscrollThumb(thumbEl, sizeVar, scrollFromStart, maxScroll, content, size, maxThumbOffset) {
  const clamped = (0, _clamp.clamp)(scrollFromStart, 0, maxScroll);
  const overscroll = scrollFromStart - clamped;
  const nextSize = Math.max(_constants.MIN_THUMB_SIZE, size * content / (content + Math.abs(overscroll)));

  // Passing an empty string removes the override, restoring the resting `var(...)` size.
  thumbEl.style.setProperty(sizeVar, overscroll ? `${nextSize}px` : '');

  // Slide proportionally; at the end edge push down by the shrink so the thumb stays pinned to
  // it, while a start overscroll pins to offset 0.
  const offset = maxScroll ? clamped / maxScroll * maxThumbOffset : 0;
  return offset + (overscroll > 0 ? size - nextSize : 0);
}