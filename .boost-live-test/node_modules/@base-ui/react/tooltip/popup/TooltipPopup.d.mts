import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { Align, Side } from "../../internals/useAnchorPositioning.mjs";
import type { TransitionStatus } from "../../internals/useTransitionStatus.mjs";
/**
 * A container for the tooltip contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipPopup: React.ForwardRefExoticComponent<Omit<TooltipPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface TooltipPopupState {
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
   * Whether transitions should be skipped.
   */
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface TooltipPopupProps extends BaseUIComponentProps<'div', TooltipPopupState> {}
export declare namespace TooltipPopup {
  type State = TooltipPopupState;
  type Props = TooltipPopupProps;
}