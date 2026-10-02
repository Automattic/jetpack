import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuBackdrop: React.ForwardRefExoticComponent<Omit<MenuBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MenuBackdropState {
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface MenuBackdropProps extends BaseUIComponentProps<'div', MenuBackdropState> {}
export declare namespace MenuBackdrop {
  type State = MenuBackdropState;
  type Props = MenuBackdropProps;
}