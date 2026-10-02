import type { Side } from "../../internals/useAnchorPositioning.js";
export declare const triggerStateAttributesMapping: {
  open(value: boolean): {
    "data-popup-open": string;
    "data-pressed": string;
  } | null;
  valid(value: boolean | null): Record<string, string> | null;
  popupSide: (side: Side | null) => {
    "data-popup-side": Side;
  } | null;
  listEmpty: (empty: boolean) => {
    "data-list-empty": string;
  } | null;
};