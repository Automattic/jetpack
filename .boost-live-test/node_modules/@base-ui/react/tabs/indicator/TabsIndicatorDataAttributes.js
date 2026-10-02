"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.orientation = exports.activationDirection = void 0;
/**
 * Indicates the direction of the activation (based on the previous active tab).
 * @type {'left' | 'right' | 'up' | 'down' | 'none'}
 */
const activationDirection = exports.activationDirection = 'data-activation-direction';
/**
 * Indicates the orientation of the tabs.
 * @type {'horizontal' | 'vertical'}
 */
const orientation = exports.orientation = 'data-orientation';