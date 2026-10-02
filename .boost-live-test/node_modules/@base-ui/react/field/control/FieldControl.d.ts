import * as React from 'react';
import { type FieldRootState } from "../root/FieldRoot.js";
import { BaseUIComponentProps } from "../../internals/types.js";
import { REASONS } from "../../internals/reasons.js";
import type { BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.js";
/**
 * The form control to label and validate.
 * Renders an `<input>` element.
 *
 * You can omit this part and use any Base UI input component instead. For example,
 * [Input](https://base-ui.com/react/components/input), [Checkbox](https://base-ui.com/react/components/checkbox),
 * or [Select](https://base-ui.com/react/components/select), among others, will work with Field out of the box.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export declare const FieldControl: React.ForwardRefExoticComponent<Omit<FieldControlProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface FieldControlState extends FieldRootState {}
export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControlState> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?: ((value: string, eventDetails: FieldControl.ChangeEventDetails) => void) | undefined;
  defaultValue?: React.ComponentProps<'input'>['defaultValue'] | undefined;
}
export type FieldControlChangeEventReason = typeof REASONS.none;
export type FieldControlChangeEventDetails = BaseUIChangeEventDetails<FieldControl.ChangeEventReason>;
export declare namespace FieldControl {
  type State = FieldControlState;
  type Props = FieldControlProps;
  type ChangeEventReason = FieldControlChangeEventReason;
  type ChangeEventDetails = FieldControlChangeEventDetails;
}