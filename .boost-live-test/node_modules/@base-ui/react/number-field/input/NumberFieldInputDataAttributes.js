"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.touched = exports.scrubbing = exports.required = exports.readonly = exports.invalid = exports.focused = exports.filled = exports.disabled = exports.dirty = void 0;
/**
 * Present while scrubbing.
 */
const scrubbing = exports.scrubbing = 'data-scrubbing';
/**
 * Present when the number field is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the number field is readonly.
 */
const readonly = exports.readonly = 'data-readonly';
/**
 * Present when the number field is required.
 */
const required = exports.required = 'data-required';
/**
 * Present when the number field is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the number field is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the number field has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the number field's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the number field is filled (when wrapped in Field.Root).
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the number field is focused (when wrapped in Field.Root).
 */
const focused = exports.focused = 'data-focused';