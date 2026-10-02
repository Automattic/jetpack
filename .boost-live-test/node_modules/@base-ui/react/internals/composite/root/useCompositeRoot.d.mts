import * as React from 'react';
import type { TextDirection } from "../../direction-context/DirectionContext.mjs";
import { type ModifierKey } from "../composite.mjs";
import type { CompositeMetadata } from "../list/CompositeList.mjs";
import type { HTMLProps } from "../../types.mjs";
import type { CompositeGridNavigator } from "./gridNavigation.mjs";
export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both' | undefined;
  grid?: CompositeGridNavigator | undefined;
  loopFocus?: boolean | undefined;
  onLoop?: ((event: React.KeyboardEvent, prevIndex: number, nextIndex: number, elementsRef: React.RefObject<Array<HTMLElement | null>>) => number) | undefined;
  highlightedIndex?: number | undefined;
  onHighlightedIndexChange?: ((index: number) => void) | undefined;
  direction: TextDirection;
  rootRef?: React.Ref<Element> | undefined;
  /**
   * When `true`, pressing the Home key moves focus to the first item,
   * and pressing the End key moves focus to the last item.
   * @default false
   */
  enableHomeAndEndKeys?: boolean | undefined;
  /**
   * When `true`, keypress events on Composite's navigation keys
   * be stopped with event.stopPropagation().
   * @default false
   */
  stopEventPropagation?: boolean | undefined;
  /**
   * Array of item indices to be considered disabled.
   * Used for composite items that are focusable when disabled.
   */
  disabledIndices?: number[] | undefined;
  /**
   * Array of [modifier key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#modifier_keys) that should allow normal keyboard actions
   * when pressed. By default, all modifier keys prevent normal actions.
   * @default []
   */
  modifierKeys?: ModifierKey[] | undefined;
}
export declare function useCompositeRoot(params: UseCompositeRootParameters): {
  props: HTMLProps;
  highlightedIndex: number;
  onHighlightedIndexChange: (index: any, shouldScrollIntoView?: any) => void;
  elementsRef: React.RefObject<(HTMLElement | null)[]>;
  onMapChange: (map: Map<Element, CompositeMetadata<any>>) => void;
  relayKeyboardEvent: (event: React.KeyboardEvent) => void;
};