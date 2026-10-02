import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectList: React.ForwardRefExoticComponent<Omit<SelectListProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectListProps extends BaseUIComponentProps<'div', SelectListState> {}
export interface SelectListState {}
export declare namespace SelectList {
  type Props = SelectListProps;
  type State = SelectListState;
}