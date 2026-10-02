import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { MenuRoot } from "../root/MenuRoot.js";
/**
 * Groups related radio items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuRadioGroup: React.NamedExoticComponent<Omit<MenuRadioGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface MenuRadioGroupProps extends BaseUIComponentProps<'div', MenuRadioGroupState> {
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
  /**
   * The controlled value of the radio item that should be currently selected.
   *
   * To render an uncontrolled radio group, use the `defaultValue` prop instead.
   */
  value?: any;
  /**
   * The uncontrolled value of the radio item that should be initially selected.
   *
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue?: any;
  /**
   * Function called when the selected value changes.
   */
  onValueChange?: ((value: any, eventDetails: MenuRadioGroup.ChangeEventDetails) => void) | undefined;
  /**
   * Whether the component should ignore user interaction.
   *
   * @default false
   */
  disabled?: boolean | undefined;
}
export interface MenuRadioGroupState {
  /**
   * Whether the component is disabled.
   */
  disabled: boolean;
}
export type MenuRadioGroupChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuRadioGroupChangeEventDetails = MenuRoot.ChangeEventDetails;
export declare namespace MenuRadioGroup {
  type Props = MenuRadioGroupProps;
  type State = MenuRadioGroupState;
  type ChangeEventReason = MenuRadioGroupChangeEventReason;
  type ChangeEventDetails = MenuRadioGroupChangeEventDetails;
}