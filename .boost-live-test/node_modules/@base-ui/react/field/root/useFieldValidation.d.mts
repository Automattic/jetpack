import * as React from 'react';
import type { Form } from "../../form/index.mjs";
import type { HTMLProps } from "../../internals/types.mjs";
import type { FieldValidityData, FieldRootState } from "./FieldRoot.mjs";
export type RegisteredInput = {
  controlRef: React.RefObject<HTMLElement | null>;
  value: string | undefined;
};
export type RegisteredInputs = Map<HTMLInputElement, RegisteredInput>;
/**
 * Whether an input participates in the surrounding Base UI Form. Inputs that are effectively
 * disabled, or whose `form` attribute explicitly associates them with another form, are excluded.
 * DOM position only matters when it associates the input with a different form. Otherwise, field
 * registration is context-driven, so portaled inputs (for example inside a dialog) still belong to
 * the form for both validation and values projected into `onFormSubmit`.
 */
export declare function isEligibleInput(input: HTMLInputElement, formElement: HTMLFormElement | null): boolean;
export declare function useFieldValidation(params: UseFieldValidationParameters): UseFieldValidationReturnValue;
export interface UseFieldValidationParameters {
  setValidityData: (data: FieldValidityData) => void;
  validate: (value: unknown, formValues: Form.Values) => string | string[] | null | void | Promise<string | string[] | null | void>;
  validityData: FieldValidityData;
  validationDebounceTime: number;
  invalid: boolean;
  markedDirtyRef: React.RefObject<boolean>;
  state: FieldRootState;
  shouldValidateOnChange: () => boolean;
  validationMode: Form.ValidationMode;
  registeredFieldIdRef: React.RefObject<string | undefined>;
}
export interface UseFieldValidationReturnValue {
  getValidationProps: (disabled: boolean, props?: HTMLProps) => HTMLProps;
  inputRef: React.RefObject<HTMLInputElement | null>;
  registeredInputs: RegisteredInputs;
  registerInput: (element: HTMLInputElement, registration: RegisteredInput) => void | (() => void);
  getInputControl: () => HTMLElement | null;
  commit: (value: unknown) => Promise<void>;
  change: (value: unknown, cancelPending?: boolean) => void;
}