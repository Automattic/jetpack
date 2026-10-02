"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.type = exports.swiping = exports.swipeDirection = exports.startingStyle = exports.limited = exports.expanded = exports.endingStyle = void 0;
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Present when the toast is expanded in the viewport.
 * @type {boolean}
 */
const expanded = exports.expanded = 'data-expanded';
/**
 * Present when the toast was limited because the toast limit was exceeded.
 * @type {boolean}
 */
const limited = exports.limited = 'data-limited';
/**
 * The type of the toast.
 * @type {string}
 */
const type = exports.type = 'data-type';
/**
 * Present when the toast is being swiped.
 * @type {boolean}
 */
const swiping = exports.swiping = 'data-swiping';
/**
 * The direction the toast was swiped.
 * @type {'up' | 'down' | 'left' | 'right'}
 */
const swipeDirection = exports.swipeDirection = 'data-swipe-direction';
/**
 * Present when the toast begins animating in.
 */
const startingStyle = exports.startingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.startingStyle;
/**
 * Present when the toast is animating out.
 */
const endingStyle = exports.endingStyle = _stateAttributesMapping.TransitionStatusDataAttributes.endingStyle;