import * as React from 'react';
import { type Side, type Align, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { ToastObject } from "../useToastManager.js";
/**
 * Positions the toast against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export declare const ToastPositioner: React.ForwardRefExoticComponent<Omit<ToastPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToastPositionerState {
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
}
export interface ToastPositionerProps extends BaseUIComponentProps<'div', ToastPositionerState>, Omit<UseAnchorPositioningSharedParameters, 'side' | 'anchor'> {
  /**
   * An element to position the toast against.
   */
  anchor?: Element | null | undefined;
  /**
   * Which side of the anchor element to align the toast against.
   * May automatically change to avoid collisions.
   * @default 'top'
   */
  side?: Side | undefined;
  /**
   * The toast object associated with the positioner.
   */
  toast: ToastObject<any>;
}
export declare namespace ToastPositioner {
  type State = ToastPositionerState;
  type Props = ToastPositionerProps;
}