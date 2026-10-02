import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An element that scrolls the select popup up when hovered. Does not render when using touch input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectScrollUpArrow: React.ForwardRefExoticComponent<Omit<SelectScrollUpArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectScrollUpArrowState {}
export interface SelectScrollUpArrowProps extends BaseUIComponentProps<'div', SelectScrollUpArrowState> {
  /**
   * Whether to keep the HTML element in the DOM while the select popup is not scrollable.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace SelectScrollUpArrow {
  type State = SelectScrollUpArrowState;
  type Props = SelectScrollUpArrowProps;
}