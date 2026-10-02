import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { AccordionItemState } from "../item/AccordionItem.js";
/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export declare const AccordionHeader: React.ForwardRefExoticComponent<Omit<AccordionHeaderProps, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
export interface AccordionHeaderState extends AccordionItemState {}
export interface AccordionHeaderProps extends BaseUIComponentProps<'h3', AccordionHeaderState> {}
export declare namespace AccordionHeader {
  type State = AccordionHeaderState;
  type Props = AccordionHeaderProps;
}