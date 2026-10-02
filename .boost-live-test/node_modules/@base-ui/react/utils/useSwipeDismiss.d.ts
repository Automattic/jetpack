import * as React from 'react';
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
type SwipeProgressDetailsInternal = {
  deltaX: number;
  deltaY: number;
  direction: SwipeDirection | undefined;
};
export declare function getDisplacement(direction: SwipeDirection, deltaX: number, deltaY: number): number;
export declare function useSwipeDismiss(options: UseSwipeDismissOptions): UseSwipeDismissReturnValue;
export interface UseSwipeDismissState {}
export interface UseSwipeDismissDetails {
  nativeEvent: PointerEvent | TouchEvent;
  direction: SwipeDirection | undefined;
}
export type UseSwipeDismissProgressDetails = SwipeProgressDetailsInternal;
export interface UseSwipeDismissOptions {
  enabled: boolean;
  directions: SwipeDirection[];
  elementRef: React.RefObject<HTMLElement | null>;
  movementCssVars: {
    x: string;
    y: string;
  };
  /**
   * The minimum distance (in pixels) the pointer must travel from the initial swipe point
   * before the gesture is considered a dismiss.
   * @default 40
   */
  swipeThreshold?: number | ((details: {
    element: HTMLElement;
    direction: SwipeDirection;
  }) => number) | undefined;
  /**
   * If provided, swiping will only begin once this returns true.
   * The predicate is evaluated on start and on subsequent move events while the pointer is down.
   */
  canStart?: ((position: {
    x: number;
    y: number;
  }, details: UseSwipeDismissDetails) => boolean) | undefined;
  /**
   * If true, swiping won't start when the gesture begins within a scrollable element.
   * This helps avoid conflicts between scrolling content and swipe-to-dismiss.
   * @default false
   */
  ignoreScrollableAncestors?: boolean | undefined;
  /**
   * If false, touch interactions can start swiping on interactive elements
   * that are ignored during pointer swipes.
   * @default true
   */
  ignoreSelectorWhenTouch?: boolean | undefined;
  /**
   * Whether to apply drag transform and movement styles to the element imperatively during a swipe.
   * Disable for event-only usage where the consumer drives styling itself.
   * @default true
   */
  trackDrag?: boolean | undefined;
  onSwipeStart?: ((event: PointerEvent | TouchEvent) => void) | undefined;
  onProgress?: ((progress: number, details?: UseSwipeDismissProgressDetails) => void) | undefined;
  onCancel?: ((event: PointerEvent | TouchEvent) => void) | undefined;
  /**
   * Called when the swipe interaction starts or ends.
   */
  onSwipingChange?: ((swiping: boolean) => void) | undefined;
  /**
   * Called when the swipe interaction ends. Returning `true` or `false`
   * overrides the default dismissal behavior.
   */
  onRelease?: ((details: {
    event: PointerEvent | TouchEvent;
    direction: SwipeDirection | undefined;
    deltaX: number;
    deltaY: number;
    velocityX: number;
    velocityY: number;
    releaseVelocityX: number;
    releaseVelocityY: number;
  }) => boolean | void) | undefined;
  onDismiss?: ((event: PointerEvent | TouchEvent, details: {
    direction: SwipeDirection;
  }) => void) | undefined;
}
export interface UseSwipeDismissReturnValue {
  swiping: boolean;
  swipeDirection: SwipeDirection | undefined;
  dragDismissed: boolean;
  getPointerProps: () => {
    onPointerDown?: ((event: React.PointerEvent) => void) | undefined;
    onPointerMove?: ((event: React.PointerEvent) => void) | undefined;
    onPointerUp?: ((event: React.PointerEvent) => void) | undefined;
    onPointerCancel?: ((event: React.PointerEvent) => void) | undefined;
  };
  getTouchProps: () => {
    onTouchStart?: ((event: React.TouchEvent) => void) | undefined;
    onTouchMove?: ((event: React.TouchEvent) => void) | undefined;
    onTouchEnd?: ((event: React.TouchEvent) => void) | undefined;
    onTouchCancel?: ((event: React.TouchEvent) => void) | undefined;
  };
  moveNative: (nativeEvent: TouchEvent, currentTarget: HTMLElement) => void;
  getDragStyles: () => React.CSSProperties;
  reset: () => void;
}
export {};