import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverClose: React.ForwardRefExoticComponent<Omit<PopoverCloseProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface PopoverCloseState {}
export interface PopoverCloseProps extends NativeButtonProps, BaseUIComponentProps<'button', PopoverCloseState> {}
export declare namespace PopoverClose {
  type State = PopoverCloseState;
  type Props = PopoverCloseProps;
}