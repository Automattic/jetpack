"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scrolling = exports.overflowYStart = exports.overflowYEnd = exports.overflowXStart = exports.overflowXEnd = exports.hasOverflowY = exports.hasOverflowX = void 0;
/**
 * Present when the user scrolls inside the scroll area.
 */
const scrolling = exports.scrolling = 'data-scrolling';
/**
 * Present when the scroll area content is wider than the viewport.
 */
const hasOverflowX = exports.hasOverflowX = 'data-has-overflow-x';
/**
 * Present when the scroll area content is taller than the viewport.
 */
const hasOverflowY = exports.hasOverflowY = 'data-has-overflow-y';
/**
 * Present when there is overflow on the horizontal start side.
 */
const overflowXStart = exports.overflowXStart = 'data-overflow-x-start';
/**
 * Present when there is overflow on the horizontal end side.
 */
const overflowXEnd = exports.overflowXEnd = 'data-overflow-x-end';
/**
 * Present when there is overflow on the vertical start side.
 */
const overflowYStart = exports.overflowYStart = 'data-overflow-y-start';
/**
 * Present when there is overflow on the vertical end side.
 */
const overflowYEnd = exports.overflowYEnd = 'data-overflow-y-end';