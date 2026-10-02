import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An individual navigation menu item.
 * Renders a `<li>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuItem: React.ForwardRefExoticComponent<Omit<NavigationMenuItemProps, "ref"> & React.RefAttributes<HTMLLIElement>>;
export interface NavigationMenuItemState {}
export interface NavigationMenuItemProps extends BaseUIComponentProps<'li', NavigationMenuItemState> {
  /**
   * A unique value that identifies this navigation menu item.
   * If no value is provided, a unique ID will be generated automatically.
   * Use when controlling the navigation menu programmatically.
   */
  value?: any;
}
export declare namespace NavigationMenuItem {
  type State = NavigationMenuItemState;
  type Props = NavigationMenuItemProps;
}