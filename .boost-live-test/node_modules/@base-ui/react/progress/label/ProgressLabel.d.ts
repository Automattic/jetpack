import * as React from 'react';
import type { ProgressRootState } from "../root/ProgressRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label for the progress bar.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export declare const ProgressLabel: React.ForwardRefExoticComponent<Omit<ProgressLabelProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface ProgressLabelState extends ProgressRootState {}
export interface ProgressLabelProps extends BaseUIComponentProps<'span', ProgressLabelState> {}
export declare namespace ProgressLabel {
  type State = ProgressLabelState;
  type Props = ProgressLabelProps;
}