import * as React from 'react';
import { BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import type { DialogRoot } from "../../dialog/root/DialogRoot.mjs";
import type { AlertDialogHandle } from "../handle.mjs";
/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export declare function AlertDialogRoot<Payload>(props: AlertDialogRoot.Props<Payload>): React.JSX.Element;
export interface AlertDialogRootState {}
export interface AlertDialogRootProps<Payload = unknown> extends Omit<DialogRoot.Props<Payload>, 'modal' | 'disablePointerDismissal' | 'onOpenChange' | 'actionsRef' | 'handle'> {
  /**
   * Event handler called when the alert dialog is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: AlertDialogRoot.ChangeEventDetails) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Manually unmounts the alert dialog.
   * Call this after any externally controlled closing animation finishes.
   * - `close`: Closes the alert dialog imperatively when called.
   */
  actionsRef?: React.RefObject<AlertDialogRoot.Actions | null> | undefined;
  /**
   * A handle to associate the alert dialog with a trigger.
   * If specified, allows external triggers to control the alert dialog's open state.
   * Can be created with the AlertDialog.createHandle() method.
   */
  handle?: AlertDialogHandle<Payload> | undefined;
}
export type AlertDialogRootActions = DialogRoot.Actions;
export type AlertDialogRootChangeEventReason = DialogRoot.ChangeEventReason;
export type AlertDialogRootChangeEventDetails = BaseUIChangeEventDetails<AlertDialogRoot.ChangeEventReason> & {
  preventUnmountOnClose(): void;
};
export declare namespace AlertDialogRoot {
  type State = AlertDialogRootState;
  type Props<Payload = unknown> = AlertDialogRootProps<Payload>;
  type Actions = AlertDialogRootActions;
  type ChangeEventReason = AlertDialogRootChangeEventReason;
  type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}