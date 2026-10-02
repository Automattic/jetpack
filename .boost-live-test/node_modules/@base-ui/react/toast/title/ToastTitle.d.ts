import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastTitle: React.ForwardRefExoticComponent<Omit<ToastTitleProps, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
export interface ToastTitleState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}
export interface ToastTitleProps extends BaseUIComponentProps<'h2', ToastTitleState> {}
export declare namespace ToastTitle {
  type State = ToastTitleState;
  type Props = ToastTitleProps;
}