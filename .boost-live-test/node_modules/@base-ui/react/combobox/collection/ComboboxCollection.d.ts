import * as React from 'react';
/**
 * Renders filtered list items.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare function ComboboxCollection(props: ComboboxCollection.Props): React.JSX.Element;
export interface ComboboxCollectionState {}
export interface ComboboxCollectionProps {
  children: (item: any, index: number) => React.ReactNode;
}
export declare namespace ComboboxCollection {
  type State = ComboboxCollectionState;
  type Props = ComboboxCollectionProps;
}