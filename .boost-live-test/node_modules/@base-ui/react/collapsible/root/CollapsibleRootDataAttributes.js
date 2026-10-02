"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.open = exports.endingStyle = exports.closed = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the collapsible is open.
 */
const open = exports.open = 'data-open';
/**
 * Present when the collapsible is closed.
 */
const closed = exports.closed = 'data-closed';
/**
 * Present when the collapsible begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the collapsible is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;