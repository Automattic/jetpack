import type { FieldRootState } from "../../field/root/FieldRoot.js";
export declare const DEFAULT_VALIDITY_STATE: {
  badInput: boolean;
  customError: boolean;
  patternMismatch: boolean;
  rangeOverflow: boolean;
  rangeUnderflow: boolean;
  stepMismatch: boolean;
  tooLong: boolean;
  tooShort: boolean;
  typeMismatch: boolean;
  valid: null;
  valueMissing: boolean;
};
export declare const DEFAULT_FIELD_STATE_ATTRIBUTES: Pick<FieldRootState, 'valid' | 'touched' | 'dirty' | 'filled' | 'focused'>;
export declare const DEFAULT_FIELD_ROOT_STATE: FieldRootState;
export declare const fieldValidityMapping: {
  valid(value: boolean | null): Record<string, string> | null;
};