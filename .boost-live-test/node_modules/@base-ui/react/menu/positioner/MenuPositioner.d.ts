import * as React from 'react';
import { type Align, type Side, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.js";
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Positions the menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuPositioner: React.ForwardRefExoticComponent<Omit<MenuPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MenuPositionerState {
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether the component is nested.
   */
  nested: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}
export interface MenuPositionerProps extends Omit<UseAnchorPositioningSharedParameters, 'side' | 'align'>, BaseUIComponentProps<'div', MenuPositionerState> {
  /**
   * How to align the popup relative to the specified side.
   *
   * Submenus and menubars default to `'start'`.
   * @default 'center'
   */
  align?: UseAnchorPositioningSharedParameters['align'] | undefined;
  /**
   * Which side of the anchor element to align the popup against.
   * May automatically change to avoid collisions.
   *
   * Submenus and vertical menubars default to `'inline-end'`.
   * @default 'bottom'
   */
  side?: UseAnchorPositioningSharedParameters['side'] | undefined;
}
export declare namespace MenuPositioner {
  type State = MenuPositionerState;
  type Props = MenuPositionerProps;
}