import * as React from 'react';
import type { UseFieldValidationReturnValue } from "../field/root/useFieldValidation.mjs";
import type { UseCheckboxGroupParentReturnValue } from "./useCheckboxGroupParent.mjs";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.mjs";
import type { BaseUIEventReasons } from "../internals/reasons.mjs";
import type { LabelableContext } from "../internals/labelable-provider/LabelableContext.mjs";
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