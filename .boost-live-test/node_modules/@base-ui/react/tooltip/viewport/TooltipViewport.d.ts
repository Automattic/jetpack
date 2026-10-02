import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export declare const TooltipViewport: React.ForwardRefExoticComponent<Omit<TooltipViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface TooltipViewportState {
  /**
   * The activation direction of the transitioned content.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
  /**
   * Present if animations should be instant.
   */
  instant: 'delay' | 'dismiss' | 'focus' | undefined;
}
export interface TooltipViewportProps extends BaseUIComponentProps<'div', TooltipViewportState> {
  /**
   * The content to render inside the transition container.
   */
  children?: React.ReactNode;
}
export declare namespace TooltipViewport {
  type Props = TooltipViewportProps;
  type State = TooltipViewportState;
}