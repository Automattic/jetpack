import * as React from 'react';
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.js";
import type { BaseUIEventReasons } from "../internals/reasons.js";
export interface ToggleGroupContext<Value> {
  value: readonly Value[];
  setGroupValue: (newValue: Value, nextPressed: boolean, eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>) => void;
  disabled: boolean;
  /**
   * Indicates whether the value has been initialized via `value` or `defaultValue` props.
   * Used to determine if Toggle should warn users about data inconsistency problems.
   */
  isValueInitialized: boolean;
}
export declare const ToggleGroupContext: React.Context<ToggleGroupContext<any> | undefined>;
export declare function useToggleGroupContext<Value>(): ToggleGroupContext<Value> | undefined;