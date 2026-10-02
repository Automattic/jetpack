import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A paragraph with additional information about the popover.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverDescription: React.ForwardRefExoticComponent<Omit<PopoverDescriptionProps, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
export interface PopoverDescriptionState {}
export interface PopoverDescriptionProps extends BaseUIComponentProps<'p', PopoverDescriptionState> {}
export declare namespace PopoverDescription {
  type State = PopoverDescriptionState;
  type Props = PopoverDescriptionProps;
}