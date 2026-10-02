import * as React from 'react';
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.mjs";
import type { BaseUIEventReasons } from "../internals/reasons.mjs";
export declare function useCheckboxGroupParent(params: UseCheckboxGroupParentParameters): UseCheckboxGroupParentReturnValue;
export interface UseCheckboxGroupParentParameters {
  allValues?: string[] | undefined;
  value: string[];
  onValueChange?: ((value: string[], eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void) | undefined;
}
export interface UseCheckboxGroupParentReturnValue {
  disabledStatesRef: React.RefObject<Map<string, boolean>>;
  /**
   * Reports the `id` of the element a child checkbox exposes.
   */
  registerChildId: (value: string, id: string) => () => void;
  getParentProps: () => {
    indeterminate: boolean;
    checked: boolean;
    'aria-controls': string | undefined;
    onCheckedChange: (checked: boolean, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  };
  getChildProps: (value: string) => {
    checked: boolean;
    onCheckedChange: (checked: boolean, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  };
}