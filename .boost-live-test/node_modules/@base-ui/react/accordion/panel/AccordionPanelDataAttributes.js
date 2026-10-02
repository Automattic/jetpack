"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.orientation = exports.open = exports.index = exports.endingStyle = exports.disabled = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Indicates the index of the accordion item.
 * @type {number}
 */
const index = exports.index = 'data-index';
/**
 * Present when the accordion panel is open.
 */
const open = exports.open = 'data-open';
/**
 * Indicates the orientation of the accordion.
 */
const orientation = exports.orientation = 'data-orientation';
/**
 * Present when the accordion item is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the panel begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the panel is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;