import * as React from 'react';
import { MenuRoot } from "../root/MenuRoot.js";
export { useMenuSubmenuRootContext } from "./MenuSubmenuRootContext.js";
/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare function MenuSubmenuRoot(props: MenuSubmenuRoot.Props): React.JSX.Element;
export interface MenuSubmenuRootProps extends Omit<MenuRoot.Props, 'modal' | 'openOnHover' | 'onOpenChange' | 'handle' | 'triggerId' | 'defaultTriggerId' | 'children'> {
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * When in a submenu, determines whether pressing the Escape key
   * closes the entire menu, or only the current child menu.
   * @default false
   */
  closeParentOnEsc?: boolean | undefined;
  /**
   * The content of the submenu.
   */
  children?: React.ReactNode;
}
export interface MenuSubmenuRootState {}
export type MenuSubmenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuSubmenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;
export declare namespace MenuSubmenuRoot {
  type Props = MenuSubmenuRootProps;
  type State = MenuSubmenuRootState;
  type ChangeEventReason = MenuSubmenuRootChangeEventReason;
  type ChangeEventDetails = MenuSubmenuRootChangeEventDetails;
}