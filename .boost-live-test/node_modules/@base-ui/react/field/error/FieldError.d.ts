import * as React from 'react';
import { type FieldRootState } from "../root/FieldRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export declare const FieldError: React.ForwardRefExoticComponent<Omit<FieldErrorProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface FieldErrorState extends FieldRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface FieldErrorProps extends BaseUIComponentProps<'div', FieldErrorState> {
  /**
   * Determines whether to show the error message according to the field's
   * [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).
   * Specifying `true` will always show the error message, and lets external libraries
   * control the visibility.
   */
  match?: boolean | keyof ValidityState | undefined;
}
export declare namespace FieldError {
  type State = FieldErrorState;
  type Props = FieldErrorProps;
}