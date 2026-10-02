import type { FieldValidityData } from "../root/FieldRoot.js";
/**
 * Combines the field's client-side, stateful validity data with the external invalid state to
 * determine the field's true validity.
 */
export declare function getCombinedFieldValidityData(validityData: FieldValidityData, invalid: boolean | undefined): {
  state: {
    valid: boolean | null;
    badInput: boolean;
    customError: boolean;
    patternMismatch: boolean;
    rangeOverflow: boolean;
    rangeUnderflow: boolean;
    stepMismatch: boolean;
    tooLong: boolean;
    tooShort: boolean;
    typeMismatch: boolean;
    valueMissing: boolean;
  };
  error: string;
  errors: string[];
  value: unknown;
  initialValue: unknown;
};