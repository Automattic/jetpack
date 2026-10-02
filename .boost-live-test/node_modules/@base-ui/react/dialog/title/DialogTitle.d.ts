import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export declare const DialogTitle: React.ForwardRefExoticComponent<Omit<DialogTitleProps, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
export interface DialogTitleProps extends BaseUIComponentProps<'h2', DialogTitleState> {}
export interface DialogTitleState {}
export declare namespace DialogTitle {
  type Props = DialogTitleProps;
  type State = DialogTitleState;
}