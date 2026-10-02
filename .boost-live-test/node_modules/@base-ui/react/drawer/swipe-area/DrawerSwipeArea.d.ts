import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type SwipeDirection } from "../../utils/useSwipeDismiss.js";
import { type DrawerSwipeDirection } from "../root/DrawerRootContext.js";
/**
 * An invisible area that listens for swipe gestures to open the drawer.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerSwipeArea: React.ForwardRefExoticComponent<Omit<DrawerSwipeAreaProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerSwipeAreaProps extends BaseUIComponentProps<'div', DrawerSwipeAreaState> {
  /**
   * Whether the swipe area is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The swipe direction that opens the drawer.
   * Defaults to the opposite of `Drawer.Root` `swipeDirection`.
   */
  swipeDirection?: DrawerSwipeDirection | undefined;
}
export interface DrawerSwipeAreaState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * Whether the swipe area is currently being swiped.
   */
  swiping: boolean;
  /**
   * The swipe direction that opens the drawer.
   */
  swipeDirection: SwipeDirection;
  /**
   * Whether the swipe area is disabled.
   */
  disabled: boolean;
}
export declare namespace DrawerSwipeArea {
  type Props = DrawerSwipeAreaProps;
  type State = DrawerSwipeAreaState;
}