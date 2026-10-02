'use client';

import * as React from 'react';
import { useNumberFieldRootContext } from "../root/NumberFieldRootContext.mjs";
import { stateAttributesMapping } from "../utils/stateAttributesMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldGroup = /*#__PURE__*/React.forwardRef(function NumberFieldGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = useNumberFieldRootContext();
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      role: 'group'
    }, elementProps],
    stateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NumberFieldGroup.displayName = "NumberFieldGroup";