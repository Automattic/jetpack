import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
import { PopoverHandle } from "../store/PopoverHandle.mjs";
/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverTrigger: PopoverTrigger;
export interface PopoverTrigger {
  <Payload>(componentProps: PopoverTriggerProps<Payload> & React.RefAttributes<HTMLElement>): React.JSX.Element;
}
export interface PopoverTriggerState {
  /**
   * Whether the trigger is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the popover is currently open and was opened by this trigger.
   */
  open: boolean;
}
export type PopoverTriggerProps<Payload = unknown> = NativeButtonProps & BaseUIComponentProps<'button', PopoverTriggerState> & {
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default true
   */
  nativeButton?: boolean | undefined;
  /**
   * A handle to associate the trigger with a popover.
   */
  handle?: PopoverHandle<Payload> | undefined;
  /**
   * A payload to pass to the popover when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * ID of the trigger. In addition to being forwarded to the rendered element,
   * it is also used to specify the active trigger for the popover in controlled mode (with the PopoverRoot `triggerId` prop).
   */
  id?: string | undefined;
  /**
   * Whether the popover should also open when the trigger is hovered.
   * @default false
   */
  openOnHover?: boolean | undefined;
  /**
   * How long to wait before the popover may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 300
   */
  delay?: number | undefined;
  /**
   * How long to wait before closing the popover that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay?: number | undefined;
};
export declare namespace PopoverTrigger {
  type State = PopoverTriggerState;
  type Props<Payload = unknown> = PopoverTriggerProps<Payload>;
}