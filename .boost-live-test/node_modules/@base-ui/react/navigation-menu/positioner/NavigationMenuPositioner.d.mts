import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import { type Align, type Side, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.mjs";
/**
 * Positions the navigation menu against the currently active trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuPositioner: React.ForwardRefExoticComponent<Omit<NavigationMenuPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface NavigationMenuPositionerState {
  /**
   * Whether the navigation menu is currently open.
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: boolean;
}
export interface NavigationMenuPositionerProps extends UseAnchorPositioningSharedParameters, BaseUIComponentProps<'div', NavigationMenuPositionerState> {}
export declare namespace NavigationMenuPositioner {
  type State = NavigationMenuPositionerState;
  type Props = NavigationMenuPositionerProps;
}