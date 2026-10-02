import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { Side, Align } from "../../internals/useAnchorPositioning.js";
/**
 * Displays an element positioned against the toast anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastArrow: React.ForwardRefExoticComponent<Omit<ToastArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToastArrowState {
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
export interface ToastArrowProps extends BaseUIComponentProps<'div', ToastArrowState> {}
export declare namespace ToastArrow {
  type State = ToastArrowState;
  type Props = ToastArrowProps;
}