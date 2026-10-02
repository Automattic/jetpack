'use client';

import * as React from 'react';
import { FloatingPortalLite } from "../../utils/FloatingPortalLite.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A portal element that moves the viewport to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastPortal = /*#__PURE__*/React.forwardRef(function ToastPortal(props, forwardedRef) {
  return /*#__PURE__*/_jsx(FloatingPortalLite, {
    ref: forwardedRef,
    ...props
  });
});
if (process.env.NODE_ENV !== "production") ToastPortal.displayName = "ToastPortal";