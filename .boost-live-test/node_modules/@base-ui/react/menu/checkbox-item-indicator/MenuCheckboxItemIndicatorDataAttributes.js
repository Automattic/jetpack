"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unchecked = exports.startingStyle = exports.endingStyle = exports.disabled = exports.checked = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the menu checkbox item is checked.
 */
const checked = exports.checked = 'data-checked';
/**
 * Present when the menu checkbox item is not checked.
 */
const unchecked = exports.unchecked = 'data-unchecked';
/**
 * Present when the menu checkbox item is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the indicator begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the indicator is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;