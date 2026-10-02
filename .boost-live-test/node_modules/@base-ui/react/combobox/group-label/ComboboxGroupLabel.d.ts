import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxGroupLabel: React.ForwardRefExoticComponent<Omit<ComboboxGroupLabelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxGroupLabelState {}
export interface ComboboxGroupLabelProps extends BaseUIComponentProps<'div', ComboboxGroupLabelState> {}
export declare namespace ComboboxGroupLabel {
  type State = ComboboxGroupLabelState;
  type Props = ComboboxGroupLabelProps;
}