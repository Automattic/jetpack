import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export declare const DialogClose: React.ForwardRefExoticComponent<Omit<DialogCloseProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface DialogCloseProps extends NativeButtonProps, BaseUIComponentProps<'button', DialogCloseState> {}
export interface DialogCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}
export declare namespace DialogClose {
  type Props = DialogCloseProps;
  type State = DialogCloseState;
}