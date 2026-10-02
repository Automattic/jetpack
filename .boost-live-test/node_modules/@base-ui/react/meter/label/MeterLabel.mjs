'use client';

import * as React from 'react';
import { useMeterRootContext } from "../root/MeterRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useRegisteredLabelId } from "../../utils/useRegisteredLabelId.mjs";

/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterLabel = /*#__PURE__*/React.forwardRef(function MeterLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    setLabelId
  } = useMeterRootContext();
  const id = useRegisteredLabelId(idProp, setLabelId);
  return useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [{
      id,
      role: 'presentation'
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MeterLabel.displayName = "MeterLabel";