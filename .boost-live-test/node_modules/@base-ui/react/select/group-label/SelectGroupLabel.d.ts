import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectGroupLabel: React.ForwardRefExoticComponent<Omit<SelectGroupLabelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectGroupLabelState {}
export interface SelectGroupLabelProps extends BaseUIComponentProps<'div', SelectGroupLabelState> {}
export declare namespace SelectGroupLabel {
  type State = SelectGroupLabelState;
  type Props = SelectGroupLabelProps;
}