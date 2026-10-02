import * as React from 'react';
import { type CompositeMetadata } from "../list/CompositeList.js";
import type { BaseUIComponentProps, BaseUIEvent } from "../../types.js";
import type { ModifierKey } from "../composite.js";
import type { CompositeGridNavigator } from "./gridNavigation.js";
import { StateAttributesMapping } from "../../getStateAttributesProps.js";
export declare function CompositeRoot<Metadata extends {}, State extends Record<string, any>>(componentProps: CompositeRoot.Props<Metadata, State>): React.JSX.Element;
export interface CompositeRootState {}
export interface CompositeRootProps<Metadata, State extends Record<string, any>> extends Pick<BaseUIComponentProps<'div', State>, 'render' | 'className' | 'children' | 'style'> {
  props?: Array<Record<string, any> | (() => Record<string, any>)> | undefined;
  state?: State | undefined;
  stateAttributesMapping?: StateAttributesMapping<State> | undefined;
  refs?: React.Ref<HTMLElement | null>[] | undefined;
  tag?: keyof React.JSX.IntrinsicElements | undefined;
  orientation?: 'horizontal' | 'vertical' | 'both' | undefined;
  grid?: CompositeGridNavigator | undefined;
  loopFocus?: boolean | undefined;
  onLoop?: ((event: React.KeyboardEvent, prevIndex: number, nextIndex: number, elementsRef: React.RefObject<Array<HTMLElement | null>>) => number) | undefined;
  highlightedIndex?: number | undefined;
  onHighlightedIndexChange?: ((index: number) => void) | undefined;
  enableHomeAndEndKeys?: boolean | undefined;
  onMapChange?: ((newMap: Map<Node, CompositeMetadata<Metadata>>) => void) | undefined;
  onKeyDown?: ((event: BaseUIEvent<React.KeyboardEvent>) => void) | undefined;
  stopEventPropagation?: boolean | undefined;
  rootRef?: React.RefObject<HTMLElement | null> | undefined;
  disabledIndices?: number[] | undefined;
  modifierKeys?: ModifierKey[] | undefined;
  highlightItemOnHover?: boolean | undefined;
}
export declare namespace CompositeRoot {
  type State = CompositeRootState;
  type Props<Metadata, TState extends Record<string, any>> = CompositeRootProps<Metadata, TState>;
}