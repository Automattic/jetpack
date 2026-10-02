import * as React from 'react';
import type { SwitchRootState } from "../root/SwitchRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<span>`.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export declare const SwitchThumb: React.ForwardRefExoticComponent<Omit<SwitchThumbProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface SwitchThumbProps extends BaseUIComponentProps<'span', SwitchThumbState> {}
export interface SwitchThumbState extends SwitchRootState {}
export declare namespace SwitchThumb {
  type Props = SwitchThumbProps;
  type State = SwitchThumbState;
}