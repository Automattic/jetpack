import { PreviewCardStore, type PreviewCardHandleStore } from "./PreviewCardStore.js";
import { BasePopupHandle } from "../../utils/popups/popupHandle.js";
/**
 * Controls a PreviewCard imperatively and associates detached `PreviewCard.Trigger` components with
 * a `PreviewCard.Root`. Create one with `PreviewCard.createHandle()` and pass it to the `handle`
 * prop of the root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export declare class PreviewCardHandle<Payload> extends BasePopupHandle<PreviewCardHandleStore<Payload>, PreviewCardStore<Payload>> {
  constructor();
  /**
   * Opens the preview card and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the preview card. The trigger must be a
   * matching `PreviewCard.Trigger` with this handle passed as a prop.
   */
  open(triggerId: string): void;
  /**
   * Closes the preview card.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close(): void;
  /**
   * Whether the preview card is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen(): boolean;
}
/**
 * Creates a new handle to connect a PreviewCard.Root with detached PreviewCard.Trigger components.
 */
export declare function createPreviewCardHandle<Payload>(): PreviewCardHandle<Payload>;