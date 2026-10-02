'use client';

import * as React from 'react';
import { FloatingPortal } from "../../floating-ui-react/index.mjs";
import { usePopoverRootContext } from "../root/PopoverRootContext.mjs";
import { PopoverPortalContext } from "./PopoverPortalContext.mjs";

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const PopoverPortal = /*#__PURE__*/React.forwardRef(function PopoverPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = usePopoverRootContext();
  const mounted = store.useState('mounted');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/_jsx(PopoverPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/_jsx(FloatingPortal, {
      ref: forwardedRef,
      ...portalProps
    })
  });
});
if (process.env.NODE_ENV !== "production") PopoverPortal.displayName = "PopoverPortal";