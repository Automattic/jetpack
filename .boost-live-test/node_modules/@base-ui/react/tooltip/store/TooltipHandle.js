"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipHandle = void 0;
exports.createTooltipHandle = createTooltipHandle;
var _TooltipStore = require("./TooltipStore");
var _popupHandle = require("../../utils/popups/popupHandle");
/**
 * Controls a Tooltip imperatively and associates detached `Tooltip.Trigger` components with a
 * `Tooltip.Root`. Create one with `Tooltip.createHandle()` and pass it to the `handle` prop of the
 * root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
class TooltipHandle extends _popupHandle.BasePopupHandle {
  constructor() {
    super((0, _TooltipStore.createNullTooltipStore)(), 'Tooltip');
  }

  /**
   * Opens the tooltip and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the tooltip. The trigger must be a matching
   * `Tooltip.Trigger` with this handle passed as a prop.
   */
  open(triggerId) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the tooltip.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the tooltip is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a new handle to connect a Tooltip.Root with detached Tooltip.Trigger components.
 */
exports.TooltipHandle = TooltipHandle;
function createTooltipHandle() {
  return new TooltipHandle();
}