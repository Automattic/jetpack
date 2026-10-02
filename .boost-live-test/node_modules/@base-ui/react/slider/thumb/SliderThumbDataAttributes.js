"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.touched = exports.orientation = exports.invalid = exports.index = exports.focused = exports.dragging = exports.disabled = exports.dirty = void 0;
/**
 * Indicates the index of the thumb in range sliders.
 */
const index = exports.index = 'data-index';
/**
 * Present while the user is dragging.
 */
const dragging = exports.dragging = 'data-dragging';
/**
 * Indicates the orientation of the slider.
 * @type {'horizontal' | 'vertical'}
 */
const orientation = exports.orientation = 'data-orientation';
/**
 * Present when the slider is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the slider is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the slider is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the slider has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the slider's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the slider is focused (when wrapped in Field.Root).
 */
const focused = exports.focused = 'data-focused';