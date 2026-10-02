"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transitioning = exports.previous = exports.instant = exports.current = exports.activationDirection = void 0;
/**
 * Applied to the direct child of the viewport when no transitions are present or the new content when it's entering.
 */
const current = exports.current = 'data-current';
/**
 * Applied to the direct child of the viewport that contains the exiting content when transitions are present.
 */
const previous = exports.previous = 'data-previous';
/**
 * Indicates the direction from which the popup was activated.
 * This can be used to create directional animations based on how the popup was triggered.
 * Contains space-separated values for both horizontal and vertical axes.
 * @type {`${'left' | 'right' | ''} ${'down' | 'up' | ''}`}
 */
const activationDirection = exports.activationDirection = 'data-activation-direction';
/**
 * Indicates that the viewport is currently transitioning between old and new content.
 */
const transitioning = exports.transitioning = 'data-transitioning';
/**
 * Present if animations should be instant.
 * @type {'delay' | 'dismiss' | 'focus'}
 */
const instant = exports.instant = 'data-instant';