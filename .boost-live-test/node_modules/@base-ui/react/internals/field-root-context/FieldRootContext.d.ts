import * as React from 'react';
import type { FieldValidityData, FieldRootState } from "../../field/root/FieldRoot.js";
import type { Form } from "../../form/index.js";
import type { UseFieldValidationReturnValue } from "../../field/root/useFieldValidation.js";
import type { FieldControlRegistration } from "../field-register-control/useFieldControlRegistration.js";
export interface FieldRootContext {
  invalid: boolean | undefined;
  name: string | undefined;
  validityData: FieldValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  disabled: boolean | undefined;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setFilled: React.Dispatch<React.SetStateAction<boolean>>;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  validationMode: Form.ValidationMode;
  shouldValidateOnChange: () => boolean;
  state: FieldRootState;
  registerFieldControl: (source: symbol, registration: FieldControlRegistration | undefined) => void;
  validation: UseFieldValidationReturnValue;
}
export declare const DEFAULT_FIELD_ROOT_CONTEXT: FieldRootContext;
export declare const FieldRootContext: React.Context<FieldRootContext>;
export declare function useFieldRootContext(optional?: boolean): FieldRootContext;