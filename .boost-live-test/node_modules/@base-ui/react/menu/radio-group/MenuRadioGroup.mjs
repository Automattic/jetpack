'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { MenuRadioGroupContext } from "./MenuRadioGroupContext.mjs";
import { MenuGroupContext } from "../group/MenuGroupContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Groups related radio items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRadioGroup = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef(function MenuRadioGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    value: valueProp,
    defaultValue,
    onValueChange: onValueChangeProp,
    disabled = false,
    style,
    'aria-labelledby': ariaLabelledByProp,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState(undefined);
  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'MenuRadioGroup'
  });
  const setValue = useStableCallback((newValue, eventDetails) => {
    onValueChangeProp?.(newValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueUnwrapped(newValue);
  });
  const state = {
    disabled
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: {
      role: 'group',
      'aria-labelledby': ariaLabelledByProp ?? labelId,
      'aria-disabled': disabled || undefined,
      ...elementProps
    }
  });
  const context = React.useMemo(() => ({
    value,
    setValue,
    disabled
  }), [value, setValue, disabled]);
  return /*#__PURE__*/_jsx(MenuGroupContext.Provider, {
    value: setLabelId,
    children: /*#__PURE__*/_jsx(MenuRadioGroupContext.Provider, {
      value: context,
      children: element
    })
  });
}));
if (process.env.NODE_ENV !== "production") MenuRadioGroup.displayName = "MenuRadioGroup";