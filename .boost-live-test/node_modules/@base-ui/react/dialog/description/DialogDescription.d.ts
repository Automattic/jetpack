import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export declare const DialogDescription: React.ForwardRefExoticComponent<Omit<DialogDescriptionProps, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
export interface DialogDescriptionProps extends BaseUIComponentProps<'p', DialogDescriptionState> {}
export interface DialogDescriptionState {}
export declare namespace DialogDescription {
  type Props = DialogDescriptionProps;
  type State = DialogDescriptionState;
}