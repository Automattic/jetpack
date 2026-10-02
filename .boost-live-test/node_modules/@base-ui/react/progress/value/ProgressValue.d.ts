import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { ProgressRootState } from "../root/ProgressRoot.js";
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export declare const ProgressValue: React.ForwardRefExoticComponent<Omit<ProgressValueProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface ProgressValueState extends ProgressRootState {}
export interface ProgressValueProps extends Omit<BaseUIComponentProps<'span', ProgressValueState>, 'children'> {
  children?: null | ((formattedValue: string | null, value: number | null) => React.ReactNode) | undefined;
}
export declare namespace ProgressValue {
  type State = ProgressValueState;
  type Props = ProgressValueProps;
}