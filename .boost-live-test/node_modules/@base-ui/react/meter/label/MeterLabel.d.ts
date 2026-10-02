import * as React from 'react';
import type { MeterRootState } from "../root/MeterRoot.js";
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export declare const MeterLabel: React.ForwardRefExoticComponent<Omit<MeterLabelProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface MeterLabelState extends MeterRootState {}
export interface MeterLabelProps extends BaseUIComponentProps<'span', MeterLabelState> {}
export declare namespace MeterLabel {
  type State = MeterLabelState;
  type Props = MeterLabelProps;
}