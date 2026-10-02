import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { CollapsibleRootState } from "../root/CollapsibleRoot.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A panel with the collapsible contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export declare const CollapsiblePanel: React.ForwardRefExoticComponent<Omit<CollapsiblePanelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface CollapsiblePanelState extends CollapsibleRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface CollapsiblePanelProps extends BaseUIComponentProps<'div', CollapsiblePanelState> {
  /**
   * Allows the browser's built-in page search to find and expand the panel contents.
   *
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element without removing it from the DOM.
   *
   * @default false
   */
  hiddenUntilFound?: boolean | undefined;
  /**
   * Whether to keep the element in the DOM while the panel is hidden.
   * This prop is ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace CollapsiblePanel {
  type State = CollapsiblePanelState;
  type Props = CollapsiblePanelProps;
}