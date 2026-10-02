import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { SliderRootState } from "../root/SliderRoot.js";
/**
 * Visualizes the current value of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export declare const SliderIndicator: React.ForwardRefExoticComponent<Omit<SliderIndicatorProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SliderIndicatorState extends SliderRootState {}
export interface SliderIndicatorProps extends BaseUIComponentProps<'div', SliderIndicatorState> {}
export declare namespace SliderIndicator {
  type State = SliderIndicatorState;
  type Props = SliderIndicatorProps;
}