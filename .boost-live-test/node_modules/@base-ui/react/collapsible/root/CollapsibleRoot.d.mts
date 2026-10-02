import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.mjs";
import { type UseCollapsibleRootReturnValue } from "./useCollapsibleRoot.mjs";
import type { BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export declare const CollapsibleRoot: React.ForwardRefExoticComponent<Omit<CollapsibleRootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface CollapsibleRootState extends Pick<UseCollapsibleRootReturnValue, 'open' | 'disabled' | 'transitionStatus'> {}
export interface CollapsibleRootProps extends BaseUIComponentProps<'div', CollapsibleRootState> {
  /**
   * Whether the collapsible panel is currently open.
   *
   * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
   */
  open?: boolean | undefined;
  /**
   * Whether the collapsible panel is initially open.
   *
   * To render a controlled collapsible, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: CollapsibleRootChangeEventDetails) => void) | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
export type CollapsibleRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;
export type CollapsibleRootChangeEventDetails = BaseUIChangeEventDetails<CollapsibleRootChangeEventReason>;
export declare namespace CollapsibleRoot {
  type State = CollapsibleRootState;
  type Props = CollapsibleRootProps;
  type ChangeEventReason = CollapsibleRootChangeEventReason;
  type ChangeEventDetails = CollapsibleRootChangeEventDetails;
}