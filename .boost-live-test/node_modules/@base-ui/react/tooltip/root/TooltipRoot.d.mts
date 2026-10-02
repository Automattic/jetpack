import * as React from 'react';
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { type PayloadChildRenderFunction } from "../../utils/popups/index.mjs";
import { type TooltipHandle } from "../store/TooltipHandle.mjs";
import { REASONS } from "../../internals/reasons.mjs";
/**
 * Groups all parts of the tooltip.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipRoot: <Payload>(props: TooltipRoot.Props<Payload>) => React.JSX.Element;
export interface TooltipRootState {}
export interface TooltipRootProps<Payload = unknown> {
  /**
   * Whether the tooltip is initially open.
   *
   * To render a controlled tooltip, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Whether the tooltip is currently open.
   */
  open?: boolean | undefined;
  /**
   * Event handler called when the tooltip is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the tooltip is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * Whether the tooltip contents can be hovered without closing the tooltip.
   * @default false
   */
  disableHoverablePopup?: boolean | undefined;
  /**
   * Determines which axis the tooltip should track the cursor on.
   * @default 'none'
   */
  trackCursorAxis?: 'none' | 'x' | 'y' | 'both' | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Unmounts the tooltip popup.
   * - `close`: Closes the tooltip imperatively when called.
   */
  actionsRef?: React.RefObject<TooltipRoot.Actions | null> | undefined;
  /**
   * Whether the tooltip is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A handle to associate the tooltip with a trigger.
   * If specified, allows external triggers to control the tooltip's open state.
   * Can be created with the Tooltip.createHandle() method.
   */
  handle?: TooltipHandle<Payload> | undefined;
  /**
   * The content of the tooltip.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  /**
   * ID of the trigger that the tooltip is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled tooltip.
   * There's no need to specify this prop when the tooltip is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the tooltip is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open tooltip.
   */
  defaultTriggerId?: string | null | undefined;
}
export interface TooltipRootActions {
  unmount: () => void;
  close: () => void;
}
export type TooltipRootChangeEventReason = typeof REASONS.triggerHover | typeof REASONS.triggerFocus | typeof REASONS.triggerPress | typeof REASONS.outsidePress | typeof REASONS.escapeKey | typeof REASONS.disabled | typeof REASONS.imperativeAction | typeof REASONS.none;
export type TooltipRootChangeEventDetails = BaseUIChangeEventDetails<TooltipRoot.ChangeEventReason> & {
  preventUnmountOnClose(): void;
};
export declare namespace TooltipRoot {
  type State = TooltipRootState;
  type Props<Payload = unknown> = TooltipRootProps<Payload>;
  type Actions = TooltipRootActions;
  type ChangeEventReason = TooltipRootChangeEventReason;
  type ChangeEventDetails = TooltipRootChangeEventDetails;
}