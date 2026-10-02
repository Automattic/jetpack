"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.open = exports.endingStyle = exports.closed = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the collapsible panel is open.
 */
const open = exports.open = 'data-open';
/**
 * Present when the collapsible panel is closed.
 */
const closed = exports.closed = 'data-closed';
/**
 * Present when the panel begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the panel is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;