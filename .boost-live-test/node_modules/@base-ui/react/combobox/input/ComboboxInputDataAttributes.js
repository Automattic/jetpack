"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.touched = exports.required = exports.readonly = exports.pressed = exports.popupSide = exports.popupOpen = exports.listEmpty = exports.invalid = exports.focused = exports.filled = exports.disabled = exports.dirty = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the corresponding popup is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the input is pressed.
 */
const pressed = exports.pressed = _popupStateMapping.CommonTriggerDataAttributes.pressed;
/**
 * Present when the component is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the component is readonly.
 */
const readonly = exports.readonly = 'data-readonly';
/**
 * Indicates which side the corresponding popup is positioned relative to its anchor.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start' | null}
 */
const popupSide = exports.popupSide = 'data-popup-side';
/**
 * Present when the component is required.
 */
const required = exports.required = 'data-required';
/**
 * Present when the component is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the component is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the component has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the component's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the component has a value (when wrapped in Field.Root).
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the input is focused (when wrapped in Field.Root).
 */
const focused = exports.focused = 'data-focused';
/**
 * Present when the corresponding items list is empty.
 */
const listEmpty = exports.listEmpty = 'data-list-empty';