import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
import type { FieldRootState } from "../../field/root/FieldRoot.mjs";
import type { Side } from "../../internals/useAnchorPositioning.mjs";
/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxTrigger: React.ForwardRefExoticComponent<Omit<ComboboxTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface ComboboxTriggerState extends FieldRootState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the component should ignore user edits.
   */
  readOnly: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   * Whether the combobox doesn't have a value.
   */
  placeholder: boolean;
}
export interface ComboboxTriggerProps extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
export declare namespace ComboboxTrigger {
  type State = ComboboxTriggerState;
  type Props = ComboboxTriggerProps;
}