import * as React from 'react';
import { type Side, type Align, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Positions the tooltip against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipPositioner: React.ForwardRefExoticComponent<Omit<TooltipPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface TooltipPositionerState {
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}
export interface TooltipPositionerProps extends BaseUIComponentProps<'div', TooltipPositionerState>, Omit<UseAnchorPositioningSharedParameters, 'side'> {
  /**
   * Which side of the anchor element to align the popup against.
   * May automatically change to avoid collisions.
   * @default 'top'
   */
  side?: Side | undefined;
}
export declare namespace TooltipPositioner {
  type State = TooltipPositionerState;
  type Props = TooltipPositionerProps;
}