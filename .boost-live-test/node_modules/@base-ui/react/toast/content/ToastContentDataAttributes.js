"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expanded = exports.behind = void 0;
/**
 * Present when the toast viewport is expanded.
 * @type {boolean}
 */
const expanded = exports.expanded = 'data-expanded';
/**
 * Present when the toast is behind the frontmost toast in the stack.
 * @type {boolean}
 */
const behind = exports.behind = 'data-behind';