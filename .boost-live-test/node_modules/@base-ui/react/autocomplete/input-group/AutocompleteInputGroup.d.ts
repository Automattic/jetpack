import type * as React from 'react';
import type { FieldRoot } from "../../field/root/FieldRoot.js";
import type { Side } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A wrapper for the input and its associated controls.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export declare const AutocompleteInputGroup: AutocompleteInputGroup;
export interface AutocompleteInputGroupState extends FieldRoot.State {
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
}
export interface AutocompleteInputGroupProps extends BaseUIComponentProps<'div', AutocompleteInputGroupState> {}
export interface AutocompleteInputGroup {
  (componentProps: AutocompleteInputGroupProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}
export declare namespace AutocompleteInputGroup {
  type State = AutocompleteInputGroupState;
  type Props = AutocompleteInputGroupProps;
}