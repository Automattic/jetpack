import type { Derivable, Middleware, Padding } from '@floating-ui/react-dom';
export interface ArrowOptions {
  /**
   * The arrow element to be positioned.
   * @default undefined
   */
  element: any;
  /**
   * The padding between the arrow element and the floating element edges.
   * Useful when the floating element has rounded corners.
   * @default 0
   */
  padding?: Padding | undefined;
  /**
   * Which element to use as the offset parent.
   * @default 'real'
   */
  offsetParent: 'real' | 'floating';
}
/**
 * Fork of the original `arrow` middleware from Floating UI that allows
 * configuring the offset parent.
 */
export declare const baseArrow: (options: ArrowOptions | Derivable<ArrowOptions>) => Middleware;
/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * This wraps the core `arrow` middleware to allow React refs as the element.
 * @see https://floating-ui.com/docs/arrow
 */
export declare const arrow: (options: ArrowOptions | Derivable<ArrowOptions>, deps?: React.DependencyList) => Middleware;