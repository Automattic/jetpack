import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export declare const ScrollAreaCorner: React.ForwardRefExoticComponent<Omit<ScrollAreaCornerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ScrollAreaCornerState {}
export interface ScrollAreaCornerProps extends BaseUIComponentProps<'div', ScrollAreaCornerState> {}
export declare namespace ScrollAreaCorner {
  type State = ScrollAreaCornerState;
  type Props = ScrollAreaCornerProps;
}