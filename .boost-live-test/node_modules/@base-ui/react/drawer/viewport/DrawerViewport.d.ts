import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A positioning container for the drawer popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerViewport: React.ForwardRefExoticComponent<Omit<DrawerViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerViewportState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the drawer is nested within another drawer.
   */
  nested: boolean;
  /**
   * Whether the drawer has nested drawers open.
   */
  nestedDialogOpen: boolean;
}
export interface DrawerViewportProps extends BaseUIComponentProps<'div', DrawerViewportState> {}
export declare namespace DrawerViewport {
  type Props = DrawerViewportProps;
  type State = DrawerViewportState;
}