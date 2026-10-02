"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.orientation = exports.multiple = exports.disabled = void 0;
/**
 * Present when the toggle group is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Indicates the orientation of the toggle group.
 * @type {'horizontal' | 'vertical'}
 */
const orientation = exports.orientation = 'data-orientation';
/**
 * Present when the toggle group allows multiple buttons to be in the pressed state at the same time.
 */
const multiple = exports.multiple = 'data-multiple';