import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuLink: React.ForwardRefExoticComponent<Omit<NavigationMenuLinkProps, "ref"> & React.RefAttributes<HTMLAnchorElement>>;
export interface NavigationMenuLinkState {
  /**
   * Whether the link is the currently active page.
   */
  active: boolean;
}
export interface NavigationMenuLinkProps extends BaseUIComponentProps<'a', NavigationMenuLinkState, React.ComponentPropsWithRef<'a'>> {
  /**
   * Whether the link is the currently active page.
   * @default false
   */
  active?: boolean | undefined;
  /**
   * Whether to close the navigation menu when the link is clicked.
   * @default false
   */
  closeOnClick?: boolean | undefined;
}
export declare namespace NavigationMenuLink {
  type State = NavigationMenuLinkState;
  type Props = NavigationMenuLinkProps;
}