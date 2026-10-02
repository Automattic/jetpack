"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformOrigin = exports.availableWidth = exports.availableHeight = exports.anchorWidth = exports.anchorHeight = void 0;
/**
 * The available width between the trigger and the edge of the viewport.
 * @type {number}
 */
const availableWidth = exports.availableWidth = '--available-width';
/**
 * The available height between the trigger and the edge of the viewport.
 * @type {number}
 */
const availableHeight = exports.availableHeight = '--available-height';
/**
 * The anchor's width.
 * @type {number}
 */
const anchorWidth = exports.anchorWidth = '--anchor-width';
/**
 * The anchor's height.
 * @type {number}
 */
const anchorHeight = exports.anchorHeight = '--anchor-height';
/**
 * The coordinates that this element is anchored to. Used for animations and transitions.
 * @type {string}
 */
const transformOrigin = exports.transformOrigin = '--transform-origin';