import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import { type UseCollapsibleRootParameters } from "../../collapsible/root/useCollapsibleRoot.js";
import type { AccordionRootState } from "../root/AccordionRoot.js";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.js";
import { REASONS } from "../../internals/reasons.js";
/**
 * Groups an accordion header with the corresponding panel.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export declare const AccordionItem: React.ForwardRefExoticComponent<Omit<AccordionItemProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface AccordionItemState extends AccordionRootState {
  /**
   * Whether the accordion item's panel is currently hidden.
   */
  hidden: boolean;
  /**
   * The item index.
   */
  index: number;
  /**
   * Whether the component is open.
   */
  open: boolean;
}
export interface AccordionItemProps extends BaseUIComponentProps<'div', AccordionItemState>, Partial<Pick<UseCollapsibleRootParameters, 'disabled'>> {
  /**
   * A unique value that identifies this accordion item.
   * If no value is provided, a unique ID will be generated automatically.
   * Use when controlling the accordion programmatically, or to set an initial
   * open state.
   * @example
   * ```tsx
   * <Accordion.Root value={['a']}>
   *   <Accordion.Item value="a" /> // initially open
   *   <Accordion.Item value="b" /> // initially closed
   * </Accordion.Root>
   * ```
   */
  value?: any;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: AccordionItem.ChangeEventDetails) => void) | undefined;
}
export type AccordionItemChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;
export type AccordionItemChangeEventDetails = BaseUIChangeEventDetails<AccordionItem.ChangeEventReason>;
export declare namespace AccordionItem {
  type State = AccordionItemState;
  type Props = AccordionItemProps;
  type ChangeEventReason = AccordionItemChangeEventReason;
  type ChangeEventDetails = AccordionItemChangeEventDetails;
}