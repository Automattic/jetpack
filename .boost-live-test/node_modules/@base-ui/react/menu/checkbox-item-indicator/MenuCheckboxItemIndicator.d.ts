import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Indicates whether the checkbox item is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuCheckboxItemIndicator: React.ForwardRefExoticComponent<Omit<MenuCheckboxItemIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface MenuCheckboxItemIndicatorProps extends BaseUIComponentProps<'span', MenuCheckboxItemIndicatorState> {
  /**
   * Whether to keep the HTML element in the DOM when the checkbox item is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export interface MenuCheckboxItemIndicatorState {
  /**
   * Whether the checkbox item is currently ticked.
   */
  checked: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export declare namespace MenuCheckboxItemIndicator {
  type Props = MenuCheckboxItemIndicatorProps;
  type State = MenuCheckboxItemIndicatorState;
}