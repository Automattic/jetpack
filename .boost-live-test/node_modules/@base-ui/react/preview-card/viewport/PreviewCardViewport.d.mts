import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.mjs";
/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardViewport: React.ForwardRefExoticComponent<Omit<PreviewCardViewportProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PreviewCardViewportState {
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
  instant: 'dismiss' | 'focus' | undefined;
}
export interface PreviewCardViewportProps extends BaseUIComponentProps<'div', PreviewCardViewportState> {
  /**
   * The content to render inside the transition container.
   */
  children?: React.ReactNode;
}
export declare namespace PreviewCardViewport {
  type Props = PreviewCardViewportProps;
  type State = PreviewCardViewportState;
}