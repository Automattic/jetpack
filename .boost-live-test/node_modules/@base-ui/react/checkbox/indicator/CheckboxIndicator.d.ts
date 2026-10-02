import * as React from 'react';
import type { CheckboxRootState } from "../root/CheckboxRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export declare const CheckboxIndicator: React.ForwardRefExoticComponent<Omit<CheckboxIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface CheckboxIndicatorState extends CheckboxRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface CheckboxIndicatorProps extends BaseUIComponentProps<'span', CheckboxIndicatorState> {
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace CheckboxIndicator {
  type State = CheckboxIndicatorState;
  type Props = CheckboxIndicatorProps;
}