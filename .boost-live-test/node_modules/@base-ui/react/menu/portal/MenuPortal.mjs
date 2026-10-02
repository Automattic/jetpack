'use client';

import * as React from 'react';
import { FloatingPortal } from "../../floating-ui-react/index.mjs";
import { useMenuRootContext } from "../root/MenuRootContext.mjs";
import { MenuPortalContext } from "./MenuPortalContext.mjs";

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const MenuPortal = /*#__PURE__*/React.forwardRef(function MenuPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const {
    store,
    parent
  } = useMenuRootContext();
  const mounted = store.useState('mounted');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  // The hidden `aria-owns` owner renders here, in the React tree, so the role must be decided by
  // where this portal sits, not by the active trigger. `parent` comes from context (the `Menu.Root`
  // position), unlike the store's `parent`, which a detached trigger overwrites with its own.
  const portalOwnerRole = parent.type === 'menu' || parent.type === 'menubar' ? 'group' : undefined;
  return /*#__PURE__*/_jsx(MenuPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/_jsx(FloatingPortal, {
      ref: forwardedRef,
      ...portalProps,
      portalOwnerRole: portalOwnerRole
    })
  });
});
if (process.env.NODE_ENV !== "production") MenuPortal.displayName = "MenuPortal";