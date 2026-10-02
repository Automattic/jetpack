import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A container for the contents of a toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastContent: React.ForwardRefExoticComponent<Omit<ToastContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToastContentState {
  /**
   * Whether the toast viewport is expanded.
   */
  expanded: boolean;
  /**
   * Whether the toast is behind the frontmost toast in the stack.
   */
  behind: boolean;
}
export interface ToastContentProps extends BaseUIComponentProps<'div', ToastContentState> {}
export declare namespace ToastContent {
  type State = ToastContentState;
  type Props = ToastContentProps;
}