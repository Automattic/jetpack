'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useToastRootContext } from "../root/ToastRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * A container for the contents of a toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastContent = /*#__PURE__*/React.forwardRef(function ToastContent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    visibleIndex,
    expanded,
    recalculateHeight
  } = useToastRootContext();
  const contentRef = React.useRef(null);
  useIsoLayoutEffect(() => {
    recalculateHeight();
    const node = contentRef.current;
    if (!node || typeof ResizeObserver !== 'function' || typeof MutationObserver !== 'function') {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(() => recalculateHeight(true));
    const mutationObserver = new MutationObserver(() => recalculateHeight(true));
    resizeObserver.observe(node);
    mutationObserver.observe(node, {
      childList: true,
      subtree: true,
      characterData: true
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [recalculateHeight]);
  const behind = visibleIndex > 0;
  const state = {
    expanded,
    behind
  };
  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, contentRef],
    state,
    props: elementProps
  });
});
if (process.env.NODE_ENV !== "production") ToastContent.displayName = "ToastContent";