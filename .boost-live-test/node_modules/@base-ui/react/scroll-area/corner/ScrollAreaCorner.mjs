'use client';

import * as React from 'react';
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaCorner = /*#__PURE__*/React.forwardRef(function ScrollAreaCorner(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    cornerRef,
    cornerSize,
    hiddenState
  } = useScrollAreaRootContext();
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, cornerRef],
    props: [{
      'aria-hidden': true,
      style: {
        position: 'absolute',
        bottom: 0,
        insetInlineEnd: 0,
        width: cornerSize.width,
        height: cornerSize.height
      }
    }, elementProps]
  });
  if (hiddenState.corner) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") ScrollAreaCorner.displayName = "ScrollAreaCorner";