import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * A button to remove a chip.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxChipRemove: React.ForwardRefExoticComponent<Omit<ComboboxChipRemoveProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface ComboboxChipRemoveState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}
export interface ComboboxChipRemoveProps extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxChipRemoveState> {}
export declare namespace ComboboxChipRemove {
  type State = ComboboxChipRemoveState;
  type Props = ComboboxChipRemoveProps;
}