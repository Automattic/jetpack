'use client';

import * as React from 'react';
import { formatNumber } from '@base-ui/utils/formatNumber';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useSliderRootContext } from "../root/SliderRootContext.mjs";
import { sliderStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderValue = /*#__PURE__*/React.forwardRef(function SliderValue(componentProps, forwardedRef) {
  const {
    'aria-live': ariaLive = 'off',
    render,
    className,
    children,
    style,
    ...elementProps
  } = componentProps;
  const {
    thumbMap,
    state,
    values,
    format,
    locale
  } = useSliderRootContext();
  const outputFor = Array.from(thumbMap.values(), ({
    inputId
  }) => inputId).join(' ').trim() || undefined;
  const formattedValues = React.useMemo(() => values.map(v => formatNumber(v, locale, format)), [format, locale, values]);
  const defaultDisplayValue = formattedValues.join(' – ');
  const element = useRenderElement('output', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      // off by default because it will keep announcing when the slider is being dragged
      // and also when the value is changing (but not yet committed)
      'aria-live': ariaLive,
      children: typeof children === 'function' ? children(formattedValues, values) : defaultDisplayValue,
      htmlFor: outputFor
    }, elementProps],
    stateAttributesMapping: sliderStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SliderValue.displayName = "SliderValue";