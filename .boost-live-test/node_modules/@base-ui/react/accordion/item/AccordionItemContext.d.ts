import * as React from 'react';
import type { AccordionItemState } from "./AccordionItem.js";
export interface AccordionItemContext {
  defaultTriggerId?: string | undefined;
  open: boolean;
  state: AccordionItemState;
  setTriggerId: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  triggerId?: string | undefined;
}
export declare const AccordionItemContext: React.Context<AccordionItemContext | undefined>;
export declare function useAccordionItemContext(): AccordionItemContext;