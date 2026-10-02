import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { FieldRoot } from "../../field/root/FieldRoot.js";
/**
 * An accessible label that is automatically associated with the select trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectLabel: React.ForwardRefExoticComponent<Omit<SelectLabelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export type SelectLabelState = FieldRoot.State;
export interface SelectLabelProps extends Omit<BaseUIComponentProps<'div', SelectLabel.State>, 'id'> {}
export declare namespace SelectLabel {
  type State = SelectLabelState;
  type Props = SelectLabelProps;
}