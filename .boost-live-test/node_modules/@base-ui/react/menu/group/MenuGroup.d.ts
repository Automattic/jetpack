import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Groups related menu items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuGroup: React.ForwardRefExoticComponent<Omit<MenuGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MenuGroupProps extends BaseUIComponentProps<'div', MenuGroupState> {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
}
export interface MenuGroupState {}
export declare namespace MenuGroup {
  type Props = MenuGroupProps;
  type State = MenuGroupState;
}