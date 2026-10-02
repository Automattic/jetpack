import * as React from 'react';
import { PopoverHandle } from "../store/PopoverHandle.mjs";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { type PayloadChildRenderFunction } from "../../utils/popups/index.mjs";
/**
 * Groups all parts of the popover.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare function PopoverRoot<Payload = unknown>(props: PopoverRoot.Props<Payload>): React.JSX.Element;
export interface PopoverRootState {}
export interface PopoverRootProps<Payload = unknown> {
  /**
   * Whether the popover is initially open.
   *
   * To render a controlled popover, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Whether the popover is currently open.
   */
  open?: boolean | undefined;
  /**
   * Event handler called when the popover is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the popover is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Manually unmounts the popover.
   * Call this after any externally controlled closing animation finishes.
   * - `close`: Closes the popover imperatively when called.
   */
  actionsRef?: React.RefObject<PopoverRoot.Actions | null> | undefined;
  /**
   * Determines if the popover enters a modal state when open.
   * - `true`: user interaction is limited to the popover: document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the popover, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * On touch devices, a `true` modal blocks outside taps but leaves the page scrollable unless the popup spans nearly the full viewport width, matching native iOS behavior.
   *
   * When `modal` is `true`, focus trapping is enabled only if `<Popover.Close>` is rendered
   * inside `<Popover.Popup>`. It can be visually hidden with your own CSS if needed, such as
   * Tailwind's `sr-only` utility.
   *
   * When `modal` is `'trap-focus'`, render `<Popover.Close>` inside `<Popover.Popup>` so touch
   * screen readers can escape the popup.
   * @default false
   */
  modal?: boolean | 'trap-focus' | undefined;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled popover.
   * There's no need to specify this prop when the popover is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open popover.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * A handle to associate the popover with a trigger.
   * If specified, allows external triggers to control the popover's open state.
   */
  handle?: PopoverHandle<Payload> | undefined;
  /**
   * The content of the popover.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
}
export interface PopoverRootActions {
  unmount: () => void;
  close: () => void;
}
export type PopoverRootChangeEventReason = typeof REASONS.triggerHover | typeof REASONS.triggerFocus | typeof REASONS.triggerPress | typeof REASONS.outsidePress | typeof REASONS.escapeKey | typeof REASONS.closePress | typeof REASONS.focusOut | typeof REASONS.imperativeAction | typeof REASONS.none;
export type PopoverRootChangeEventDetails = BaseUIChangeEventDetails<PopoverRoot.ChangeEventReason> & {
  preventUnmountOnClose(): void;
};
export declare namespace PopoverRoot {
  type State = PopoverRootState;
  type Props<Payload = unknown> = PopoverRootProps<Payload>;
  type Actions = PopoverRootActions;
  type ChangeEventReason = PopoverRootChangeEventReason;
  type ChangeEventDetails = PopoverRootChangeEventDetails;
}