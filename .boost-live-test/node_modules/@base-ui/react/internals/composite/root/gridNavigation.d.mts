import type * as React from 'react';
type CompositeGridElementsRef = React.RefObject<Array<HTMLElement | null>>;
type CompositeGridOnLoop = (event: React.KeyboardEvent, prevIndex: number, nextIndex: number) => number;
export interface CompositeGridItemSize {
  width: number;
  height: number;
}
export interface CompositeGridConfig {
  cols: number;
  dense?: boolean | undefined;
  itemSizes?: CompositeGridItemSize[] | undefined;
}
export interface CompositeGridNavigationState {
  event: React.KeyboardEvent;
  elementsRef: CompositeGridElementsRef;
  highlightedIndex: number;
  minIndex: number;
  maxIndex: number;
  orientation: 'horizontal' | 'vertical' | 'both';
  loopFocus: boolean;
  onLoop?: CompositeGridOnLoop | undefined;
  disabledIndices?: number[] | undefined;
  rtl: boolean;
}
export type CompositeGridNavigator = (state: CompositeGridNavigationState) => number;
/**
 * Builds the grid navigation handler passed to `CompositeRoot`/`useCompositeRoot`
 * via the `grid` prop. Importing and calling this is the opt-in for grid
 * navigation: composites that don't pass `grid` never reference the algorithm,
 * so bundlers tree-shake the grid helpers out.
 */
export declare function gridNavigation(config: CompositeGridConfig): CompositeGridNavigator;
export {};