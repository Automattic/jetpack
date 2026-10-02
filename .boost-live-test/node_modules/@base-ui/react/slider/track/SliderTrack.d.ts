import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { SliderRootState } from "../root/SliderRoot.js";
/**
 * Contains the slider indicator and represents the entire range of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export declare const SliderTrack: React.ForwardRefExoticComponent<Omit<SliderTrackProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SliderTrackState extends SliderRootState {}
export interface SliderTrackProps extends BaseUIComponentProps<'div', SliderTrackState> {}
export declare namespace SliderTrack {
  type State = SliderTrackState;
  type Props = SliderTrackProps;
}