import type { TransitionStatus } from "../internals/useTransitionStatus.js";
import * as CommonPopupDataAttributes from "./CommonPopupDataAttributes.js";
import * as CommonTriggerDataAttributes from "./CommonTriggerDataAttributes.js";
export { CommonPopupDataAttributes, CommonTriggerDataAttributes };
export declare const triggerOpenStateMapping: {
  open(value: boolean): {
    "data-popup-open": string;
  } | null;
};
export declare const pressableTriggerOpenStateMapping: {
  open(value: boolean): {
    "data-popup-open": string;
    "data-pressed": string;
  } | null;
};
export declare const popupStateMapping: {
  open(value: boolean): {
    "data-open": string;
  } | {
    "data-closed": string;
  };
  anchorHidden(value: boolean): {
    "data-anchor-hidden": string;
  } | null;
};
export declare const popupTransitionStateMapping: {
  transitionStatus(value: TransitionStatus): Record<string, string> | null;
  open(value: boolean): {
    "data-open": string;
  } | {
    "data-closed": string;
  };
  anchorHidden(value: boolean): {
    "data-anchor-hidden": string;
  } | null;
};