import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastAction: React.ForwardRefExoticComponent<Omit<ToastActionProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface ToastActionState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}
export interface ToastActionProps extends NativeButtonProps, BaseUIComponentProps<'button', ToastActionState> {}
export declare namespace ToastAction {
  type State = ToastActionState;
  type Props = ToastActionProps;
}