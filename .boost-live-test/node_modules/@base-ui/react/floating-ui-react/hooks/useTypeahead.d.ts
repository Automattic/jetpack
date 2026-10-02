import * as React from 'react';
import { type DisabledIndices } from "../utils/composite.js";
import type { ElementProps, FloatingContext, FloatingRootContext } from "../types.js";
export interface UseTypeaheadProps {
  /**
   * A ref which contains an array of strings whose indices match the HTML
   * elements of the list.
   * @default empty list
   */
  listRef: React.RefObject<Array<string | null>>;
  /**
   * The index of the active (focused or highlighted) item in the list.
   * @default null
   */
  activeIndex: number | null;
  /**
   * Callback invoked with the matching index if found as the user types.
   */
  onMatch?: ((index: number) => void) | undefined;
  /**
   * Optional list of item elements that correspond to `listRef` indices.
   * When an element exists for an index, typeahead skips it if it is hidden by
   * `display: none`, `visibility: hidden|collapse`, other browser-reported
   * visibility checks, or native disabled state.
   */
  elementsRef?: React.RefObject<Array<HTMLElement | null>> | undefined;
  /**
   * Indices that are disabled, either as an array or a predicate (the same shape as
   * `useListNavigation`'s `disabledIndices`). Disabled items are skipped while matching,
   * so a single keypress advances to the next selectable item (matching native `<select>`
   * and arrow-key navigation). The explicit disabled check doesn't read `elementsRef`, so
   * consumers whose items stay mounted-but-hidden while closed can still skip disabled items
   * without passing `elementsRef`.
   */
  disabledIndices?: DisabledIndices | undefined;
  /**
   * Callback invoked with the current typing activity as the user types.
   */
  onTyping?: ((isTyping: boolean) => void) | undefined;
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * The number of milliseconds to wait before resetting the typed string.
   * @default 750
   */
  resetMs?: number | undefined;
  /**
   * The index of the selected item in the list, if available.
   * @default null
   */
  selectedIndex?: number | null | undefined;
}
/**
 * Provides a matching callback that can be used to focus an item as the user
 * types, often used in tandem with `useListNavigation()`.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export declare function useTypeahead(context: FloatingRootContext | FloatingContext, props: UseTypeaheadProps): ElementProps;