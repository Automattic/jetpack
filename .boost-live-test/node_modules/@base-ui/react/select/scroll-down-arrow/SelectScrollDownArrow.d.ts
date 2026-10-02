import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An element that scrolls the select popup down when hovered. Does not render when using touch input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectScrollDownArrow: React.ForwardRefExoticComponent<Omit<SelectScrollDownArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectScrollDownArrowState {}
export interface SelectScrollDownArrowProps extends BaseUIComponentProps<'div', SelectScrollDownArrowState> {
  /**
   * Whether to keep the HTML element in the DOM while the select popup is not scrollable.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace SelectScrollDownArrow {
  type State = SelectScrollDownArrowState;
  type Props = SelectScrollDownArrowProps;
}