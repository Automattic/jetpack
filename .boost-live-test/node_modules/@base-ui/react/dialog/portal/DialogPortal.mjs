'use client';

import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { FloatingPortal } from "../../floating-ui-react/index.mjs";
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { DialogPortalContext } from "./DialogPortalContext.mjs";
import { InternalBackdrop } from "../../utils/InternalBackdrop.mjs";

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const DialogPortal = /*#__PURE__*/React.forwardRef(function DialogPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = useDialogRootContext();
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');
  const open = store.useState('open');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/_jsx(DialogPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/_jsxs(FloatingPortal, {
      ref: forwardedRef,
      ...portalProps,
      children: [mounted && modal === true && /*#__PURE__*/_jsx(InternalBackdrop, {
        ref: store.context.internalBackdropRef,
        inert: inertValue(!open)
      }), props.children]
    })
  });
});
if (process.env.NODE_ENV !== "production") DialogPortal.displayName = "DialogPortal";