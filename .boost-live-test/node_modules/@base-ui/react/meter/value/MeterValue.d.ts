import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { MeterRootState } from "../root/MeterRoot.js";
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export declare const MeterValue: React.ForwardRefExoticComponent<Omit<MeterValueProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface MeterValueState extends MeterRootState {}
export interface MeterValueProps extends Omit<BaseUIComponentProps<'span', MeterValueState>, 'children'> {
  children?: null | ((formattedValue: string, value: number) => React.ReactNode) | undefined;
}
export declare namespace MeterValue {
  type State = MeterValueState;
  type Props = MeterValueProps;
}