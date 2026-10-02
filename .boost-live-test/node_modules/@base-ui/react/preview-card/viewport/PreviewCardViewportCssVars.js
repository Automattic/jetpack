"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.popupWidth = exports.popupHeight = void 0;
/**
 * The width of the parent popup.
 * This variable is placed on the 'previous' container and stores the width of the popup when the previous content was rendered.
 * It can be used to freeze the dimensions of the popup when animating between different content.
 */
const popupWidth = exports.popupWidth = '--popup-width';
/**
 * The height of the parent popup.
 * This variable is placed on the 'previous' container and stores the height of the popup when the previous content was rendered.
 * It can be used to freeze the dimensions of the popup when animating between different content.
 */
const popupHeight = exports.popupHeight = '--popup-height';