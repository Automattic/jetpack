import * as React from 'react';
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerBackdrop: React.ForwardRefExoticComponent<Omit<DrawerBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerBackdropProps extends BaseUIComponentProps<'div', DrawerBackdropState> {
  /**
   * Whether the backdrop is forced to render even when nested.
   * @default false
   */
  forceRender?: boolean | undefined;
}
export interface DrawerBackdropState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export declare namespace DrawerBackdrop {
  type Props = DrawerBackdropProps;
  type State = DrawerBackdropState;
}