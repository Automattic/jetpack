"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuHandle = void 0;
exports.createMenuHandle = createMenuHandle;
var _MenuStore = require("./MenuStore");
var _popupHandle = require("../../utils/popups/popupHandle");
/**
 * Controls a Menu imperatively and associates detached `Menu.Trigger` components with a `Menu.Root`.
 * Create one with `Menu.createHandle()` and pass it to the `handle` prop of the root and of any
 * triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
class MenuHandle extends _popupHandle.BasePopupHandle {
  constructor() {
    super((0, _MenuStore.createNullMenuStore)(), 'Menu');
  }

  /**
   * Opens the menu and associates it with the trigger with the given id.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   *
   * @param triggerId ID of the trigger to associate with the menu. The trigger must be a matching
   * `Menu.Trigger` with this handle passed as a prop.
   */
  open(triggerId) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the menu.
   *
   * This method should only be called in an event handler or an effect (not during rendering).
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the menu is currently open. Returns `false` while no root is attached to the handle.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a new handle to connect a Menu.Root with detached Menu.Trigger components.
 */
exports.MenuHandle = MenuHandle;
function createMenuHandle() {
  return new MenuHandle();
}