import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import { TooltipHandle } from "../store/TooltipHandle.mjs";
/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipTrigger: TooltipTrigger;
export interface TooltipTrigger {
  <Payload>(componentProps: TooltipTrigger.Props<Payload> & React.RefAttributes<HTMLElement>): React.JSX.Element;
}
export interface TooltipTriggerState {
  /**
   * Whether the tooltip is currently open and was opened by this trigger.
   */
  open: boolean;
}
export interface TooltipTriggerProps<Payload = unknown> extends BaseUIComponentProps<'button', TooltipTriggerState> {
  /**
   * A handle to associate the trigger with a tooltip.
   */
  handle?: TooltipHandle<Payload> | undefined;
  /**
   * A payload to pass to the tooltip when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * How long to wait before opening the tooltip on hover. Specified in milliseconds.
   * @default 600
   */
  delay?: number | undefined;
  /**
   * Whether the tooltip should close when this trigger is clicked.
   * @default true
   */
  closeOnClick?: boolean | undefined;
  /**
   * How long to wait before closing the tooltip. Specified in milliseconds.
   * @default 0
   */
  closeDelay?: number | undefined;
  /**
   * If `true`, the tooltip will not open when interacting with this trigger.
   * Note that this doesn't apply the `disabled` attribute to the trigger element.
   * If you want to disable the trigger element itself, you can pass the `disabled` prop to the trigger element via the `render` prop.
   * @default false
   */
  disabled?: boolean | undefined;
}
export declare namespace TooltipTrigger {
  type State = TooltipTriggerState;
  type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}