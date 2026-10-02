"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.triggerOpenStateMapping = exports.pressableTriggerOpenStateMapping = exports.popupTransitionStateMapping = exports.popupStateMapping = exports.CommonTriggerDataAttributes = exports.CommonPopupDataAttributes = void 0;
var _stateAttributesMapping = require("../internals/stateAttributesMapping");
var CommonPopupDataAttributes = _interopRequireWildcard(require("./CommonPopupDataAttributes"));
exports.CommonPopupDataAttributes = CommonPopupDataAttributes;
var CommonTriggerDataAttributes = _interopRequireWildcard(require("./CommonTriggerDataAttributes"));
exports.CommonTriggerDataAttributes = CommonTriggerDataAttributes;
const TRIGGER_HOOK = {
  [CommonTriggerDataAttributes.popupOpen]: ''
};
const PRESSABLE_TRIGGER_HOOK = {
  [CommonTriggerDataAttributes.popupOpen]: '',
  [CommonTriggerDataAttributes.pressed]: ''
};
const POPUP_OPEN_HOOK = {
  [CommonPopupDataAttributes.open]: ''
};
const POPUP_CLOSED_HOOK = {
  [CommonPopupDataAttributes.closed]: ''
};
const ANCHOR_HIDDEN_HOOK = {
  [CommonPopupDataAttributes.anchorHidden]: ''
};
const triggerOpenStateMapping = exports.triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return TRIGGER_HOOK;
    }
    return null;
  }
};
const pressableTriggerOpenStateMapping = exports.pressableTriggerOpenStateMapping = {
  open(value) {
    if (value) {
      return PRESSABLE_TRIGGER_HOOK;
    }
    return null;
  }
};
const popupStateMapping = exports.popupStateMapping = {
  open(value) {
    if (value) {
      return POPUP_OPEN_HOOK;
    }
    return POPUP_CLOSED_HOOK;
  },
  anchorHidden(value) {
    if (value) {
      return ANCHOR_HIDDEN_HOOK;
    }
    return null;
  }
};
const popupTransitionStateMapping = exports.popupTransitionStateMapping = {
  ...popupStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};