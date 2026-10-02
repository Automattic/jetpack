import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
import type { NumberFieldRootState } from "../root/NumberFieldRoot.js";
/**
 * A stepper button that increases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export declare const NumberFieldIncrement: React.ForwardRefExoticComponent<Omit<NumberFieldIncrementProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface NumberFieldIncrementState extends NumberFieldRootState {}
export interface NumberFieldIncrementProps extends NativeButtonProps, BaseUIComponentProps<'button', NumberFieldIncrementState> {}
export declare namespace NumberFieldIncrement {
  type State = NumberFieldIncrementState;
  type Props = NumberFieldIncrementProps;
}