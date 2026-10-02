import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A description that describes the toast.
 * Can be used as the default message for the toast when no title is provided.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastDescription: React.ForwardRefExoticComponent<Omit<ToastDescriptionProps, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
export interface ToastDescriptionState {
  /**
   * The type of the toast.
   */
  type: string | undefined;
}
export interface ToastDescriptionProps extends BaseUIComponentProps<'p', ToastDescriptionState> {}
export declare namespace ToastDescription {
  type State = ToastDescriptionState;
  type Props = ToastDescriptionProps;
}