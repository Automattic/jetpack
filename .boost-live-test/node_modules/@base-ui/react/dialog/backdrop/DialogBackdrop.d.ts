import * as React from 'react';
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export declare const DialogBackdrop: React.ForwardRefExoticComponent<Omit<DialogBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DialogBackdropProps extends BaseUIComponentProps<'div', DialogBackdropState> {
  /**
   * Whether the backdrop is forced to render even when nested.
   * @default false
   */
  forceRender?: boolean | undefined;
}
export interface DialogBackdropState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export declare namespace DialogBackdrop {
  type Props = DialogBackdropProps;
  type State = DialogBackdropState;
}