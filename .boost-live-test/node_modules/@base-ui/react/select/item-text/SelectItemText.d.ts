import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectItemText: React.NamedExoticComponent<Omit<SelectItemTextProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectItemTextState {}
export interface SelectItemTextProps extends BaseUIComponentProps<'div', SelectItemTextState> {}
export declare namespace SelectItemText {
  type State = SelectItemTextState;
  type Props = SelectItemTextProps;
}