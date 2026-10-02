import * as React from 'react';
export type MeterRootContext = {
  formattedValue: string;
  /**
   * The value normalized to a `0`–`100` percentage of the range, clamped to those bounds.
   */
  percentageValue: number;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  value: number;
};
export declare const MeterRootContext: React.Context<MeterRootContext | undefined>;
export declare function useMeterRootContext(): MeterRootContext;