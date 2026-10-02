'use client';

import * as React from 'react';
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { FieldItemContext } from "./FieldItemContext.mjs";
import { LabelableProvider } from "../../internals/labelable-provider/index.mjs";

/**
 * Groups individual items in a checkbox group or radio group with a label and description.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const FieldItem = /*#__PURE__*/React.forwardRef(function FieldItem(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState,
    disabled: rootDisabled
  } = useFieldRootContext(false);
  const disabled = rootDisabled || disabledProp;
  const state = {
    ...fieldState,
    disabled
  };
  const fieldItemContext = React.useMemo(() => ({
    disabled
  }), [disabled]);
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping
  });
  return /*#__PURE__*/_jsx(LabelableProvider, {
    children: /*#__PURE__*/_jsx(FieldItemContext.Provider, {
      value: fieldItemContext,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") FieldItem.displayName = "FieldItem";