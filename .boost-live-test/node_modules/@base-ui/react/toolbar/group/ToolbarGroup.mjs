'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useToolbarRootContext } from "../root/ToolbarRootContext.mjs";
import { ToolbarGroupContext } from "./ToolbarGroupContext.mjs";

/**
 * Groups several toolbar items or toggles.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ToolbarGroup = /*#__PURE__*/React.forwardRef(function ToolbarGroup(componentProps, forwardedRef) {
  const {
    className,
    disabled: disabledProp = false,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    orientation,
    disabled: toolbarDisabled
  } = useToolbarRootContext();
  const disabled = toolbarDisabled || disabledProp;
  const contextValue = React.useMemo(() => ({
    disabled
  }), [disabled]);
  const state = {
    disabled,
    orientation
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'group'
    }, elementProps]
  });
  return /*#__PURE__*/_jsx(ToolbarGroupContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ToolbarGroup.displayName = "ToolbarGroup";