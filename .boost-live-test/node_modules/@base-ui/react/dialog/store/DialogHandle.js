"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogHandle = void 0;
exports.createDialogHandle = createDialogHandle;
var _DialogStore = require("./DialogStore");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _popupHandle = require("../../utils/popups/popupHandle");
/**
 * Controls a Dialog imperatively and associates detached `Dialog.Trigger` components with a
 * `Dialog.Root`. Create one with `Dialog.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
class DialogHandle extends _popupHandle.BasePopupHandle {
  constructor() {
    super((0, _DialogStore.createNullDialogStore)(), 'Dialog', false);
  }

  /**
   * Opens the dialog, optionally associating it with a trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the dialog. The trigger must be a matching
   * `Dialog.Trigger` with this handle passed as a prop. Pass `null` to open without associating any trigger.
   */
  open(triggerId) {
    this.openByTrigger(triggerId);
  }

  /**
   * Opens the dialog with the given payload, without associating it with any trigger.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param payload Payload to set when opening the dialog. It is exposed to the root's render-prop children.
   */
  openWithPayload(payload) {
    const attachedStore = this.attachedStore;
    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Base UI: DialogHandle.openWithPayload() was called while no root using this handle is mounted. ' + 'The call and its payload were ignored; mount a root with this handle before opening it imperatively.');
      }
      return;
    }
    attachedStore.set('payload', payload);
    attachedStore.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.imperativeAction));
  }

  /**
   * Closes the dialog.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the dialog is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a new handle to connect a Dialog.Root with detached Dialog.Trigger components.
 */
exports.DialogHandle = DialogHandle;
function createDialogHandle() {
  return new DialogHandle();
}