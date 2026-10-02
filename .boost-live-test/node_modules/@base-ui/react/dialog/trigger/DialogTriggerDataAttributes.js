"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.popupOpen = exports.disabled = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the trigger is disabled.
 */
const disabled = exports.disabled = 'data-disabled';
/**
 * Present when the corresponding dialog is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;