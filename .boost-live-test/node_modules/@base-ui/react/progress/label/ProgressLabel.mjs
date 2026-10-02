'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useRegisteredLabelId } from "../../utils/useRegisteredLabelId.mjs";
import { useProgressRootContext } from "../root/ProgressRootContext.mjs";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
/**
 * An accessible label for the progress bar.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressLabel = /*#__PURE__*/React.forwardRef(function ProgressLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    setLabelId,
    state
  } = useProgressRootContext();
  const id = useRegisteredLabelId(idProp, setLabelId);
  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      id,
      role: 'presentation'
    }, elementProps],
    stateAttributesMapping: progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressLabel.displayName = "ProgressLabel";