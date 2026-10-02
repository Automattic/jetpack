"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.unchecked = exports.touched = exports.startingStyle = exports.required = exports.readonly = exports.invalid = exports.indeterminate = exports.focused = exports.filled = exports.endingStyle = exports.disabled = exports.dirty = exports.checked = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the checkbox is checked.
 */
const checked = exports.checked = 'data-checked';
/**
 * Present when the checkbox is not checked.
 */
const unchecked = exports.unchecked = 'data-unchecked';
/**
 * Present when the checkbox is in an indeterminate state.
 */
const indeterminate = exports.indeterminate = 'data-indeterminate';
/**
 * Present when the checkbox is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the checkbox is readonly.
 */
const readonly = exports.readonly = 'data-readonly';
/**
 * Present when the checkbox is required.
 */
const required = exports.required = 'data-required';
/**
 * Present when the checkbox indicator begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the checkbox indicator is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;
/**
 * Present when the checkbox is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the checkbox is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the checkbox has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the checkbox's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the checkbox is checked (when wrapped in Field.Root).
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the checkbox is focused (when wrapped in Field.Root).
 */
const focused = exports.focused = 'data-focused';