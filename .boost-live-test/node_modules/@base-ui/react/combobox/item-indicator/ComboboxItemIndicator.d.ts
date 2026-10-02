import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Indicates whether the item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxItemIndicator: React.ForwardRefExoticComponent<Omit<ComboboxItemIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface ComboboxItemIndicatorProps extends BaseUIComponentProps<'span', ComboboxItemIndicatorState> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export interface ComboboxItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export declare namespace ComboboxItemIndicator {
  type Props = ComboboxItemIndicatorProps;
  type State = ComboboxItemIndicatorState;
}