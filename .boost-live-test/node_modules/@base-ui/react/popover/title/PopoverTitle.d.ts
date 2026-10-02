import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverTitle: React.ForwardRefExoticComponent<Omit<PopoverTitleProps, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
export interface PopoverTitleState {}
export interface PopoverTitleProps extends BaseUIComponentProps<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', PopoverTitleState> {}
export declare namespace PopoverTitle {
  type State = PopoverTitleState;
  type Props = PopoverTitleProps;
}