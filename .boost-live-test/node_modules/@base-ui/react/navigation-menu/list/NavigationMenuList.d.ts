import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Contains a list of navigation menu items.
 * Renders a `<ul>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuList: React.ForwardRefExoticComponent<Omit<NavigationMenuListProps, "ref"> & React.RefAttributes<HTMLUListElement>>;
export interface NavigationMenuListState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
}
export interface NavigationMenuListProps extends BaseUIComponentProps<'ul', NavigationMenuListState> {}
export declare namespace NavigationMenuList {
  type State = NavigationMenuListState;
  type Props = NavigationMenuListProps;
}