import * as React from 'react';
export type CompositeMetadata<CustomMetadata> = {
  index: number;
} & CustomMetadata;
/**
 * Provides context for a list of items in a composite component.
 */
export declare function CompositeList<Metadata>(props: CompositeList.Props<Metadata>): React.JSX.Element;
export interface CompositeListState {}
export interface CompositeListProps<Metadata> {
  children: React.ReactNode;
  /**
   * A ref to the list of HTML elements, ordered by their index.
   * Explicit indexes can leave empty slots in the array.
   * `useListNavigation`'s `listRef` prop.
   */
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
  /**
   * A ref to the list of element labels, ordered by their index.
   * `useTypeahead`'s `listRef` prop.
   */
  labelsRef?: React.RefObject<Array<string | null>> | undefined;
  onMapChange?: ((newMap: Map<Element, CompositeMetadata<Metadata>>) => void) | undefined;
}
export declare namespace CompositeList {
  type State = CompositeListState;
  type Props<Metadata> = CompositeListProps<Metadata>;
}