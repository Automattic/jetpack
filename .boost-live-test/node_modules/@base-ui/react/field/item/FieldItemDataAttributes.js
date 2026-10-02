"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.touched = exports.invalid = exports.focused = exports.filled = exports.disabled = exports.dirty = void 0;
/**
 * Present when the field is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the field is in a valid state.
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the field is in an invalid state.
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the field has been touched.
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the field's value has changed.
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the field is filled.
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the field control is focused.
 */
const focused = exports.focused = 'data-focused';