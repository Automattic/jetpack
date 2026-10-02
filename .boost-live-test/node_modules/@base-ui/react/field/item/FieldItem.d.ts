import * as React from 'react';
import { type FieldRootState } from "../root/FieldRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Groups individual items in a checkbox group or radio group with a label and description.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export declare const FieldItem: React.ForwardRefExoticComponent<Omit<FieldItemProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface FieldItemState extends FieldRootState {}
export interface FieldItemProps extends BaseUIComponentProps<'div', FieldItemState> {
  /**
   * Whether the wrapped control should ignore user interaction.
   * The `disabled` prop on `<Field.Root>` takes precedence over this.
   * @default false
   */
  disabled?: boolean | undefined;
}
export declare namespace FieldItem {
  type State = FieldItemState;
  type Props = FieldItemProps;
}