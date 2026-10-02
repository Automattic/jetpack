"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.side = exports.anchorHidden = exports.align = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the anchor is hidden.
 */
const anchorHidden = exports.anchorHidden = _popupStateMapping.CommonPopupDataAttributes.anchorHidden;
/**
 * Indicates which side the toast is positioned relative to the trigger.
 * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
 */
const side = exports.side = _popupStateMapping.CommonPopupDataAttributes.side;
/**
 * Indicates how the toast is aligned relative to specified side.
 * @type {'start' | 'center' | 'end'}
 */
const align = exports.align = _popupStateMapping.CommonPopupDataAttributes.align;