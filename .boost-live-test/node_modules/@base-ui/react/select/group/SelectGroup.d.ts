import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectGroup: React.ForwardRefExoticComponent<Omit<SelectGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectGroupState {}
export interface SelectGroupProps extends BaseUIComponentProps<'div', SelectGroupState> {}
export declare namespace SelectGroup {
  type State = SelectGroupState;
  type Props = SelectGroupProps;
}