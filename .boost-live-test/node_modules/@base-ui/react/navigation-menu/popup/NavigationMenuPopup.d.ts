import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
import { Align, Side } from "../../internals/useAnchorPositioning.js";
/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuPopup: React.ForwardRefExoticComponent<Omit<NavigationMenuPopupProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface NavigationMenuPopupState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
  /**
   * The transition status of the popup.
   */
  transitionStatus: TransitionStatus;
  /**
   * The side of the anchor the popup is positioned on.
   */
  side: Side;
  /**
   * The alignment of the popup relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
}
export interface NavigationMenuPopupProps extends BaseUIComponentProps<'nav', NavigationMenuPopupState> {}
export declare namespace NavigationMenuPopup {
  type State = NavigationMenuPopupState;
  type Props = NavigationMenuPopupProps;
}