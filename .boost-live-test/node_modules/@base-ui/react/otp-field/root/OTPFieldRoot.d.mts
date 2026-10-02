import * as React from 'react';
import type { FieldRootState } from "../../field/root/FieldRoot.mjs";
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import { type BaseUIChangeEventDetails, type BaseUIGenericEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { type OTPValidationType } from "../utils/otp.mjs";
/**
 * Groups all OTP field parts and manages their state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export declare const OTPFieldRoot: React.ForwardRefExoticComponent<Omit<OTPFieldRootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface OTPFieldRootProps extends Omit<BaseUIComponentProps<'div', OTPFieldRootState>, 'onChange'> {
  /**
   * The id of the first input element.
   * Subsequent inputs derive their ids from it (`{id}-2`, `{id}-3`, and so on).
   */
  id?: string | undefined;
  /**
   * The input autocomplete attribute. Applied to the first slot and hidden validation input.
   * @default 'one-time-code'
   */
  autoComplete?: string | undefined;
  /**
   * A string specifying the `form` element with which the hidden input is associated.
   * This string's value must match the id of a `form` element in the same document.
   */
  form?: string | undefined;
  /**
   * The number of OTP input slots.
   * Required so the root can clamp values, detect completion, and generate
   * consistent validation markup before all slots hydrate.
   */
  length: number;
  /**
   * Whether to submit the owning form when the OTP becomes complete.
   * @default false
   */
  autoSubmit?: boolean | undefined;
  /**
   * Whether the slot inputs should mask entered characters.
   * Pass `type` directly to individual `<OTPField.Input>` parts to use a custom
   * input type.
   * @default false
   */
  mask?: boolean | undefined;
  /**
   * The virtual keyboard hint applied to the slot inputs and hidden validation input.
   *
   * Built-in validation modes provide sensible defaults, but you can override them when needed.
   */
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] | undefined;
  /**
   * The type of input validation to apply to the OTP value.
   * @default 'numeric'
   */
  validationType?: OTPFieldRoot.ValidationType | undefined;
  /**
   * Function that normalizes the OTP value after whitespace and `validationType` filtering.
   * It runs whenever OTP Field normalizes a value, including initial/default values, controlled
   * values, and user edits.
   *
   * The returned value is filtered by `validationType` again, then clamped to `length`.
   * It should be idempotent because OTP Field may normalize the same value more than once while
   * handling edits, storing state, and rendering controlled or uncontrolled values. Non-idempotent
   * normalizers can compound across those normalization passes. Characters rejected while
   * normalizing typed or pasted text are reported through `onValueInvalid`.
   */
  normalizeValue?: ((value: string) => string) | undefined;
  /**
   * Whether the user must enter a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * The OTP value.
   */
  value?: string | undefined;
  /**
   * The uncontrolled OTP value when the component is initially rendered.
   */
  defaultValue?: string | undefined;
  /**
   * Callback fired when the OTP value changes.
   *
   * The `eventDetails.reason` indicates what triggered the change:
   * - `'input-change'` for typing or autofill
   * - `'input-clear'` when a character is removed by text input
   * - `'input-paste'` for paste interactions
   * - `'keyboard'` for keyboard interactions that change the value
   */
  onValueChange?: ((value: string, eventDetails: OTPFieldRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Callback fired when entered text contains characters that are rejected by validation or
   * normalization before the OTP value updates.
   *
   * The `value` argument is the attempted user-entered string before normalization.
   */
  onValueInvalid?: ((value: string, eventDetails: OTPFieldRoot.InvalidEventDetails) => void) | undefined;
  /**
   * Callback function that is fired when the OTP value becomes complete, or when a complete value
   * is pasted while the OTP is already complete.
   *
   * When the value changes, it runs later than `onValueChange`, after the internal value update is
   * applied. If a complete pasted value matches the current value, `onValueChange` does not fire.
   *
   * If `autoSubmit` is enabled, it runs immediately before the owning form is submitted.
   */
  onValueComplete?: ((value: string, eventDetails: OTPFieldRoot.CompleteEventDetails) => void) | undefined;
}
export interface OTPFieldRootState extends FieldRootState {
  /**
   * Whether all slots are filled.
   */
  complete: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The number of OTP input slots.
   */
  length: number;
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean;
  /**
   * Whether the user must enter a value before submitting a form.
   */
  required: boolean;
  /**
   * The OTP value.
   */
  value: string;
}
export type OTPFieldRootChangeEventReason = typeof REASONS.inputChange | typeof REASONS.inputClear | typeof REASONS.inputPaste | typeof REASONS.keyboard;
export type OTPFieldRootChangeEventDetails = BaseUIChangeEventDetails<OTPFieldRoot.ChangeEventReason>;
export type OTPFieldRootInvalidEventReason = typeof REASONS.inputChange | typeof REASONS.inputPaste;
export type OTPFieldRootInvalidEventDetails = BaseUIGenericEventDetails<OTPFieldRoot.InvalidEventReason>;
export type OTPFieldRootCompleteEventReason = typeof REASONS.inputChange | typeof REASONS.inputPaste;
export type OTPFieldRootCompleteEventDetails = BaseUIGenericEventDetails<OTPFieldRoot.CompleteEventReason>;
export declare namespace OTPFieldRoot {
  type State = OTPFieldRootState;
  type Props = OTPFieldRootProps;
  type ValidationType = OTPValidationType;
  type ChangeEventReason = OTPFieldRootChangeEventReason;
  type ChangeEventDetails = OTPFieldRootChangeEventDetails;
  type InvalidEventReason = OTPFieldRootInvalidEventReason;
  type InvalidEventDetails = OTPFieldRootInvalidEventDetails;
  type CompleteEventReason = OTPFieldRootCompleteEventReason;
  type CompleteEventDetails = OTPFieldRootCompleteEventDetails;
}