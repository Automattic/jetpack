'use client';

import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { contains, getTarget } from "../../floating-ui-react/utils.mjs";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext.mjs";
import { ScrollAreaScrollbarContext } from "./ScrollAreaScrollbarContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { getOffset } from "../utils/getOffset.mjs";
import { useDirection } from "../../internals/direction-context/DirectionContext.mjs";
import { scrollAreaStateAttributesMapping } from "../root/stateAttributes.mjs";
import * as ScrollAreaRootCssVars from "../root/ScrollAreaRootCssVars.mjs";
import * as ScrollAreaScrollbarCssVars from "./ScrollAreaScrollbarCssVars.mjs";

/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ScrollAreaScrollbar = /*#__PURE__*/React.forwardRef(function ScrollAreaScrollbar(componentProps, forwardedRef) {
  const {
    render,
    className,
    orientation = 'vertical',
    keepMounted = false,
    style,
    ...elementProps
  } = componentProps;
  const {
    hovering,
    scrollingX,
    scrollingY,
    hiddenState,
    scrollbarYRef,
    scrollbarXRef,
    viewportRef,
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerUp,
    handleScroll,
    disableViewportSnap,
    rootId,
    thumbSize,
    hasMeasuredScrollbar,
    viewportState
  } = useScrollAreaRootContext();
  const vertical = orientation === 'vertical';
  const state = {
    ...viewportState,
    hovering,
    scrolling: vertical ? scrollingY : scrollingX,
    orientation
  };
  const direction = useDirection();
  const hideTrackUntilMeasured = !hasMeasuredScrollbar && !keepMounted;
  const isHidden = vertical ? hiddenState.y : hiddenState.x;
  const shouldRender = keepMounted || !isHidden;
  React.useEffect(() => {
    if (!shouldRender) {
      return undefined;
    }
    const viewportEl = viewportRef.current;
    const scrollbarEl = vertical ? scrollbarYRef.current : scrollbarXRef.current;
    if (!scrollbarEl) {
      return undefined;
    }
    function handleWheel(event) {
      if (!viewportEl || event.ctrlKey) {
        return;
      }
      const horizontal = !vertical;
      const scrollProperty = horizontal ? 'scrollLeft' : 'scrollTop';
      const delta = horizontal ? event.deltaX : event.deltaY;
      if (delta === 0) {
        return;
      }
      const maxScroll = horizontal ? viewportEl.scrollWidth - viewportEl.clientWidth : viewportEl.scrollHeight - viewportEl.clientHeight;
      // RTL horizontal scrolling uses a negative `scrollLeft` range, from 0 to `-maxScroll`.
      const minScroll = horizontal && direction === 'rtl' ? -maxScroll : 0;
      const maxScrollValue = horizontal && direction === 'rtl' ? 0 : maxScroll;
      const scrollValue = viewportEl[scrollProperty];

      // At an edge (or with no overflow), let the wheel event chain to the
      // parent/page instead of swallowing it via `preventDefault`.
      if (scrollValue <= minScroll && delta < 0 || scrollValue >= maxScrollValue && delta > 0) {
        return;
      }
      event.preventDefault();
      viewportEl[scrollProperty] = Math.min(maxScrollValue, Math.max(minScroll, scrollValue + delta));
      handleScroll({
        x: viewportEl.scrollLeft,
        y: viewportEl.scrollTop
      });
    }
    return addEventListener(scrollbarEl, 'wheel', handleWheel, {
      passive: false
    });
  }, [direction, handleScroll, vertical, scrollbarXRef, scrollbarYRef, shouldRender, viewportRef]);
  const props = {
    ...(rootId && {
      'data-id': `${rootId}-scrollbar`
    }),
    'aria-hidden': true,
    onPointerDown(event) {
      if (event.button !== 0) {
        return;
      }
      const target = getTarget(event.nativeEvent);
      const thumbEl = vertical ? thumbYRef.current : thumbXRef.current;

      // Ignore clicks on thumb, including cases where React retargets the
      // synthetic event to the track host across a shadow boundary.
      if (thumbEl && contains(thumbEl, target)) {
        return;
      }
      const viewportEl = viewportRef.current;
      if (!viewportEl) {
        return;
      }
      const scrollbarEl = vertical ? scrollbarYRef.current : scrollbarXRef.current;
      if (!thumbEl || !scrollbarEl) {
        return;
      }
      const axis = vertical ? 'y' : 'x';
      const thumbOffset = getOffset(thumbEl, 'margin', axis);
      const scrollbarOffset = getOffset(scrollbarEl, 'padding', axis);
      const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
      const trackRect = scrollbarEl.getBoundingClientRect();
      const clickPosition = vertical ? event.clientY - trackRect.top - thumbSizePx / 2 - scrollbarOffset + thumbOffset / 2 : event.clientX - trackRect.left - thumbSizePx / 2 - scrollbarOffset + thumbOffset / 2;
      const scrollableSize = vertical ? viewportEl.scrollHeight : viewportEl.scrollWidth;
      const viewportSize = vertical ? viewportEl.clientHeight : viewportEl.clientWidth;
      const trackSize = vertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;
      const maxThumbOffset = trackSize - thumbSizePx - scrollbarOffset - thumbOffset;
      // A short or heavily padded track can drive `maxThumbOffset` to zero or
      // negative once the thumb hits its `MIN_THUMB_SIZE` floor. Dividing by it
      // would yield a non-finite (`Infinity`/`NaN`) or inverted scroll position.
      if (maxThumbOffset <= 0) {
        return;
      }
      const scrollRatio = clickPosition / maxThumbOffset;
      const maxScrollDistance = scrollableSize - viewportSize;

      // Disable snapping before the jump-to-click assignment, or the
      // assigned position quantizes to the nearest snap point and the thumb
      // stays offset from the pointer for the whole drag. `handlePointerDown`
      // below re-runs this as a guarded no-op for the thumb-drag path.
      disableViewportSnap();
      if (vertical) {
        viewportEl.scrollTop = scrollRatio * maxScrollDistance;
      } else if (direction === 'rtl') {
        viewportEl.scrollLeft = -(1 - scrollRatio) * maxScrollDistance;
      } else {
        viewportEl.scrollLeft = scrollRatio * maxScrollDistance;
      }
      handleScroll({
        x: viewportEl.scrollLeft,
        y: viewportEl.scrollTop
      });
      handlePointerDown(event);
    },
    // Native scrollbars don't move focus when pressed, whichever button is used.
    // Handled here rather than on the thumb so the bubbled press covers both.
    onMouseDown(event) {
      event.preventDefault();
    },
    onPointerUp: handlePointerUp,
    // Mirror `onPointerUp` so a browser-cancelled gesture on the track (no thumb
    // child captures the pointer) still clears the drag state.
    onPointerCancel: handlePointerUp,
    style: {
      position: 'absolute',
      touchAction: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      visibility: hideTrackUntilMeasured ? 'hidden' : undefined,
      ...(vertical ? {
        top: 0,
        bottom: `var(${ScrollAreaRootCssVars.scrollAreaCornerHeight})`,
        insetInlineEnd: 0,
        [ScrollAreaScrollbarCssVars.scrollAreaThumbHeight]: `${thumbSize.height}px`
      } : {
        insetInlineStart: 0,
        insetInlineEnd: `var(${ScrollAreaRootCssVars.scrollAreaCornerWidth})`,
        bottom: 0,
        [ScrollAreaScrollbarCssVars.scrollAreaThumbWidth]: `${thumbSize.width}px`
      })
    }
  };
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, vertical ? scrollbarYRef : scrollbarXRef],
    state,
    props: [props, elementProps],
    stateAttributesMapping: scrollAreaStateAttributesMapping
  });
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/_jsx(ScrollAreaScrollbarContext.Provider, {
    value: orientation,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";