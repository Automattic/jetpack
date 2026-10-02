import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectItemIndicator: React.ForwardRefExoticComponent<Omit<SelectItemIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface SelectItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface SelectItemIndicatorProps extends BaseUIComponentProps<'span', SelectItemIndicatorState> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   */
  keepMounted?: boolean | undefined;
}
export declare namespace SelectItemIndicator {
  type State = SelectItemIndicatorState;
  type Props = SelectItemIndicatorProps;
}