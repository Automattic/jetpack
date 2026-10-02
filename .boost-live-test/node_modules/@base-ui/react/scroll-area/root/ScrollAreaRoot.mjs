'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ScrollAreaRootContext } from "./ScrollAreaRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { SCROLL_TIMEOUT } from "../constants.mjs";
import { getOffset } from "../utils/getOffset.mjs";
import { styleDisableScrollbar } from "../../utils/styles.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { scrollAreaStateAttributesMapping } from "./stateAttributes.mjs";
import { contains } from "../../floating-ui-react/utils.mjs";
import { useCSPContext } from "../../internals/csp-context/CSPContext.mjs";
import * as ScrollAreaRootCssVars from "./ScrollAreaRootCssVars.mjs";
import * as ScrollAreaScrollbarDataAttributes from "../scrollbar/ScrollAreaScrollbarDataAttributes.mjs";
import { jsxs as _jsxs } from "react/jsx-runtime";
const DEFAULT_COORDS = {
  x: 0,
  y: 0
};
const DEFAULT_SIZE = {
  width: 0,
  height: 0
};
const DEFAULT_OVERFLOW_EDGES = {
  xStart: false,
  xEnd: false,
  yStart: false,
  yEnd: false
};
const DEFAULT_HIDDEN_STATE = {
  x: true,
  y: true,
  corner: true
};
/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaRoot = /*#__PURE__*/React.forwardRef(function ScrollAreaRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    overflowEdgeThreshold: overflowEdgeThresholdProp,
    style,
    ...elementProps
  } = componentProps;
  const {
    xStart,
    xEnd,
    yStart,
    yEnd
  } = normalizeOverflowEdgeThreshold(overflowEdgeThresholdProp);
  const rootId = useBaseUiId();
  const scrollYTimeout = useTimeout();
  const scrollXTimeout = useTimeout();
  const {
    nonce,
    disableStyleElements
  } = useCSPContext();
  const [hovering, setHovering] = React.useState(false);
  const [scrollingX, setScrollingX] = React.useState(false);
  const [scrollingY, setScrollingY] = React.useState(false);
  const [touchModality, setTouchModality] = React.useState(false);
  const [hasMeasuredScrollbar, setHasMeasuredScrollbar] = React.useState(false);
  const [cornerSize, setCornerSize] = React.useState(DEFAULT_SIZE);
  const [thumbSize, setThumbSize] = React.useState(DEFAULT_SIZE);
  const [overflowEdges, setOverflowEdges] = React.useState(DEFAULT_OVERFLOW_EDGES);
  const [hiddenState, setHiddenState] = React.useState(DEFAULT_HIDDEN_STATE);
  const rootRef = React.useRef(null);
  const viewportRef = React.useRef(null);
  const scrollbarYRef = React.useRef(null);
  const scrollbarXRef = React.useRef(null);
  const thumbYRef = React.useRef(null);
  const thumbXRef = React.useRef(null);
  const cornerRef = React.useRef(null);
  const activePointerIdRef = React.useRef(null);
  const startYRef = React.useRef(0);
  const startXRef = React.useRef(0);
  const startScrollTopRef = React.useRef(0);
  const startScrollLeftRef = React.useRef(0);
  const currentOrientationRef = React.useRef('vertical');
  const scrollPositionRef = React.useRef(DEFAULT_COORDS);
  const savedSnapTypeRef = React.useRef(null);
  function startScrolling(vertical) {
    const setScrolling = vertical ? setScrollingY : setScrollingX;
    const timeout = vertical ? scrollYTimeout : scrollXTimeout;
    setScrolling(true);
    timeout.start(SCROLL_TIMEOUT, () => {
      setScrolling(false);
    });
  }
  const handleScroll = useStableCallback(scrollPosition => {
    const offsetX = scrollPosition.x - scrollPositionRef.current.x;
    const offsetY = scrollPosition.y - scrollPositionRef.current.y;
    scrollPositionRef.current = scrollPosition;
    if (offsetY !== 0) {
      startScrolling(true);
    }
    if (offsetX !== 0) {
      startScrolling(false);
    }
  });

  // CSS scroll snap forces every programmatic scroll to land on a snap
  // point, making thumb dragging jump between snap points. Native
  // scrollbars suppress snapping while dragging, so disable it until the
  // pointer is released; restoring the value re-snaps the viewport. The
  // save is guarded so a second pointer during an active drag can't
  // clobber the saved value with `none`.
  const disableViewportSnap = useStableCallback(() => {
    const viewportEl = viewportRef.current;
    if (viewportEl && savedSnapTypeRef.current === null) {
      savedSnapTypeRef.current = viewportEl.style.scrollSnapType;
      viewportEl.style.scrollSnapType = 'none';
    }
  });
  const handlePointerDown = useStableCallback(event => {
    if (event.button !== 0) {
      return;
    }
    if (activePointerIdRef.current !== null) {
      const activeThumb = currentOrientationRef.current === 'vertical' ? thumbYRef.current : thumbXRef.current;
      // A live drag holds capture for the active pointer — ignore other pointers.
      // No capture means the release went missing entirely (silent capture drop
      // with an id that never reappears, e.g. a lost touch contact), so let the
      // new pointer take over the latch instead of leaving dragging dead.
      if (activeThumb?.hasPointerCapture(activePointerIdRef.current)) {
        return;
      }
    }
    activePointerIdRef.current = event.pointerId;
    startYRef.current = event.clientY;
    startXRef.current = event.clientX;
    currentOrientationRef.current = event.currentTarget.getAttribute(ScrollAreaScrollbarDataAttributes.orientation);
    const viewportEl = viewportRef.current;
    if (viewportEl) {
      startScrollTopRef.current = viewportEl.scrollTop;
      startScrollLeftRef.current = viewportEl.scrollLeft;
      disableViewportSnap();
    }
    const thumb = currentOrientationRef.current === 'vertical' ? thumbYRef.current : thumbXRef.current;
    thumb?.setPointerCapture(event.pointerId);
  });
  const handlePointerUp = useStableCallback(event => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }
    activePointerIdRef.current = null;
    // Clear the drag's scrolling state immediately rather than waiting for the
    // `SCROLL_TIMEOUT` timer armed by the last drag move, so every release path
    // (real, `pointercancel`, or the missed-release fallback) behaves the same.
    (currentOrientationRef.current === 'vertical' ? setScrollingY : setScrollingX)(false);
    if (savedSnapTypeRef.current !== null) {
      if (viewportRef.current) {
        viewportRef.current.style.scrollSnapType = savedSnapTypeRef.current;
      }
      savedSnapTypeRef.current = null;
    }
    const thumb = currentOrientationRef.current === 'vertical' ? thumbYRef.current : thumbXRef.current;
    // `pointercancel` releases capture implicitly, so guard against releasing a
    // capture we no longer hold (which would throw).
    if (thumb?.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }
  });
  const handlePointerMove = useStableCallback(event => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    // The release can go missing entirely (e.g. the browser drops pointer
    // capture while the scrollbar is hidden mid-drag), leaving the drag
    // latched so a buttonless hover over the thumb scrolls the viewport.
    // Treat a move without the primary button held (`buttons` bit 1 unset)
    // as the missed release.
    if (event.buttons % 2 === 0) {
      handlePointerUp(event);
      return;
    }
    const viewportEl = viewportRef.current;
    if (!viewportEl) {
      return;
    }
    const vertical = currentOrientationRef.current === 'vertical';
    const thumbEl = vertical ? thumbYRef.current : thumbXRef.current;
    const scrollbarEl = vertical ? scrollbarYRef.current : scrollbarXRef.current;
    if (!thumbEl || !scrollbarEl) {
      return;
    }
    const axis = vertical ? 'y' : 'x';
    const scrollbarOffset = getOffset(scrollbarEl, 'padding', axis);
    const thumbOffset = getOffset(thumbEl, 'margin', axis);
    const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
    const trackSize = vertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;
    const maxThumbOffset = trackSize - thumbSizePx - scrollbarOffset - thumbOffset;
    // A short or heavily padded track can drive `maxThumbOffset` to zero or
    // negative once the thumb hits its `MIN_THUMB_SIZE` floor. Dividing by it
    // would yield a non-finite (`Infinity`/`NaN`) or inverted scroll position.
    const delta = vertical ? event.clientY - startYRef.current : event.clientX - startXRef.current;
    const scrollRatio = maxThumbOffset <= 0 ? 0 : delta / maxThumbOffset;
    const scrollableSize = vertical ? viewportEl.scrollHeight : viewportEl.scrollWidth;
    const viewportSize = vertical ? viewportEl.clientHeight : viewportEl.clientWidth;
    const startScroll = vertical ? startScrollTopRef.current : startScrollLeftRef.current;
    const nextScroll = startScroll + scrollRatio * (scrollableSize - viewportSize);
    if (vertical) {
      viewportEl.scrollTop = nextScroll;
    } else {
      viewportEl.scrollLeft = nextScroll;
    }
    event.preventDefault();
    startScrolling(vertical);
  });
  function handleTouchModalityChange(event) {
    setTouchModality(event.pointerType === 'touch');
  }
  function handlePointerEnterOrMove(event) {
    handleTouchModalityChange(event);
    if (event.pointerType !== 'touch') {
      const isTargetRootChild = contains(rootRef.current, event.target);
      setHovering(isTargetRootChild);
    }
  }
  const state = React.useMemo(() => ({
    scrolling: scrollingX || scrollingY,
    hasOverflowX: !hiddenState.x,
    hasOverflowY: !hiddenState.y,
    overflowXStart: overflowEdges.xStart,
    overflowXEnd: overflowEdges.xEnd,
    overflowYStart: overflowEdges.yStart,
    overflowYEnd: overflowEdges.yEnd,
    cornerHidden: hiddenState.corner
  }), [scrollingX, scrollingY, hiddenState.x, hiddenState.y, hiddenState.corner, overflowEdges]);
  const props = {
    role: 'presentation',
    onPointerEnter: handlePointerEnterOrMove,
    onPointerMove: handlePointerEnterOrMove,
    onPointerDown: handleTouchModalityChange,
    onPointerLeave() {
      setHovering(false);
    },
    style: {
      position: 'relative',
      [ScrollAreaRootCssVars.scrollAreaCornerHeight]: `${cornerSize.height}px`,
      [ScrollAreaRootCssVars.scrollAreaCornerWidth]: `${cornerSize.width}px`
    }
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef],
    props: [props, elementProps],
    stateAttributesMapping: scrollAreaStateAttributesMapping
  });
  const contextValue = React.useMemo(() => ({
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    disableViewportSnap,
    cornerSize,
    setCornerSize,
    thumbSize,
    setThumbSize,
    hasMeasuredScrollbar,
    setHasMeasuredScrollbar,
    touchModality,
    cornerRef,
    scrollingX,
    scrollingY,
    hovering,
    setHovering,
    viewportRef,
    scrollbarYRef,
    scrollbarXRef,
    thumbYRef,
    thumbXRef,
    rootId,
    hiddenState,
    setHiddenState,
    overflowEdges,
    setOverflowEdges,
    viewportState: state,
    overflowEdgeThreshold: {
      xStart,
      xEnd,
      yStart,
      yEnd
    }
  }), [handlePointerDown, handlePointerMove, handlePointerUp, handleScroll, disableViewportSnap, cornerSize, thumbSize, hasMeasuredScrollbar, touchModality, scrollingX, scrollingY, hovering, rootId, hiddenState, overflowEdges, state, xStart, xEnd, yStart, yEnd]);
  return /*#__PURE__*/_jsxs(ScrollAreaRootContext.Provider, {
    value: contextValue,
    children: [!disableStyleElements && styleDisableScrollbar.getElement(nonce), element]
  });
});
if (process.env.NODE_ENV !== "production") ScrollAreaRoot.displayName = "ScrollAreaRoot";
function normalizeOverflowEdgeThreshold(threshold) {
  const thresholds = typeof threshold === 'number' ? {
    xStart: threshold,
    xEnd: threshold,
    yStart: threshold,
    yEnd: threshold
  } : threshold;
  return {
    xStart: Math.max(0, thresholds?.xStart || 0),
    xEnd: Math.max(0, thresholds?.xEnd || 0),
    yStart: Math.max(0, thresholds?.yStart || 0),
    yEnd: Math.max(0, thresholds?.yEnd || 0)
  };
}