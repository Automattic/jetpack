import { transitionStatusMapping } from "../internals/stateAttributesMapping.mjs";
import * as CommonPopupDataAttributes from "./CommonPopupDataAttributes.mjs";
import * as CommonTriggerDataAttributes from "./CommonTriggerDataAttributes.mjs";
export { CommonPopupDataAttributes, CommonTriggerDataAttributes };
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
export const triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return TRIGGER_HOOK;
    }
    return null;
  }
};
export const pressableTriggerOpenStateMapping = {
  open(value) {
    if (value) {
      return PRESSABLE_TRIGGER_HOOK;
    }
    return null;
  }
};
export const popupStateMapping = {
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
export const popupTransitionStateMapping = {
  ...popupStateMapping,
  ...transitionStatusMapping
};