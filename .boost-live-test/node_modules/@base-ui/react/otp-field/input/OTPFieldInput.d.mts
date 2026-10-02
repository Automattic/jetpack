import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { OTPFieldRootState } from "../root/OTPFieldRoot.mjs";
/**
 * An individual OTP character input.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export declare const OTPFieldInput: React.ForwardRefExoticComponent<Omit<OTPFieldInputProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
export interface OTPFieldInputState extends Omit<OTPFieldRootState, 'filled' | 'value'> {
  /**
   * Whether this input contains a character.
   */
  filled: boolean;
  /**
   * The input index.
   */
  index: number;
  /**
   * The character rendered in this slot.
   */
  value: string;
}
export interface OTPFieldInputProps extends BaseUIComponentProps<'input', OTPFieldInputState, React.ComponentPropsWithRef<'input'>> {}
export declare namespace OTPFieldInput {
  type State = OTPFieldInputState;
  type Props = OTPFieldInputProps;
}