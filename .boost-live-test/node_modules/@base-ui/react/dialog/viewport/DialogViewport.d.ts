import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A positioning container for the dialog popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export declare const DialogViewport: React.ForwardRefExoticComponent<Omit<DialogViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DialogViewportState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the dialog is nested within another dialog.
   */
  nested: boolean;
  /**
   * Whether the dialog has nested dialogs open.
   */
  nestedDialogOpen: boolean;
}
export interface DialogViewportProps extends BaseUIComponentProps<'div', DialogViewportState> {}
export declare namespace DialogViewport {
  type State = DialogViewportState;
  type Props = DialogViewportProps;
}