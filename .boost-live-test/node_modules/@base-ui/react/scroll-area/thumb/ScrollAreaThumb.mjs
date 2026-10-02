'use client';

import * as React from 'react';
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext.mjs";
import { useScrollAreaScrollbarContext } from "../scrollbar/ScrollAreaScrollbarContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * The draggable part of the scrollbar that indicates the current scroll position.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaThumb = /*#__PURE__*/React.forwardRef(function ScrollAreaThumb(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    thumbYRef,
    thumbXRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    scrollingX,
    scrollingY,
    hasMeasuredScrollbar
  } = useScrollAreaRootContext();
  const orientation = useScrollAreaScrollbarContext();
  const vertical = orientation === 'vertical';
  const state = {
    scrolling: vertical ? scrollingY : scrollingX,
    orientation
  };
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, vertical ? thumbYRef : thumbXRef],
    state,
    props: [{
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      style: {
        visibility: hasMeasuredScrollbar ? undefined : 'hidden',
        ...(vertical ? {
          height: 'var(--scroll-area-thumb-height)'
        } : {
          width: 'var(--scroll-area-thumb-width)'
        })
      }
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ScrollAreaThumb.displayName = "ScrollAreaThumb";