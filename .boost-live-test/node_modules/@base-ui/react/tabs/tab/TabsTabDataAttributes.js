"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.orientation = exports.disabled = exports.active = exports.activationDirection = void 0;
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
/**
 * Present when the tab is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the tab is active.
 */
const active = exports.active = 'data-active';