import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastViewport: React.ForwardRefExoticComponent<Omit<ToastViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToastViewportState {
  /**
   * Whether toasts are expanded in the viewport.
   */
  expanded: boolean;
}
export interface ToastViewportProps extends BaseUIComponentProps<'div', ToastViewportState> {}
export declare namespace ToastViewport {
  type State = ToastViewportState;
  type Props = ToastViewportProps;
}