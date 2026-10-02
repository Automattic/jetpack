import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Indicates whether the radio item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuRadioItemIndicator: React.ForwardRefExoticComponent<Omit<MenuRadioItemIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface MenuRadioItemIndicatorProps extends BaseUIComponentProps<'span', MenuRadioItemIndicatorState> {
  /**
   * Whether to keep the HTML element in the DOM when the radio item is inactive.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export interface MenuRadioItemIndicatorState {
  /**
   * Whether the radio item is currently selected.
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
export declare namespace MenuRadioItemIndicator {
  type Props = MenuRadioItemIndicatorProps;
  type State = MenuRadioItemIndicatorState;
}