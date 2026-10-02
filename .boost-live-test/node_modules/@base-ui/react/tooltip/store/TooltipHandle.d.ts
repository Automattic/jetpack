import { TooltipStore, type TooltipHandleStore } from "./TooltipStore.js";
import { BasePopupHandle } from "../../utils/popups/popupHandle.js";
/**
 * Controls a Tooltip imperatively and associates detached `Tooltip.Trigger` components with a
 * `Tooltip.Root`. Create one with `Tooltip.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export declare class TooltipHandle<Payload> extends BasePopupHandle<TooltipHandleStore<Payload>, TooltipStore<Payload>> {
  constructor();
  /**
   * Opens the tooltip and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the tooltip. The trigger must be a matching
   * `Tooltip.Trigger` with this handle passed as a prop.
   */
  open(triggerId: string): void;
  /**
   * Closes the tooltip.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void;
  /**
   * Whether the tooltip is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen(): boolean;
}
/**
 * Creates a new handle to connect a Tooltip.Root with detached Tooltip.Trigger components.
 */
export declare function createTooltipHandle<Payload>(): TooltipHandle<Payload>;