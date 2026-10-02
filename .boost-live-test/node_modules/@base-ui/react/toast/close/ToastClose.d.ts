import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastClose: React.ForwardRefExoticComponent<Omit<ToastCloseProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface ToastCloseState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}
export interface ToastCloseProps extends NativeButtonProps, BaseUIComponentProps<'button', ToastCloseState> {}
export declare namespace ToastClose {
  type State = ToastCloseState;
  type Props = ToastCloseProps;
}