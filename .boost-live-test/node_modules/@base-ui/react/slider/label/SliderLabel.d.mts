import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { SliderRoot } from "../root/SliderRoot.mjs";
/**
 * An accessible label that is automatically associated with the slider thumbs.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export declare const SliderLabel: React.ForwardRefExoticComponent<Omit<SliderLabelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export type SliderLabelState = SliderRoot.State;
export interface SliderLabelProps extends Omit<BaseUIComponentProps<'div', SliderLabel.State>, 'id'> {}
export declare namespace SliderLabel {
  type State = SliderLabelState;
  type Props = SliderLabelProps;
}