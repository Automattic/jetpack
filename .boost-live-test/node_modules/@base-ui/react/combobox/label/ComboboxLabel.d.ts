import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { FieldRoot } from "../../field/root/FieldRoot.js";
/**
 * An accessible label that is automatically associated with the combobox trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxLabel: React.ForwardRefExoticComponent<Omit<ComboboxLabelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxLabelState extends FieldRoot.State {}
export interface ComboboxLabelProps extends Omit<BaseUIComponentProps<'div', ComboboxLabelState>, 'id'> {}
export declare namespace ComboboxLabel {
  type State = ComboboxLabelState;
  type Props = ComboboxLabelProps;
}