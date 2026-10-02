import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { Side, Align } from "../../internals/useAnchorPositioning.js";
/**
 * Displays an element positioned against the tooltip anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipArrow: React.ForwardRefExoticComponent<Omit<TooltipArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface TooltipArrowState {
  /**
   * Whether the tooltip is currently open.
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
  /**
   * Whether transitions should be skipped.
   */
  instant: 'delay' | 'dismiss' | 'focus' | undefined;
}
export interface TooltipArrowProps extends BaseUIComponentProps<'div', TooltipArrowState> {}
export declare namespace TooltipArrow {
  type State = TooltipArrowState;
  type Props = TooltipArrowProps;
}