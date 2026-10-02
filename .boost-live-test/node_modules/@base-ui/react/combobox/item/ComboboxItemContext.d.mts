import * as React from 'react';
export interface ComboboxItemContext {
  selected: boolean;
  textRef: React.RefObject<HTMLElement | null>;
}
export declare const ComboboxItemContext: React.Context<ComboboxItemContext | undefined>;
export declare function useComboboxItemContext(): ComboboxItemContext;