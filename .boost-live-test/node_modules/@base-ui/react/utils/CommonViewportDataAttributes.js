"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activationDirection = void 0;
/**
 * Indicates the direction from which the popup was activated.
 * This can be used to create directional animations based on how the popup was triggered.
 * Contains space-separated values for both horizontal and vertical axes.
 * @type {`${'left' | 'right' | ''} ${'down' | 'up' | ''}`}
 */
const activationDirection = exports.activationDirection = 'data-activation-direction';