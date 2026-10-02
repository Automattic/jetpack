'use client';

import * as React from 'react';
import { FieldsetRootContext, useFieldsetRootContext } from "./FieldsetRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Groups a shared legend with related controls.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const FieldsetRoot = /*#__PURE__*/React.forwardRef(function FieldsetRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;
  const [legendId, setLegendId] = React.useState(undefined);
  const parentDisabled = useFieldsetRootContext(true)?.disabled;
  const disabled = parentDisabled || disabledProp;
  const state = {
    disabled
  };
  const element = useRenderElement('fieldset', componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      'aria-labelledby': legendId,
      disabled
    }, elementProps]
  });
  const contextValue = React.useMemo(() => ({
    legendId,
    setLegendId,
    disabled
  }), [legendId, setLegendId, disabled]);
  return /*#__PURE__*/_jsx(FieldsetRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") FieldsetRoot.displayName = "FieldsetRoot";