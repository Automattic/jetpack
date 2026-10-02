import * as React from 'react';
import type { FieldValidityData } from "../../field/root/FieldRoot.mjs";
import type { Form } from "../../form/Form.mjs";
export type Errors = Record<string, string | string[]>;
export interface FormContext {
  errors: Errors;
  clearErrors: (name: string | undefined) => void;
  elementRef: React.RefObject<HTMLFormElement | null>;
  formRef: React.RefObject<{
    fields: Map<string, {
      name: string | undefined;
      /**
       * After this returns, the field registry entry reflects the latest synchronous
       * validity verdict. Async validators do not block submit.
       */
      validate: () => void;
      validityData: FieldValidityData;
      controlRef: React.RefObject<HTMLElement | null>;
      getValue: () => unknown;
    }>;
  }>;
  validationMode: Form.ValidationMode;
  submitCountRef: React.RefObject<number>;
}
export declare const FormContext: React.Context<FormContext>;
export declare function useFormContext(): FormContext;