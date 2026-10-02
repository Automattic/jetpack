"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.orientation = exports.focusable = exports.disabled = void 0;
/**
 * Present when the input is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Indicates the orientation of the toolbar.
 * @type {'horizontal' | 'vertical'}
 */
const orientation = exports.orientation = 'data-orientation';
/**
 * Present when the input remains focusable when disabled.
 */
const focusable = exports.focusable = 'data-focusable';