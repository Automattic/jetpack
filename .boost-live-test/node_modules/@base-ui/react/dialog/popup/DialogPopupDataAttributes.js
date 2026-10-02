"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.open = exports.nestedDialogOpen = exports.nested = exports.endingStyle = exports.closed = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the dialog is open.
 */
const open = exports.open = _popupStateMapping.CommonPopupDataAttributes.open;
/**
 * Present when the dialog is closed.
 */
const closed = exports.closed = _popupStateMapping.CommonPopupDataAttributes.closed;
/**
 * Present when the dialog begins animating in.
 */
const startingStyle = exports.startingStyle = _popupStateMapping.CommonPopupDataAttributes.startingStyle;
/**
 * Present when the dialog is animating out.
 */
const endingStyle = exports.endingStyle = _popupStateMapping.CommonPopupDataAttributes.endingStyle;
/**
 * Present when the dialog is nested within another dialog.
 */
const nested = exports.nested = 'data-nested';
/**
 * Present when the dialog has other open dialogs nested within it.
 */
const nestedDialogOpen = exports.nestedDialogOpen = 'data-nested-dialog-open';