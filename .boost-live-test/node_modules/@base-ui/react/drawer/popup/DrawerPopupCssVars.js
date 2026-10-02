"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.swipeStrength = exports.swipeMovementY = exports.swipeMovementX = exports.snapPointOffset = exports.nestedDrawers = exports.height = exports.frontmostHeight = void 0;
/**
 * The number of nested drawers that are currently open.
 * @type {number}
 */
const nestedDrawers = exports.nestedDrawers = '--nested-drawers';
/**
 * The height of the drawer popup.
 * @type {CSS length}
 */
const height = exports.height = '--drawer-height';
/**
 * The height of the frontmost open drawer in the current nested drawer stack.
 * @type {CSS length}
 */
const frontmostHeight = exports.frontmostHeight = '--drawer-frontmost-height';
/**
 * The swipe movement on the X axis.
 * @type {CSS length}
 */
const swipeMovementX = exports.swipeMovementX = '--drawer-swipe-movement-x';
/**
 * The swipe movement on the Y axis.
 * @type {CSS length}
 */
const swipeMovementY = exports.swipeMovementY = '--drawer-swipe-movement-y';
/**
 * The snap point offset used for translating the drawer.
 * @type {CSS length}
 */
const snapPointOffset = exports.snapPointOffset = '--drawer-snap-point-offset';
/**
 * A scalar (0.1-1) used to scale the swipe release transition duration in CSS.
 * @type {number}
 */
const swipeStrength = exports.swipeStrength = '--drawer-swipe-strength';