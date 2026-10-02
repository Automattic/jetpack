import * as React from 'react';
export interface ComboboxChipsContext {
  highlightedChipIndex: number | undefined;
  setHighlightedChipIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
  chipsRef: React.RefObject<Array<HTMLButtonElement | null>>;
}
export declare const ComboboxChipsContext: React.Context<ComboboxChipsContext | undefined>;
export declare function useComboboxChipsContext(): ComboboxChipsContext | undefined;