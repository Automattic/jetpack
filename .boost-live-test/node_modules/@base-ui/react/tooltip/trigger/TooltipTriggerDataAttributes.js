"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.triggerDisabled = exports.popupOpen = void 0;
var _popupStateMapping = require("../../utils/popupStateMapping");
/**
 * Present when the corresponding tooltip is open.
 */
const popupOpen = exports.popupOpen = _popupStateMapping.CommonTriggerDataAttributes.popupOpen;
/**
 * Present when the trigger is disabled, either by the `disabled` prop or by a parent `<Tooltip.Root>` component.
 */
const triggerDisabled = exports.triggerDisabled = 'data-trigger-disabled';