import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * An overlay displayed beneath the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectBackdrop: React.ForwardRefExoticComponent<Omit<SelectBackdropProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectBackdropState {
  /**
   * Whether the component is open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface SelectBackdropProps extends BaseUIComponentProps<'div', SelectBackdropState> {}
export declare namespace SelectBackdrop {
  type State = SelectBackdropState;
  type Props = SelectBackdropProps;
}