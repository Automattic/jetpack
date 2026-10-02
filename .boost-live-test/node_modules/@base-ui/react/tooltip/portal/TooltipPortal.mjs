'use client';

import * as React from 'react';
import { useTooltipRootContext } from "../root/TooltipRootContext.mjs";
import { TooltipPortalContext } from "./TooltipPortalContext.mjs";
import { FloatingPortalLite } from "../../utils/FloatingPortalLite.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipPortal = /*#__PURE__*/React.forwardRef(function TooltipPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = useTooltipRootContext();
  const mounted = store.useState('mounted');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/_jsx(TooltipPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/_jsx(FloatingPortalLite, {
      ref: forwardedRef,
      ...portalProps
    })
  });
});
if (process.env.NODE_ENV !== "production") TooltipPortal.displayName = "TooltipPortal";