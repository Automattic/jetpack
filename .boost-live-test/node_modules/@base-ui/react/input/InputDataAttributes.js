"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.touched = exports.invalid = exports.focused = exports.filled = exports.disabled = exports.dirty = void 0;
/**
 * Present when the input is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the input is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the input is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the input has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the input's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the input is filled (when wrapped in Field.Root).
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the input is focused (when wrapped in Field.Root).
 */
const focused = exports.focused = 'data-focused';