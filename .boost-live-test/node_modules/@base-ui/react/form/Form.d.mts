import * as React from 'react';
import { type BaseUIGenericEventDetails } from "../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../internals/reasons.mjs";
import type { BaseUIComponentProps } from "../internals/types.mjs";
import { FormContext } from "../internals/form-context/FormContext.mjs";
/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
export declare const Form: {
  <FormValues extends Record<string, any> = Record<string, any>>(props: Form.Props<FormValues> & {
    ref?: React.Ref<HTMLFormElement> | undefined;
  }): React.JSX.Element;
};
export type FormSubmitEventReason = typeof REASONS.none;
export type FormSubmitEventDetails = BaseUIGenericEventDetails<Form.SubmitEventReason>;
export type FormValidationMode = 'onSubmit' | 'onBlur' | 'onChange';
export interface FormActions {
  validate: (fieldName?: string | undefined) => void;
}
export interface FormState {}
export interface FormProps<FormValues extends Record<string, any> = Record<string, any>> extends BaseUIComponentProps<'form', FormState, React.ComponentPropsWithRef<'form'>> {
  /**
   * Determines when the form should be validated.
   * The `validationMode` prop on `<Field.Root>` takes precedence over this.
   *
   * - `onSubmit` (default): validates the field when the form is submitted, afterwards fields will re-validate on change.
   * - `onBlur`: validates a field when it loses focus.
   * - `onChange`: validates the field on every change to its value.
   *
   * @default 'onSubmit'
   */
  validationMode?: FormValidationMode | undefined;
  /**
   * Validation errors returned externally, typically after submission by a server or a form action.
   * This should be an object where keys correspond to the `name` attribute on `<Field.Root>`,
   * and values correspond to error(s) related to that field.
   */
  errors?: FormContext['errors'] | undefined;
  /**
   * Event handler called when the form is submitted.
   * `preventDefault()` is called on the native submit event when used.
   */
  onFormSubmit?: ((formValues: FormValues, eventDetails: Form.SubmitEventDetails) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `validate`: Validates all fields when called. Optionally pass a field name to validate a single field.
   * @example
   * ```tsx
   * // validate all fields
   * actionsRef.current?.validate();
   *
   * // validate one field
   * actionsRef.current?.validate('email');
   * ```
   */
  actionsRef?: React.RefObject<Form.Actions | null> | undefined;
}
export declare namespace Form {
  type Props<FormValues extends Record<string, any> = Record<string, any>> = FormProps<FormValues>;
  type State = FormState;
  type Actions = FormActions;
  type ValidationMode = FormValidationMode;
  type SubmitEventReason = FormSubmitEventReason;
  type SubmitEventDetails = FormSubmitEventDetails;
  type Values<FormValues extends Record<string, any> = Record<string, any>> = FormValues;
}