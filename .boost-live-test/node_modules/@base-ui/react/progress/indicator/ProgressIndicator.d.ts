import * as React from 'react';
import type { ProgressRootState } from "../root/ProgressRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Visualizes the completion status of the task.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export declare const ProgressIndicator: React.ForwardRefExoticComponent<Omit<ProgressIndicatorProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ProgressIndicatorState extends ProgressRootState {}
export interface ProgressIndicatorProps extends BaseUIComponentProps<'div', ProgressIndicatorState> {}
export declare namespace ProgressIndicator {
  type State = ProgressIndicatorState;
  type Props = ProgressIndicatorProps;
}