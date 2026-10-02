import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuGroupLabel: React.ForwardRefExoticComponent<Omit<MenuGroupLabelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MenuGroupLabelProps extends BaseUIComponentProps<'div', MenuGroupLabelState> {}
export interface MenuGroupLabelState {}
export declare namespace MenuGroupLabel {
  type Props = MenuGroupLabelProps;
  type State = MenuGroupLabelState;
}