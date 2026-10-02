import { DialogStore, type DialogHandleStore } from "./DialogStore.mjs";
import { BasePopupHandle } from "../../utils/popups/popupHandle.mjs";
/**
 * Controls a Dialog imperatively and associates detached `Dialog.Trigger` components with a
 * `Dialog.Root`. Create one with `Dialog.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export declare class DialogHandle<Payload> extends BasePopupHandle<DialogHandleStore<Payload>, DialogStore<Payload>> {
  constructor();
  /**
   * Opens the dialog, optionally associating it with a trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the dialog. The trigger must be a matching
   * `Dialog.Trigger` with this handle passed as a prop. Pass `null` to open without associating any trigger.
   */
  open(triggerId: string | null): void;
  /**
   * Opens the dialog with the given payload, without associating it with any trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param payload Payload to set when opening the dialog. It is exposed to the root's render-prop children.
   */
  openWithPayload(payload: Payload): void;
  /**
   * Closes the dialog.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void;
  /**
   * Whether the dialog is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen(): boolean;
}
/**
 * Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
 */
export declare function createDialogHandle<Payload>(): DialogHandle<Payload>;