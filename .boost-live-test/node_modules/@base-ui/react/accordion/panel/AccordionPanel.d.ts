import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { AccordionRoot } from "../root/AccordionRoot.js";
import type { AccordionItemState } from "../item/AccordionItem.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export declare const AccordionPanel: React.ForwardRefExoticComponent<Omit<AccordionPanelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface AccordionPanelState extends AccordionItemState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface AccordionPanelProps extends BaseUIComponentProps<'div', AccordionPanelState>, Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}
export declare namespace AccordionPanel {
  type State = AccordionPanelState;
  type Props = AccordionPanelProps;
}