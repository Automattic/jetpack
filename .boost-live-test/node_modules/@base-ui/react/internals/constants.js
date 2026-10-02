"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ownerVisuallyHidden = exports.TYPEAHEAD_RESET_MS = exports.POPUP_COLLISION_AVOIDANCE = exports.PATIENT_CLICK_THRESHOLD = exports.LEGACY_SWIPE_IGNORE_SELECTOR = exports.LEGACY_SWIPE_IGNORE_ATTRIBUTE = exports.DROPDOWN_COLLISION_AVOIDANCE = exports.DISABLED_TRANSITIONS_STYLE = exports.CLICK_TRIGGER_IDENTIFIER = exports.BASE_UI_SWIPE_IGNORE_SELECTOR = exports.BASE_UI_SWIPE_IGNORE_ATTRIBUTE = void 0;
const TYPEAHEAD_RESET_MS = exports.TYPEAHEAD_RESET_MS = 500;
const PATIENT_CLICK_THRESHOLD = exports.PATIENT_CLICK_THRESHOLD = 500;
const DISABLED_TRANSITIONS_STYLE = exports.DISABLED_TRANSITIONS_STYLE = {
  style: {
    transition: 'none'
  }
};
const CLICK_TRIGGER_IDENTIFIER = exports.CLICK_TRIGGER_IDENTIFIER = 'data-base-ui-click-trigger';
const BASE_UI_SWIPE_IGNORE_ATTRIBUTE = exports.BASE_UI_SWIPE_IGNORE_ATTRIBUTE = 'data-base-ui-swipe-ignore';
const LEGACY_SWIPE_IGNORE_ATTRIBUTE = exports.LEGACY_SWIPE_IGNORE_ATTRIBUTE = 'data-swipe-ignore';
const BASE_UI_SWIPE_IGNORE_SELECTOR = exports.BASE_UI_SWIPE_IGNORE_SELECTOR = `[${BASE_UI_SWIPE_IGNORE_ATTRIBUTE}]`;
const LEGACY_SWIPE_IGNORE_SELECTOR = exports.LEGACY_SWIPE_IGNORE_SELECTOR = `[${LEGACY_SWIPE_IGNORE_ATTRIBUTE}]`;

/**
 * Used for dropdowns that usually strictly prefer top/bottom placements and
 * use `var(--available-height)` to limit their height.
 */
const DROPDOWN_COLLISION_AVOIDANCE = exports.DROPDOWN_COLLISION_AVOIDANCE = {
  fallbackAxisSide: 'none'
};

/**
 * Used by regular popups that usually aren't scrollable and are allowed to
 * freely flip to any axis of placement.
 */
const POPUP_COLLISION_AVOIDANCE = exports.POPUP_COLLISION_AVOIDANCE = {
  fallbackAxisSide: 'end'
};

/**
 * Special visually hidden styles for the aria-owns owner element to ensure owned element
 * accessibility in iOS/Safari/VoiceControl.
 * The owner element is an empty span, so most of the common visually hidden styles are not needed.
 * @see https://github.com/floating-ui/floating-ui/issues/3403
 */
const ownerVisuallyHidden = exports.ownerVisuallyHidden = {
  clipPath: 'inset(50%)',
  position: 'fixed',
  top: 0,
  left: 0
};