import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { FieldRoot } from "../../field/root/FieldRoot.mjs";
import type { Side } from "../../internals/useAnchorPositioning.mjs";
/**
 * A wrapper for the input and its associated controls.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxInputGroup: React.ForwardRefExoticComponent<Omit<ComboboxInputGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxInputGroupState extends FieldRoot.State {
  /**
   * Whether the corresponding popup is open.
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
export interface ComboboxInputGroupProps extends BaseUIComponentProps<'div', ComboboxInputGroup.State> {}
export declare namespace ComboboxInputGroup {
  type State = ComboboxInputGroupState;
  type Props = ComboboxInputGroupProps;
}