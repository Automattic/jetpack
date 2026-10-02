import type * as React from 'react';
import type { FieldRootState } from "../../field/root/FieldRoot.js";
import type { Side } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export declare const AutocompleteTrigger: AutocompleteTrigger;
export interface AutocompleteTriggerState extends FieldRootState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   *  Whether the component should ignore user edits.
   */
  readOnly: boolean;
}
export interface AutocompleteTriggerProps extends NativeButtonProps, BaseUIComponentProps<'button', AutocompleteTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
export interface AutocompleteTrigger {
  (componentProps: AutocompleteTriggerProps & React.RefAttributes<HTMLButtonElement>): React.JSX.Element;
}
export declare namespace AutocompleteTrigger {
  type State = AutocompleteTriggerState;
  type Props = AutocompleteTriggerProps;
}