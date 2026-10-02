import * as React from 'react';
import type { AccordionRoot } from "./AccordionRoot.js";
export interface AccordionRootContext<Value = any> {
  disabled: boolean;
  handleValueChange: (newValue: AccordionRoot.Value<Value>[number], nextOpen: boolean, eventDetails: AccordionRoot.ChangeEventDetails) => void;
  hiddenUntilFound: boolean;
  keepMounted: boolean;
  state: AccordionRoot.State<Value>;
  value: AccordionRoot.Value<Value>;
}
export declare const AccordionRootContext: React.Context<AccordionRootContext<any> | undefined>;
export declare function useAccordionRootContext<Value = any>(): AccordionRootContext<Value>;