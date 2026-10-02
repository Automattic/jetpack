"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unchecked = exports.startingStyle = exports.endingStyle = exports.disabled = exports.checked = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the menu radio item is selected.
 */
const checked = exports.checked = 'data-checked';
/**
 * Present when the menu radio item is not selected.
 */
const unchecked = exports.unchecked = 'data-unchecked';
/**
 * Present when the menu radio item is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the radio indicator begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the radio indicator is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;