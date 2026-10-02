'use client';

import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { focusElementWithVisible, useLabel } from "../../internals/labelable-provider/useLabel.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useSliderRootContext } from "../root/SliderRootContext.mjs";
import { sliderStateAttributesMapping } from "../root/stateAttributesMapping.mjs";

/**
 * An accessible label that is automatically associated with the slider thumbs.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderLabel = /*#__PURE__*/React.forwardRef(function SliderLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  // Keep label id derived from the root and ignore runtime `id` overrides from untyped consumers.
  const elementPropsWithoutId = elementProps;
  delete elementPropsWithoutId.id;
  const {
    state,
    setLabelId,
    controlRef,
    rootLabelId
  } = useSliderRootContext();
  function focusControl(event, controlId) {
    if (controlId) {
      const controlElement = ownerDocument(event.currentTarget).getElementById(controlId);
      if (isHTMLElement(controlElement)) {
        focusElementWithVisible(controlElement);
        return;
      }
    }
    const fallbackInputs = controlRef.current?.querySelectorAll('input[type="range"]');
    const fallbackInput = fallbackInputs?.length === 1 ? fallbackInputs[0] : null;
    if (isHTMLElement(fallbackInput)) {
      focusElementWithVisible(fallbackInput);
    }
  }
  const labelProps = useLabel({
    id: rootLabelId,
    setLabelId,
    focusControl
  });
  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [labelProps, elementProps],
    stateAttributesMapping: sliderStateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") SliderLabel.displayName = "SliderLabel";