import * as React from 'react';
import type { UseFieldValidationReturnValue } from "../field/root/useFieldValidation.js";
import type { UseCheckboxGroupParentReturnValue } from "./useCheckboxGroupParent.js";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.js";
import type { BaseUIEventReasons } from "../internals/reasons.js";
import type { LabelableContext } from "../internals/labelable-provider/LabelableContext.js";
export interface CheckboxGroupContext {
  value: string[];
  setValue: (value: string[], eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParentReturnValue;
  disabled: boolean;
  validation: UseFieldValidationReturnValue;
  /**
   * `registerControlId` of the labelable scope the group renders in. A checkbox seeing the same
   * function shares that scope, so the group, not the checkbox, is the field's control.
   */
  registerControlId: LabelableContext['registerControlId'];
}
export declare const CheckboxGroupContext: React.Context<CheckboxGroupContext | undefined>;
export declare function useCheckboxGroupContext(): CheckboxGroupContext | undefined;