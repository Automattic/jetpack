import * as React from 'react';
/**
 * The current value of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export declare function AutocompleteValue(props: AutocompleteValue.Props): React.ReactElement;
export interface AutocompleteValueState {}
export interface AutocompleteValueProps {
  children?: React.ReactNode | ((value: string) => React.ReactNode);
}
export declare namespace AutocompleteValue {
  type State = AutocompleteValueState;
  type Props = AutocompleteValueProps;
}