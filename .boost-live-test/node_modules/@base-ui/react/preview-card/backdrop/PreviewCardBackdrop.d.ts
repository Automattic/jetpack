import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A presentational overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardBackdrop: React.ForwardRefExoticComponent<Omit<PreviewCardBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PreviewCardBackdropState {
  /**
   * Whether the preview card is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface PreviewCardBackdropProps extends BaseUIComponentProps<'div', PreviewCardBackdropState> {}
export declare namespace PreviewCardBackdrop {
  type State = PreviewCardBackdropState;
  type Props = PreviewCardBackdropProps;
}