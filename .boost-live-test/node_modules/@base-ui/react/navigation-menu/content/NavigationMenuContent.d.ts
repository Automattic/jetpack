import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A container for the content of the navigation menu item that is moved into the popup
 * when the item is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuContent: React.ForwardRefExoticComponent<Omit<NavigationMenuContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NavigationMenuContentState {
  /**
   * If `true`, the component is open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * The direction of the activation.
   */
  activationDirection: 'left' | 'right' | 'up' | 'down' | null;
}
export interface NavigationMenuContentProps extends BaseUIComponentProps<'div', NavigationMenuContentState> {
  /**
   * Whether to keep the content mounted in the DOM while the popup is closed.
   * Ensures the content is present during server-side rendering for web crawlers.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace NavigationMenuContent {
  type State = NavigationMenuContentState;
  type Props = NavigationMenuContentProps;
}