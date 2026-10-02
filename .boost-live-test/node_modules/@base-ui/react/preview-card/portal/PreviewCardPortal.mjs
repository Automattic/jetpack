'use client';

import * as React from 'react';
import { usePreviewCardRootContext } from "../root/PreviewCardContext.mjs";
import { PreviewCardPortalContext } from "./PreviewCardPortalContext.mjs";
import { FloatingPortalLite } from "../../utils/FloatingPortalLite.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardPortal = /*#__PURE__*/React.forwardRef(function PreviewCardPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = usePreviewCardRootContext();
  const mounted = store.useState('mounted');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/_jsx(PreviewCardPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/_jsx(FloatingPortalLite, {
      ref: forwardedRef,
      ...portalProps
    })
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardPortal.displayName = "PreviewCardPortal";