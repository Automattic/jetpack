import * as React from 'react';
export interface UseCompositeListItemParameters<Metadata> {
  /**
   * Whether to guess the initial index from render order, avoiding a re-render after mount for
   * flat lists.
   * @default false
   */
  guess?: boolean | undefined;
  index?: number | undefined;
  label?: string | null | undefined;
  /**
   * Metadata published with the item. Keep object values referentially stable to avoid
   * unnecessarily detaching and reattaching the callback ref.
   */
  metadata?: Metadata | undefined;
  /** Keep the ref object stable to avoid unnecessarily reattaching the item. */
  textRef?: React.RefObject<HTMLElement | null> | undefined;
}
interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: number;
}
/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export declare function useCompositeListItem<Metadata>(params?: UseCompositeListItemParameters<Metadata>): UseCompositeListItemReturnValue;
export {};