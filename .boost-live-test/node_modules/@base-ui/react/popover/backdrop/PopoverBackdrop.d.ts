import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * An overlay displayed beneath the popover.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverBackdrop: React.ForwardRefExoticComponent<Omit<PopoverBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PopoverBackdropState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface PopoverBackdropProps extends BaseUIComponentProps<'div', PopoverBackdropState> {}
export declare namespace PopoverBackdrop {
  type State = PopoverBackdropState;
  type Props = PopoverBackdropProps;
}