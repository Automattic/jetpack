import * as React from 'react';
import type { MeterRootState } from "../root/MeterRoot.js";
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export declare const MeterTrack: React.ForwardRefExoticComponent<Omit<MeterTrackProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MeterTrackState extends MeterRootState {}
export interface MeterTrackProps extends BaseUIComponentProps<'div', MeterTrackState> {}
export declare namespace MeterTrack {
  type State = MeterTrackState;
  type Props = MeterTrackProps;
}