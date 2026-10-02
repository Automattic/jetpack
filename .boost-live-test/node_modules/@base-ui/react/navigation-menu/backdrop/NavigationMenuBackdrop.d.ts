import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A backdrop for the navigation menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuBackdrop: React.ForwardRefExoticComponent<Omit<NavigationMenuBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NavigationMenuBackdropState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
  /**
   * The transition status of the popup.
   */
  transitionStatus: TransitionStatus;
}
export interface NavigationMenuBackdropProps extends BaseUIComponentProps<'div', NavigationMenuBackdropState> {}
export declare namespace NavigationMenuBackdrop {
  type State = NavigationMenuBackdropState;
  type Props = NavigationMenuBackdropProps;
}