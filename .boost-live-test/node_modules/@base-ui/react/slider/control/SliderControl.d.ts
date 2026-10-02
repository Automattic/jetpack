import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { SliderRootState } from "../root/SliderRoot.js";
/**
 * The clickable, interactive part of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export declare const SliderControl: React.ForwardRefExoticComponent<Omit<SliderControlProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SliderControlState extends SliderRootState {}
export interface SliderControlProps extends BaseUIComponentProps<'div', SliderControlState> {}
export declare namespace SliderControl {
  type State = SliderControlState;
  type Props = SliderControlProps;
}