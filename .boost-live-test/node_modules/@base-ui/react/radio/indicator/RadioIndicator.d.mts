import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { RadioRootState } from "../root/RadioRoot.mjs";
import { type TransitionStatus } from "../../internals/useTransitionStatus.mjs";
/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export declare const RadioIndicator: React.ForwardRefExoticComponent<Omit<RadioIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface RadioIndicatorProps extends BaseUIComponentProps<'span', RadioIndicatorState> {
  /**
   * Whether to keep the HTML element in the DOM when the radio button is inactive.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export interface RadioIndicatorState extends RadioRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export declare namespace RadioIndicator {
  type Props = RadioIndicatorProps;
  type State = RadioIndicatorState;
}