import type { StateAttributesMapping } from "../../internals/getStateAttributesProps.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Shared by `Dialog.Popup` and `Dialog.Viewport`, whose states have the same shape.
 * `nested` is not mapped: unmapped `true` booleans already render as `data-nested`.
 */
export declare const dialogStateAttributesMapping: StateAttributesMapping<{
  open: boolean;
  transitionStatus: TransitionStatus;
  nested: boolean;
  nestedDialogOpen: boolean;
}>;