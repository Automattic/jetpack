import * as React from 'react';
import type { BaseUIComponentProps } from "../internals/types.js";
import type { FieldRootState } from "../field/root/FieldRoot.js";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.js";
import { REASONS } from "../internals/reasons.js";
/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 */
export declare const RadioGroup: {
  <Value>(props: RadioGroup.Props<Value>): React.JSX.Element;
};
export interface RadioGroupState extends FieldRootState {
  /**
   * Whether the user should be unable to select a different radio button in the group.
   */
  readOnly: boolean;
  /**
   * Whether the user must tick a radio button within the group before submitting a form.
   */
  required: boolean;
}
export interface RadioGroupProps<Value = any> extends Omit<BaseUIComponentProps<'div', RadioGroupState>, 'value'> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to select a different radio button in the group.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * Identifies the form that owns the radio inputs.
   * Useful when the radio group is rendered outside the form.
   */
  form?: string | undefined;
  /**
   * The controlled value of the radio item that should be currently selected.
   *
   * To render an uncontrolled radio group, use the `defaultValue` prop instead.
   */
  value?: Value | undefined;
  /**
   * The uncontrolled value of the radio button that should be initially selected.
   *
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Callback fired when the value changes.
   */
  onValueChange?: ((value: Value, eventDetails: RadioGroup.ChangeEventDetails) => void) | undefined;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
}
export type RadioGroupChangeEventReason = typeof REASONS.none;
export type RadioGroupChangeEventDetails = BaseUIChangeEventDetails<RadioGroup.ChangeEventReason>;
export declare namespace RadioGroup {
  type State = RadioGroupState;
  type Props<TValue = any> = RadioGroupProps<TValue>;
  type ChangeEventReason = RadioGroupChangeEventReason;
  type ChangeEventDetails = RadioGroupChangeEventDetails;
}