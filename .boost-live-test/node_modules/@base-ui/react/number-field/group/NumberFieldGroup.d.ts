import * as React from 'react';
import type { NumberFieldRootState } from "../root/NumberFieldRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export declare const NumberFieldGroup: React.ForwardRefExoticComponent<Omit<NumberFieldGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NumberFieldGroupState extends NumberFieldRootState {}
export interface NumberFieldGroupProps extends BaseUIComponentProps<'div', NumberFieldGroupState> {}
export declare namespace NumberFieldGroup {
  type State = NumberFieldGroupState;
  type Props = NumberFieldGroupProps;
}