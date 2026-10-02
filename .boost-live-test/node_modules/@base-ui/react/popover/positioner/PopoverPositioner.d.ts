import * as React from 'react';
import { type Side, type Align, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Positions the popover against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverPositioner: React.ForwardRefExoticComponent<Omit<PopoverPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PopoverPositionerState {
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}
export interface PopoverPositionerProps extends UseAnchorPositioningSharedParameters, BaseUIComponentProps<'div', PopoverPositionerState> {}
export declare namespace PopoverPositioner {
  type State = PopoverPositionerState;
  type Props = PopoverPositionerProps;
}