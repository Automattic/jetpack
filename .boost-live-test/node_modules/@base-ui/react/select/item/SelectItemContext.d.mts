import * as React from 'react';
export interface SelectItemContext {
  selected: boolean;
  index: number;
  textRef: React.RefObject<HTMLElement | null>;
  selectedByFocus: boolean;
}
export declare const SelectItemContext: React.Context<SelectItemContext | undefined>;
export declare function useSelectItemContext(): SelectItemContext;