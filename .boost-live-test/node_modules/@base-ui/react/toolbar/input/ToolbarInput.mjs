'use client';

import * as React from 'react';
import { useFocusableWhenDisabled } from "../../utils/useFocusableWhenDisabled.mjs";
import { useToolbarRootContext } from "../root/ToolbarRootContext.mjs";
import { useToolbarGroupContext } from "../group/ToolbarGroupContext.mjs";
import { CompositeItem } from "../../internals/composite/item/CompositeItem.mjs";

/**
 * A native input element that integrates with Toolbar keyboard navigation.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ToolbarInput = /*#__PURE__*/React.forwardRef(function ToolbarInput(componentProps, forwardedRef) {
  const {
    className,
    focusableWhenDisabled = true,
    render,
    disabled: disabledProp = false,
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
    props: focusableWhenDisabledProps
  } = useFocusableWhenDisabled({
    composite: true,
    disabled,
    focusableWhenDisabled,
    isNativeButton: false
  });
  const state = {
    disabled,
    orientation,
    focusable: focusableWhenDisabled
  };
  const preventWhenDisabled = event => {
    if (disabled) {
      event.preventDefault();
    }
  };
  const defaultProps = {
    onClick: preventWhenDisabled,
    onPointerDown: preventWhenDisabled
  };
  return /*#__PURE__*/_jsx(CompositeItem, {
    tag: "input",
    render: render,
    className: className,
    style: style,
    metadata: itemMetadata,
    state: state,
    refs: [forwardedRef],
    props: [defaultProps, elementProps, focusableWhenDisabledProps]
  });
});
if (process.env.NODE_ENV !== "production") ToolbarInput.displayName = "ToolbarInput";