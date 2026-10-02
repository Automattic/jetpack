import * as React from 'react';
/**
 * Calls the provided function when the CSS open/close animation or transition completes.
 */
export declare function useOpenChangeComplete(parameters: UseOpenChangeCompleteParameters): void;
export interface UseOpenChangeCompleteParameters {
  /**
   * Whether the hook is enabled.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Whether the element is open.
   */
  open?: boolean | undefined;
  /**
   * Ref to the element being closed.
   */
  ref: React.RefObject<HTMLElement | null>;
  /**
   * Whether completions ready in the same microtask may be coalesced into a single commit.
   * Only safe when `onComplete` doesn't read state that another completion can change.
   * @default false
   */
  batch?: boolean | undefined;
  /**
   * Function to call when the animation completes (or there is no animation).
   */
  onComplete: () => void;
}
export interface UseOpenChangeCompleteState {}