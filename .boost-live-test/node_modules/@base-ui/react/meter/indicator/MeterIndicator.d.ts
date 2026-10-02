import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { MeterRootState } from "../root/MeterRoot.js";
/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export declare const MeterIndicator: React.ForwardRefExoticComponent<Omit<MeterIndicatorProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MeterIndicatorState extends MeterRootState {}
export interface MeterIndicatorProps extends BaseUIComponentProps<'div', MeterIndicatorState> {}
export declare namespace MeterIndicator {
  type State = MeterIndicatorState;
  type Props = MeterIndicatorProps;
}