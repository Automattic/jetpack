'use client';

import * as React from 'react';
import { useToastRootContext } from "../root/ToastRootContext.mjs";
import { useToastProviderContext } from "../provider/ToastProviderContext.mjs";
import { useButton } from "../../internals/use-button/useButton.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastClose = /*#__PURE__*/React.forwardRef(function ToastClose(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled,
    nativeButton = true,
    ...elementProps
  } = componentProps;
  const store = useToastProviderContext();
  const {
    toast,
    expanded
  } = useToastRootContext();
  const [hasFocus, setHasFocus] = React.useState(false);
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
  return useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    state,
    props: [{
      'aria-hidden': !expanded && !hasFocus,
      onClick() {
        store.closeToast(toast.id);
      },
      onFocus() {
        setHasFocus(true);
      },
      onBlur() {
        setHasFocus(false);
      }
    }, elementProps, getButtonProps]
  });
});
if (process.env.NODE_ENV !== "production") ToastClose.displayName = "ToastClose";