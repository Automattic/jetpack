import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { FieldRootState } from "../../field/root/FieldRoot.js";
import type { Side } from "../../internals/useAnchorPositioning.js";
/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxInput: React.ForwardRefExoticComponent<Omit<ComboboxInputProps, "ref"> & React.RefAttributes<HTMLInputElement>>;
export interface ComboboxInputState extends FieldRootState {
  /**
   * Whether the corresponding popup is open.
   */
  open: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   * Whether the component should ignore user edits.
   */
  readOnly: boolean;
}
export interface ComboboxInputProps extends BaseUIComponentProps<'input', ComboboxInputState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
export declare namespace ComboboxInput {
  type State = ComboboxInputState;
  type Props = ComboboxInputProps;
}