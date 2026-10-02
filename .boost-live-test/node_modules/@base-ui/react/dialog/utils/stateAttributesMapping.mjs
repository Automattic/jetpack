import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { popupStateMapping } from "../../utils/popupStateMapping.mjs";
import * as DialogPopupDataAttributes from "../popup/DialogPopupDataAttributes.mjs";

/**
 * Shared by `Dialog.Popup` and `Dialog.Viewport`, whose states have the same shape.
 * `nested` is not mapped: unmapped `true` booleans already render as `data-nested`.
 */
export const dialogStateAttributesMapping = {
  ...popupStateMapping,
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return value ? {
      [DialogPopupDataAttributes.nestedDialogOpen]: ''
    } : null;
  }
};