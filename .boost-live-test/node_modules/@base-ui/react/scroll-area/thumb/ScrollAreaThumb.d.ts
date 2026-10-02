import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * The draggable part of the scrollbar that indicates the current scroll position.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export declare const ScrollAreaThumb: React.ForwardRefExoticComponent<Omit<ScrollAreaThumbProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ScrollAreaThumbState {
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean;
  /**
   * The component orientation.
   */
  orientation: 'horizontal' | 'vertical';
}
export interface ScrollAreaThumbProps extends BaseUIComponentProps<'div', ScrollAreaThumbState> {}
export declare namespace ScrollAreaThumb {
  type State = ScrollAreaThumbState;
  type Props = ScrollAreaThumbProps;
}