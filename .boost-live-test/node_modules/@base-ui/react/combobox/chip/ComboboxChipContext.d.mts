import * as React from 'react';
export interface ComboboxChipContext {
  index: number;
}
export declare const ComboboxChipContext: React.Context<ComboboxChipContext | undefined>;
export declare function useComboboxChipContext(): ComboboxChipContext;