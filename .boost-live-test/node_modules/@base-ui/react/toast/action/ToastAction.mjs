'use client';

import * as React from 'react';
import { useToastRootContext } from "../root/ToastRootContext.mjs";
import { useButton } from "../../internals/use-button/useButton.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { hasRenderableChildren } from "../utils/isRenderableNode.mjs";

/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastAction = /*#__PURE__*/React.forwardRef(function ToastAction(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const {
    toast
  } = useToastRootContext();
  const computedChildren = toast.actionProps?.children ?? elementProps.children;
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton
  });
  const state = {
    type: toast.type
  };
  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [elementProps, toast.actionProps, getButtonProps, {
      children: computedChildren
    }]
  });
  return hasRenderableChildren(element) ? element : null;
});
if (process.env.NODE_ENV !== "production") ToastAction.displayName = "ToastAction";