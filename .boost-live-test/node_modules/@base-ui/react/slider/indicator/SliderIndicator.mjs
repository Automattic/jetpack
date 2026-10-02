'use client';

import * as React from 'react';
import { valueToPercent } from "../../utils/valueToPercent.mjs";
import { useIsHydrating } from "../../utils/useIsHydrating.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useSliderRootContext } from "../root/SliderRootContext.mjs";
import { sliderStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
function getIndicatorStyles(vertical, range, inset, start, end, forceHidden) {
  const styles = {
    visibility: forceHidden || inset && (start === undefined || range && end === undefined) ? 'hidden' : undefined,
    position: vertical ? 'absolute' : 'relative',
    [vertical ? 'width' : 'height']: 'inherit'
  };
  let startValue = `${start ?? 0}%`;
  let sizeValue = `${(end ?? 0) - (start ?? 0)}%`;
  if (inset) {
    styles['--start-position'] = startValue;
    startValue = 'var(--start-position)';
    if (range) {
      styles['--relative-size'] = sizeValue;
      sizeValue = 'var(--relative-size)';
    }
  }
  styles[vertical ? 'bottom' : 'insetInlineStart'] = range ? startValue : 0;
  styles[vertical ? 'height' : 'width'] = range ? sizeValue : startValue;
  return styles;
}

/**
 * Visualizes the current value of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderIndicator = /*#__PURE__*/React.forwardRef(function SliderIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style: styleProp,
    ...elementProps
  } = componentProps;
  const {
    indicatorPosition,
    inset,
    max,
    min,
    orientation,
    renderBeforeHydration,
    state,
    values
  } = useSliderRootContext();
  const isHydrating = useIsHydrating();
  const vertical = orientation === 'vertical';
  const range = values.length > 1;
  const style = getIndicatorStyles(vertical, range, inset, inset ? indicatorPosition[0] : valueToPercent(values[0], min, max), inset ? indicatorPosition[1] : valueToPercent(values[values.length - 1], min, max), inset && renderBeforeHydration && isHydrating);
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      ['data-base-ui-slider-indicator']: renderBeforeHydration ? '' : undefined,
      style,
      suppressHydrationWarning: renderBeforeHydration || undefined
    }, elementProps],
    stateAttributesMapping: sliderStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SliderIndicator.displayName = "SliderIndicator";