import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
declare const DEFAULT_COORDS: {
  x: number;
  y: number;
};
declare const DEFAULT_SIZE: {
  width: number;
  height: number;
};
declare const DEFAULT_OVERFLOW_EDGES: {
  xStart: boolean;
  xEnd: boolean;
  yStart: boolean;
  yEnd: boolean;
};
declare const DEFAULT_HIDDEN_STATE: {
  x: boolean;
  y: boolean;
  corner: boolean;
};
export type HiddenState = typeof DEFAULT_HIDDEN_STATE;
export type OverflowEdges = typeof DEFAULT_OVERFLOW_EDGES;
export type Size = typeof DEFAULT_SIZE;
export type Coords = typeof DEFAULT_COORDS;
/**
 * Groups all parts of the scroll area.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export declare const ScrollAreaRoot: React.ForwardRefExoticComponent<Omit<ScrollAreaRootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ScrollAreaRootState {
  /**
   * Whether the scroll area is being scrolled.
   */
  scrolling: boolean;
  /**
   * Whether horizontal overflow is present.
   */
  hasOverflowX: boolean;
  /**
   * Whether vertical overflow is present.
   */
  hasOverflowY: boolean;
  /**
   * Whether there is overflow on the inline start side for the horizontal axis.
   */
  overflowXStart: boolean;
  /**
   * Whether there is overflow on the inline end side for the horizontal axis.
   */
  overflowXEnd: boolean;
  /**
   * Whether there is overflow on the block start side.
   */
  overflowYStart: boolean;
  /**
   * Whether there is overflow on the block end side.
   */
  overflowYEnd: boolean;
  /**
   * Whether the scrollbar corner is hidden.
   */
  cornerHidden: boolean;
}
export interface ScrollAreaRootProps extends BaseUIComponentProps<'div', ScrollAreaRootState> {
  /**
   * The threshold in pixels that must be passed before the overflow edge attributes are applied.
   * Accepts a single number for all edges or an object to configure them individually.
   * @default 0
   */
  overflowEdgeThreshold?: number | Partial<{
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  }> | undefined;
}
export declare namespace ScrollAreaRoot {
  type State = ScrollAreaRootState;
  type Props = ScrollAreaRootProps;
}
export {};