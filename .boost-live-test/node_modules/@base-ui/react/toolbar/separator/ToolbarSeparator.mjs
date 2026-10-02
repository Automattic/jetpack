'use client';

import * as React from 'react';
import { Separator } from "../../separator/index.mjs";
import { useToolbarRootContext } from "../root/ToolbarRootContext.mjs";

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ToolbarSeparator = /*#__PURE__*/React.forwardRef(function ToolbarSeparator(props, forwardedRef) {
  const context = useToolbarRootContext();
  const orientation = context.orientation === 'vertical' ? 'horizontal' : 'vertical';
  return /*#__PURE__*/_jsx(Separator, {
    orientation: orientation,
    ...props,
    ref: forwardedRef
  });
});
if (process.env.NODE_ENV !== "production") ToolbarSeparator.displayName = "ToolbarSeparator";