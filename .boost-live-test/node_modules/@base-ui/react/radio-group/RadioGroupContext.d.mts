import * as React from 'react';
import type { UseFieldValidationReturnValue } from "../field/root/useFieldValidation.mjs";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.mjs";
import type { BaseUIEventReasons } from "../internals/reasons.mjs";
export interface RadioGroupContext<Value> {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  form: string | undefined;
  name: string | undefined;
  checkedValue: Value | undefined;
  setCheckedValue: (value: Value, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  validation?: UseFieldValidationReturnValue | undefined;
  registerInputRef: (element: HTMLInputElement | null) => void;
}
export declare const RadioGroupContext: React.Context<RadioGroupContext<any> | undefined>;
export declare function useRadioGroupContext(): RadioGroupContext<any> | undefined;