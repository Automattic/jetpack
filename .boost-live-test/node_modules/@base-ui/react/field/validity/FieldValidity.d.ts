import * as React from 'react';
import type { FieldValidityData } from "../root/FieldRoot.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * Used to display a custom message based on the field's validity.
 * Requires `children` to be a function that accepts field validity state as an argument.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export declare const FieldValidity: React.FC<FieldValidity.Props>;
export interface FieldValidityState extends Omit<FieldValidityData, 'state'> {
  /**
   * The validity state.
   */
  validity: FieldValidityData['state'];
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface FieldValidityProps {
  /**
   * A function that accepts the field validity state as an argument.
   *
   * ```jsx
   * <Field.Validity>
   *   {(validity) => {
   *     return <div>...</div>
   *   }}
   * </Field.Validity>
   * ```
   */
  children: (state: FieldValidityState) => React.ReactNode;
}
export declare namespace FieldValidity {
  type State = FieldValidityState;
  type Props = FieldValidityProps;
}