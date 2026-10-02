import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
import type { NumberFieldRootState } from "../root/NumberFieldRoot.mjs";
/**
 * A stepper button that decreases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export declare const NumberFieldDecrement: React.ForwardRefExoticComponent<Omit<NumberFieldDecrementProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface NumberFieldDecrementState extends NumberFieldRootState {}
export interface NumberFieldDecrementProps extends NativeButtonProps, BaseUIComponentProps<'button', NumberFieldDecrementState> {}
export declare namespace NumberFieldDecrement {
  type State = NumberFieldDecrementState;
  type Props = NumberFieldDecrementProps;
}