"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.endingStyle = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the indicator begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the indicator is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;