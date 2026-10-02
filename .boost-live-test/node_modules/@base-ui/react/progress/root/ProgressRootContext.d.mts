import * as React from 'react';
import type { ProgressRootState } from "./ProgressRoot.mjs";
export type ProgressRootContext = {
  /**
   * Formatted value of the component.
   */
  formattedValue: string;
  /**
   * The value normalized to a `0`–`100` percentage of the range, clamped to those bounds.
   * `null` while the progress is indeterminate.
   */
  percentageValue: number | null;
  /**
   * Value of the component.
   */
  value: number | null;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  state: ProgressRootState;
};
export declare function useProgressRootContext(): ProgressRootContext;