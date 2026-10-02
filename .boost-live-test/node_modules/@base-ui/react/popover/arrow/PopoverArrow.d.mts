import * as React from 'react';
import type { Align, Side } from "../../internals/useAnchorPositioning.mjs";
import type { BaseUIComponentProps } from "../../internals/types.mjs";
/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverArrow: React.ForwardRefExoticComponent<Omit<PopoverArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PopoverArrowState {
  /**
   * Whether the popover is currently open.
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
export interface PopoverArrowProps extends BaseUIComponentProps<'div', PopoverArrowState> {}
export declare namespace PopoverArrow {
  type State = PopoverArrowState;
  type Props = PopoverArrowProps;
}