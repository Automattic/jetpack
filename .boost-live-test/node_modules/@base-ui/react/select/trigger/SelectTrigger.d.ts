import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
import type { FieldRootState } from "../../field/root/FieldRoot.js";
import type { Side } from "../../internals/useAnchorPositioning.js";
/**
 * A button that opens the select popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectTrigger: React.ForwardRefExoticComponent<Omit<SelectTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface SelectTriggerState extends FieldRootState {
  /**
   * Whether the select popup is currently open.
   */
  open: boolean;
  /**
   * Whether the select popup is readonly.
   */
  readOnly: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * The value of the currently selected item.
   */
  value: any;
  /**
   * Whether the select doesn't have a value.
   */
  placeholder: boolean;
}
export interface SelectTriggerProps extends NativeButtonProps, BaseUIComponentProps<'button', SelectTriggerState> {
  children?: React.ReactNode;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled?: boolean | undefined;
}
export declare namespace SelectTrigger {
  type State = SelectTriggerState;
  type Props = SelectTriggerProps;
}