import * as React from 'react';
/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare function ComboboxValue(props: ComboboxValue.Props): React.ReactElement;
export interface ComboboxValueState {}
export interface ComboboxValueProps {
  /**
   * Accepts a function that returns a `ReactNode` to format the selected value.
   * Treat the value as read-only: in `multiple` mode it may be a shared frozen array
   * when nothing is selected.
   */
  children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
  /**
   * The placeholder value to display when no value is selected.
   * This is overridden by `children` if specified, or by a null item's label in `items`.
   */
  placeholder?: React.ReactNode;
}
export declare namespace ComboboxValue {
  type State = ComboboxValueState;
  type Props = ComboboxValueProps;
}