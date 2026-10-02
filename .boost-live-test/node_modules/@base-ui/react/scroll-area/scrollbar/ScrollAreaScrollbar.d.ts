import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { ScrollAreaRootState } from "../root/ScrollAreaRoot.js";
/**
 * A vertical or horizontal scrollbar for the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export declare const ScrollAreaScrollbar: React.ForwardRefExoticComponent<Omit<ScrollAreaScrollbarProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ScrollAreaScrollbarState extends ScrollAreaRootState {
  /**
   * Whether the scroll area is being hovered.
   */
  hovering: boolean;
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean;
  /**
   * The orientation of the scrollbar.
   */
  orientation: 'vertical' | 'horizontal';
}
export interface ScrollAreaScrollbarProps extends BaseUIComponentProps<'div', ScrollAreaScrollbarState> {
  /**
   * Whether the scrollbar controls vertical or horizontal scroll.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /**
   * Whether to keep the HTML element in the DOM when the viewport isn't scrollable.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace ScrollAreaScrollbar {
  type State = ScrollAreaScrollbarState;
  type Props = ScrollAreaScrollbarProps;
}