"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.orientation = exports.modal = exports.hasSubmenuOpen = void 0;
/**
 * Present when the corresponding menubar is modal.
 */
const modal = exports.modal = 'data-modal';
/**
 * Determines the orientation of the menubar.
 * @type {'horizontal' | 'vertical'}
 */
const orientation = exports.orientation = 'data-orientation';
/**
 * Present when any submenu within the menubar is open.
 */
const hasSubmenuOpen = exports.hasSubmenuOpen = 'data-has-submenu-open';