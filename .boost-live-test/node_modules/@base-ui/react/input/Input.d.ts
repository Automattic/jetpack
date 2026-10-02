import * as React from 'react';
import type { BaseUIComponentProps } from "../internals/types.js";
import { Field, type FieldControlState } from "../field/index.js";
/**
 * A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Input](https://base-ui.com/react/components/input)
 */
export declare const Input: React.ForwardRefExoticComponent<Omit<InputProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface InputProps extends BaseUIComponentProps<'input', InputState> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?: ((value: string, eventDetails: Input.ChangeEventDetails) => void) | undefined;
  /**
   * The default value of the input. Use when uncontrolled.
   */
  defaultValue?: Field.Control.Props['defaultValue'] | undefined;
  /**
   * The value of the input. Use when controlled.
   */
  value?: React.ComponentProps<'input'>['value'] | undefined;
}
export interface InputState extends FieldControlState {}
export type InputChangeEventReason = Field.Control.ChangeEventReason;
export type InputChangeEventDetails = Field.Control.ChangeEventDetails;
export declare namespace Input {
  type Props = InputProps;
  type State = InputState;
  type ChangeEventReason = InputChangeEventReason;
  type ChangeEventDetails = InputChangeEventDetails;
}