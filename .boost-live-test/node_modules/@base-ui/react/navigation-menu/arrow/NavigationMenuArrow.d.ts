import * as React from 'react';
import type { Align, Side } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Displays an element pointing toward the navigation menu's current anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuArrow: React.ForwardRefExoticComponent<Omit<NavigationMenuArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NavigationMenuArrowState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}
export interface NavigationMenuArrowProps extends BaseUIComponentProps<'div', NavigationMenuArrowState> {}
export declare namespace NavigationMenuArrow {
  type State = NavigationMenuArrowState;
  type Props = NavigationMenuArrowProps;
}