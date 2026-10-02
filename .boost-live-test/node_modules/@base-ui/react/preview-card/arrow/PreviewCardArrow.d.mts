import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { Align, Side } from "../../internals/useAnchorPositioning.mjs";
/**
 * Displays an element positioned against the preview card anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardArrow: React.ForwardRefExoticComponent<Omit<PreviewCardArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PreviewCardArrowState {
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
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}
export interface PreviewCardArrowProps extends BaseUIComponentProps<'div', PreviewCardArrowState> {}
export declare namespace PreviewCardArrow {
  type State = PreviewCardArrowState;
  type Props = PreviewCardArrowProps;
}