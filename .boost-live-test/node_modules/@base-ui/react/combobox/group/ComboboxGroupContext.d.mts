import * as React from 'react';
export interface ComboboxGroupContext {
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * Optional list of items that belong to this group. Used by nested
   * collections to render group-specific items.
   */
  items?: readonly any[] | undefined;
}
export declare const ComboboxGroupContext: React.Context<ComboboxGroupContext | undefined>;
export declare function useComboboxGroupContext(): ComboboxGroupContext;