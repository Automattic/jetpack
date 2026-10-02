import { PopoverStore, type PopoverHandleStore } from "./PopoverStore.js";
import { BasePopupHandle } from "../../utils/popups/popupHandle.js";
/**
 * Controls a Popover imperatively and associates detached `Popover.Trigger` components with a
 * `Popover.Root`. Create one with `Popover.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export declare class PopoverHandle<Payload> extends BasePopupHandle<PopoverHandleStore<Payload>, PopoverStore<Payload>> {
  constructor();
  /**
   * Opens the popover and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the popover. The trigger must be a matching
   * `Popover.Trigger` with this handle passed as a prop.
   */
  open(triggerId: string): void;
  /**
   * Closes the popover.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void;
  /**
   * Whether the popover is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen(): boolean;
}
/**
 * Creates a new handle to connect a Popover.Root with detached Popover.Trigger components.
 */
export declare function createPopoverHandle<Payload>(): PopoverHandle<Payload>;