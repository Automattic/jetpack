import * as React from 'react';
import { HTMLProps } from "../../internals/types.js";
import type { CollapsibleRoot } from "../root/CollapsibleRoot.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
export declare function useCollapsiblePanel(parameters: UseCollapsiblePanelParameters): UseCollapsiblePanelReturnValue;
export interface UseCollapsiblePanelParameters {
  externalRef: React.ForwardedRef<HTMLDivElement>;
  /**
   * Allows the browser's built-in page search to find and expand the panel contents.
   *
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element without removing it from the DOM.
   */
  hiddenUntilFound: boolean;
  /**
   * The `id` attribute of the panel.
   */
  id: React.HTMLAttributes<Element>['id'];
  /**
   * Whether to keep the element in the DOM while the panel is closed.
   * This prop is ignored when `hiddenUntilFound` is used.
   */
  keepMounted: boolean;
  /**
   * Whether the collapsible panel is mounted for transition and hidden-state
   * purposes. This can be `false` while the element remains in the DOM when
   * `keepMounted` or `hiddenUntilFound` is enabled.
   */
  mounted: boolean;
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  /**
   * Whether the collapsible panel is currently open.
   */
  open: boolean;
  setMounted: (nextMounted: boolean) => void;
  setOpen: (nextOpen: boolean) => void;
  transitionStatus: TransitionStatus;
}
export interface UseCollapsiblePanelReturnValue {
  height: number | undefined;
  props: HTMLProps;
  ref: React.Ref<HTMLDivElement>;
  shouldPreventOpenAnimation: boolean;
  shouldRender: boolean;
  transitionStatus: TransitionStatus;
  width: number | undefined;
}