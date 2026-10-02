"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.popupOpen = exports.highlighted = exports.disabled = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the corresponding submenu is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the submenu trigger is highlighted.
 */
const highlighted = exports.highlighted = 'data-highlighted';
/**
 * Present when the submenu trigger is disabled.
 */
const disabled = exports.disabled = 'data-disabled';