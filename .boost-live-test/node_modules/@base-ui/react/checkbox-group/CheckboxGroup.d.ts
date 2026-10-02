import * as React from 'react';
import type { FieldRootState } from "../field/root/FieldRoot.js";
import type { BaseUIComponentProps } from "../internals/types.js";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.js";
import { REASONS } from "../internals/reasons.js";
/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
export declare const CheckboxGroup: React.ForwardRefExoticComponent<Omit<CheckboxGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface CheckboxGroupState extends FieldRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}
export interface CheckboxGroupProps extends BaseUIComponentProps<'div', CheckboxGroupState> {
  /**
   * Names of the checkboxes in the group that should be ticked.
   *
   * To render an uncontrolled checkbox group, use the `defaultValue` prop instead.
   */
  value?: string[] | undefined;
  /**
   * Names of the checkboxes in the group that should be initially ticked.
   *
   * To render a controlled checkbox group, use the `value` prop instead.
   */
  defaultValue?: string[] | undefined;
  /**
   * Event handler called when a checkbox in the group is ticked or unticked.
   * Provides the new value as an argument.
   */
  onValueChange?: ((value: string[], eventDetails: CheckboxGroupChangeEventDetails) => void) | undefined;
  /**
   * Names of all checkboxes in the group. Use this when creating a parent checkbox.
   */
  allValues?: string[] | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
export type CheckboxGroupChangeEventReason = typeof REASONS.none;
export type CheckboxGroupChangeEventDetails = BaseUIChangeEventDetails<CheckboxGroup.ChangeEventReason>;
export declare namespace CheckboxGroup {
  type State = CheckboxGroupState;
  type Props = CheckboxGroupProps;
  type ChangeEventReason = CheckboxGroupChangeEventReason;
  type ChangeEventDetails = CheckboxGroupChangeEventDetails;
}