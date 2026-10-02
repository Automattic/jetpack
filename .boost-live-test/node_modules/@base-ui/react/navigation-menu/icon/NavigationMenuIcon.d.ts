import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An icon that indicates that the trigger button opens a menu.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuIcon: React.ForwardRefExoticComponent<Omit<NavigationMenuIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface NavigationMenuIconState {
  /**
   * Whether the navigation menu is open and the item is active.
   */
  open: boolean;
}
export interface NavigationMenuIconProps extends BaseUIComponentProps<'span', NavigationMenuIconState> {}
export declare namespace NavigationMenuIcon {
  type State = NavigationMenuIconState;
  type Props = NavigationMenuIconProps;
}