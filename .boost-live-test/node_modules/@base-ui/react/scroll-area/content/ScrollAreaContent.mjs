'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useScrollAreaViewportContext } from "../viewport/ScrollAreaViewportContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext.mjs";
import { scrollAreaStateAttributesMapping } from "../root/stateAttributes.mjs";
/**
 * A container for the content of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export const ScrollAreaContent = /*#__PURE__*/React.forwardRef(function ScrollAreaContent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    computeThumbPosition
  } = useScrollAreaViewportContext();
  const {
    hasMeasuredScrollbar,
    viewportState
  } = useScrollAreaRootContext();
  const contentWrapperRef = React.useRef(null);
  const computeOnInitialResizeRef = React.useRef(hasMeasuredScrollbar);
  useIsoLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    let hasInitialized = false;
    const resizeObserver = new ResizeObserver(() => {
      if (!hasInitialized) {
        hasInitialized = true;

        // ResizeObserver fires once upon observing. Skip that initial call to avoid
        // double-calculating the thumb position on mount, unless the content mounted
        // after the viewport's initial measurement (in which case this fire is what
        // brings the overflow state in sync).
        if (!computeOnInitialResizeRef.current) {
          return;
        }
      }
      computeThumbPosition();
    });
    if (contentWrapperRef.current) {
      resizeObserver.observe(contentWrapperRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [computeThumbPosition]);
  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, contentWrapperRef],
    state: viewportState,
    stateAttributesMapping: scrollAreaStateAttributesMapping,
    props: [{
      role: 'presentation',
      style: {
        minWidth: 'fit-content'
      }
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ScrollAreaContent.displayName = "ScrollAreaContent";