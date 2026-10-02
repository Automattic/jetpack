"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startingStyle = exports.loading = exports.error = exports.endingStyle = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present while the image is loading.
 */
const loading = exports.loading = 'data-loading';
/**
 * Present when the image failed to load.
 */
const error = exports.error = 'data-error';
/**
 * Present when the image begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the image is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;