import * as React from 'react';
import type { Align, Side } from "../../internals/useAnchorPositioning.mjs";
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { TransitionStatus } from "../../internals/useTransitionStatus.mjs";
/**
 * A container for the preview card contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardPopup: React.ForwardRefExoticComponent<Omit<PreviewCardPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PreviewCardPopupState {
  /**
   * Whether the preview card is currently open.
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
  instant: 'dismiss' | 'focus' | undefined;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface PreviewCardPopupProps extends BaseUIComponentProps<'div', PreviewCardPopupState> {}
export declare namespace PreviewCardPopup {
  type State = PreviewCardPopupState;
  type Props = PreviewCardPopupProps;
}