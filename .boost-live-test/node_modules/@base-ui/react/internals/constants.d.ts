import type * as React from 'react';
export declare const TYPEAHEAD_RESET_MS = 500;
export declare const PATIENT_CLICK_THRESHOLD = 500;
export declare const DISABLED_TRANSITIONS_STYLE: {
  style: {
    transition: string;
  };
};
export declare const CLICK_TRIGGER_IDENTIFIER = "data-base-ui-click-trigger";
export declare const BASE_UI_SWIPE_IGNORE_ATTRIBUTE = "data-base-ui-swipe-ignore";
export declare const LEGACY_SWIPE_IGNORE_ATTRIBUTE = "data-swipe-ignore";
export declare const BASE_UI_SWIPE_IGNORE_SELECTOR = "[data-base-ui-swipe-ignore]";
export declare const LEGACY_SWIPE_IGNORE_SELECTOR = "[data-swipe-ignore]";
/**
 * Used for dropdowns that usually strictly prefer top/bottom placements and
 * use `var(--available-height)` to limit their height.
 */
export declare const DROPDOWN_COLLISION_AVOIDANCE: {
  readonly fallbackAxisSide: 'none';
};
/**
 * Used by regular popups that usually aren't scrollable and are allowed to
 * freely flip to any axis of placement.
 */
export declare const POPUP_COLLISION_AVOIDANCE: {
  readonly fallbackAxisSide: 'end';
};
/**
 * Special visually hidden styles for the aria-owns owner element to ensure owned element
 * accessibility in iOS/Safari/VoiceControl.
 * The owner element is an empty span, so most of the common visually hidden styles are not needed.
 * @see https://github.com/floating-ui/floating-ui/issues/3403
 */
export declare const ownerVisuallyHidden: React.CSSProperties;