import * as React from 'react';
import type { Side, Align } from "../../internals/useAnchorPositioning.mjs";
import type { BaseUIComponentProps } from "../../internals/types.mjs";
/**
 * Displays an element positioned against the menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuArrow: React.ForwardRefExoticComponent<Omit<MenuArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MenuArrowState {
  /**
   * Whether the menu is currently open.
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
export interface MenuArrowProps extends BaseUIComponentProps<'div', MenuArrowState> {}
export declare namespace MenuArrow {
  type State = MenuArrowState;
  type Props = MenuArrowProps;
}