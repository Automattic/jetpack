import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuViewport: React.ForwardRefExoticComponent<Omit<NavigationMenuViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NavigationMenuViewportState {}
export interface NavigationMenuViewportProps extends BaseUIComponentProps<'div', NavigationMenuViewportState> {}
export declare namespace NavigationMenuViewport {
  type State = NavigationMenuViewportState;
  type Props = NavigationMenuViewportProps;
}