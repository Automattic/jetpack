'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useFieldRootContext } from "../../internals/field-root-context/FieldRootContext.mjs";
import { fieldValidityMapping } from "../../internals/field-constants/constants.mjs";
import { useLabel } from "../../internals/labelable-provider/useLabel.mjs";
import { getDefaultLabelId } from "../../utils/resolveAriaLabelledBy.mjs";
import { useSelectRootContext } from "../root/SelectRootContext.mjs";

/**
 * An accessible label that is automatically associated with the select trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectLabel = /*#__PURE__*/React.forwardRef(function SelectLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  // Keep label id derived from the root and ignore runtime `id` overrides from untyped consumers.
  const elementPropsWithoutId = elementProps;
  delete elementPropsWithoutId.id;
  const fieldRootContext = useFieldRootContext();
  const store = useSelectRootContext();
  const triggerElement = store.useState('triggerElement');
  const rootId = store.useState('id');
  const defaultLabelId = getDefaultLabelId(rootId);
  const labelProps = useLabel({
    id: defaultLabelId,
    fallbackControlId: triggerElement?.id ?? rootId,
    setLabelId(nextLabelId) {
      const resolvedLabelId = typeof nextLabelId === 'function' ? nextLabelId(store.state.labelId) : nextLabelId;
      store.set('labelId', resolvedLabelId);
    }
  });
  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state: fieldRootContext.state,
    props: [labelProps, elementProps],
    stateAttributesMapping: fieldValidityMapping
  });
});
if (process.env.NODE_ENV !== "production") SelectLabel.displayName = "SelectLabel";