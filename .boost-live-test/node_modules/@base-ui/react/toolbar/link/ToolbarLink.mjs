'use client';

import * as React from 'react';
import { useToolbarRootContext } from "../root/ToolbarRootContext.mjs";
import { CompositeItem } from "../../internals/composite/item/CompositeItem.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
const TOOLBAR_LINK_METADATA = {
  // Links cannot be disabled, but they still occupy a focusable composite item slot.
  disabled: false,
  focusableWhenDisabled: true
};

/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarLink = /*#__PURE__*/React.forwardRef(function ToolbarLink(componentProps, forwardedRef) {
  const {
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    orientation
  } = useToolbarRootContext();
  const state = {
    orientation
  };
  return /*#__PURE__*/_jsx(CompositeItem, {
    tag: "a",
    render: render,
    className: className,
    style: style,
    metadata: TOOLBAR_LINK_METADATA,
    state: state,
    refs: [forwardedRef],
    props: [elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ToolbarLink.displayName = "ToolbarLink";