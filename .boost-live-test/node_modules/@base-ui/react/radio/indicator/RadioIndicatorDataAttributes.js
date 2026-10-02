"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valid = exports.unchecked = exports.touched = exports.startingStyle = exports.required = exports.readonly = exports.invalid = exports.focused = exports.filled = exports.endingStyle = exports.disabled = exports.dirty = exports.checked = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the radio is checked.
 */
const checked = exports.checked = 'data-checked';
/**
 * Present when the radio is not checked.
 */
const unchecked = exports.unchecked = 'data-unchecked';
/**
 * Present when the radio is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the radio is readonly.
 */
const readonly = exports.readonly = 'data-readonly';
/**
 * Present when the radio is required.
 */
const required = exports.required = 'data-required';
/**
 * Present when the radio indicator begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the radio indicator is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;
/**
 * Present when the radio is in a valid state (when wrapped in Field.Root).
 */
const valid = exports.valid = 'data-valid';
/**
 * Present when the radio is in an invalid state (when wrapped in Field.Root).
 */
const invalid = exports.invalid = 'data-invalid';
/**
 * Present when the radio has been touched (when wrapped in Field.Root).
 */
const touched = exports.touched = 'data-touched';
/**
 * Present when the radio's value has changed (when wrapped in Field.Root).
 */
const dirty = exports.dirty = 'data-dirty';
/**
 * Present when the radio is checked (when wrapped in Field.Root).
 */
const filled = exports.filled = 'data-filled';
/**
 * Present when the radio is focused (when wrapped in Field.Root).
 */
const focused = exports.focused = 'data-focused';