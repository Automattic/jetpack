import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.mjs";
import type { AccordionRoot } from "../root/AccordionRoot.mjs";
import type { AccordionItemState } from "../item/AccordionItem.mjs";
import type { TransitionStatus } from "../../internals/useTransitionStatus.mjs";
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