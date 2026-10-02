import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { SliderRootState } from "../root/SliderRoot.js";
/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export declare const SliderValue: React.ForwardRefExoticComponent<Omit<SliderValueProps, "ref"> & React.RefAttributes<HTMLOutputElement>>;
export interface SliderValueState extends SliderRootState {}
export interface SliderValueProps extends Omit<BaseUIComponentProps<'output', SliderValueState>, 'children'> {
  children?: null | ((formattedValues: readonly string[], values: readonly number[]) => React.ReactNode) | undefined;
}
export declare namespace SliderValue {
  type State = SliderValueState;
  type Props = SliderValueProps;
}