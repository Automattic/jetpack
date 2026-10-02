import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { NumberFieldRootState } from "../root/NumberFieldRoot.mjs";
/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export declare const NumberFieldInput: React.ForwardRefExoticComponent<Omit<NumberFieldInputProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
export interface NumberFieldInputState extends NumberFieldRootState {}
export interface NumberFieldInputProps extends BaseUIComponentProps<'input', NumberFieldInputState, React.ComponentPropsWithRef<'input'>> {
  /**
   * A user-friendly description of the input's role for assistive tech. This is a role
   * description, not an accessible name — use `Field.Label` or `aria-label` to name the control.
   * @default 'Number field'
   */
  'aria-roledescription'?: React.AriaAttributes['aria-roledescription'] | undefined;
}
export declare namespace NumberFieldInput {
  type State = NumberFieldInputState;
  type Props = NumberFieldInputProps;
}