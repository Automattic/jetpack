import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuPortal: React.ForwardRefExoticComponent<Omit<NavigationMenuPortalProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NavigationMenuPortalState {}
export interface NavigationMenuPortalProps extends BaseUIComponentProps<'div', NavigationMenuPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * A parent element to render the portal element into.
   */
  container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}
export declare namespace NavigationMenuPortal {
  type State = NavigationMenuPortalState;
  type Props = NavigationMenuPortalProps;
}