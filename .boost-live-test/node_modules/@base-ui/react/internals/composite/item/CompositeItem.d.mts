import * as React from 'react';
import type { BaseUIComponentProps } from "../../types.mjs";
import { StateAttributesMapping } from "../../getStateAttributesProps.mjs";
export declare function CompositeItem<Metadata, State extends Record<string, any>>(componentProps: CompositeItem.Props<Metadata, State>): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
export interface CompositeItemState {}
export interface CompositeItemProps<Metadata, State extends Record<string, any>> extends Pick<BaseUIComponentProps<any, State>, 'render' | 'className' | 'style'> {
  children?: React.ReactNode;
  metadata?: Metadata | undefined;
  refs?: React.Ref<HTMLElement | null>[] | undefined;
  props?: Array<Record<string, any> | (() => Record<string, any>)> | undefined;
  state?: State | undefined;
  stateAttributesMapping?: StateAttributesMapping<State> | undefined;
  tag?: keyof React.JSX.IntrinsicElements | undefined;
}
export declare namespace CompositeItem {
  type State = CompositeItemState;
  type Props<Metadata, TState extends Record<string, any>> = CompositeItemProps<Metadata, TState>;
}