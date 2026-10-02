import * as React from 'react';
import { type Side, type Align, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardPositioner: React.ForwardRefExoticComponent<Omit<PreviewCardPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PreviewCardPositionerState {
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether transitions should be skipped.
   */
  instant: 'dismiss' | 'focus' | undefined;
}
export interface PreviewCardPositionerProps extends UseAnchorPositioningSharedParameters, BaseUIComponentProps<'div', PreviewCardPositionerState> {}
export declare namespace PreviewCardPositioner {
  type State = PreviewCardPositionerState;
  type Props = PreviewCardPositionerProps;
}