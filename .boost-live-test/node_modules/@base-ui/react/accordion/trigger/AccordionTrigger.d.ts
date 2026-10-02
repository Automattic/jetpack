import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
import type { AccordionItemState } from "../item/AccordionItem.js";
/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export declare const AccordionTrigger: React.ForwardRefExoticComponent<Omit<AccordionTriggerProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface AccordionTriggerState extends AccordionItemState {}
export interface AccordionTriggerProps extends NativeButtonProps, BaseUIComponentProps<'button', AccordionTriggerState> {}
export declare namespace AccordionTrigger {
  type State = AccordionTriggerState;
  type Props = AccordionTriggerProps;
}