import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An individual chip that represents a value in a multiselectable input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxChip: React.ForwardRefExoticComponent<Omit<ComboboxChipProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxChipState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}
export interface ComboboxChipProps extends BaseUIComponentProps<'div', ComboboxChipState> {}
export declare namespace ComboboxChip {
  type State = ComboboxChipState;
  type Props = ComboboxChipProps;
}