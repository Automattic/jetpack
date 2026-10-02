"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.touched = exports.required = exports.readonly = exports.invalid = exports.focused = exports.filled = exports.disabled = exports.dirty = exports.complete = void 0;
/**
 * Present when all slots are filled.
 */
const complete = exports.complete = 'data-complete';
/**
 * Present when the input contains a character.
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the OTP field is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the OTP field is readonly.
 */
const readonly = exports.readonly = 'data-readonly';
/**
 * Present when the OTP field is required.
 */
const required = exports.required = 'data-required';
/**
 * Present when the OTP field is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the OTP field is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the OTP field has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the OTP field's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when any OTP field input is focused.
 */
const focused = exports.focused = 'data-focused';