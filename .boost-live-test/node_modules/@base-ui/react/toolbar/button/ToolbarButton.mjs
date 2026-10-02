'use client';

import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useButton } from "../../internals/use-button/index.mjs";
import { useToolbarRootContext } from "../root/ToolbarRootContext.mjs";
import { useToolbarGroupContext } from "../group/ToolbarGroupContext.mjs";
import { CompositeItem } from "../../internals/composite/item/CompositeItem.mjs";

/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ToolbarButton = /*#__PURE__*/React.forwardRef(function ToolbarButton(componentProps, forwardedRef) {
  const {
    className,
    disabled: disabledProp = false,
    focusableWhenDisabled = true,
    render,
    nativeButton,
    style,
    ...elementProps
  } = componentProps;
  const {
    disabled: toolbarDisabled,
    orientation
  } = useToolbarRootContext();
  const groupContext = useToolbarGroupContext();
  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;
  const itemMetadata = React.useMemo(() => ({
    disabled,
    focusableWhenDisabled
  }), [disabled, focusableWhenDisabled]);
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton
  });
  const state = {
    disabled,
    orientation,
    focusable: focusableWhenDisabled
  };
  return /*#__PURE__*/_jsx(CompositeItem, {
    tag: "button",
    render: render,
    className: className,
    style: style,
    metadata: itemMetadata,
    state: state,
    refs: [forwardedRef, buttonRef],
    props: [elementProps,
    // When a render prop is provided (typically another Base UI component
    // like Menu.Trigger), forward `disabled` so the rendered component can
    // derive its own disabled state. For the default toolbar button, avoid
    // forwarding a React `disabled` prop so focusable disabled buttons remain
    // hoverable for interactions like tooltips.
    // TODO: follow up after https://github.com/mui/base-ui/issues/1976#issuecomment-2916905663
    render ? {
      disabled
    } : EMPTY_OBJECT, getButtonProps]
  });
});
if (process.env.NODE_ENV !== "production") ToolbarButton.displayName = "ToolbarButton";