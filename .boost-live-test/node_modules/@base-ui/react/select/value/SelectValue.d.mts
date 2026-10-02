import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectValue: React.ForwardRefExoticComponent<Omit<SelectValueProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface SelectValueState {
  /**
   * The value of the currently selected item.
   */
  value: any;
  /**
   * Whether the placeholder is being displayed.
   */
  placeholder: boolean;
}
export interface SelectValueProps extends Omit<BaseUIComponentProps<'span', SelectValueState>, 'children'> {
  /**
   * Accepts a function that returns a `ReactNode` to format the selected value.
   * Treat the value as read-only: in `multiple` mode it may be a shared frozen array
   * when nothing is selected.
   * @example
   * ```tsx
   * <Select.Value>
   *   {(value: string | null) => value ? labels[value] : 'No value'}
   * </Select.Value>
   * ```
   */
  children?: React.ReactNode | ((value: any) => React.ReactNode);
  /**
   * The placeholder value to display when no value is selected.
   * This is overridden by `children` if specified, or by a null item's label in `items`.
   */
  placeholder?: React.ReactNode;
}
export declare namespace SelectValue {
  type State = SelectValueState;
  type Props = SelectValueProps;
}