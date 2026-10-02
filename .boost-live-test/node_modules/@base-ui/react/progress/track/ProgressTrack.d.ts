import * as React from 'react';
import type { ProgressRootState } from "../root/ProgressRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Contains the progress bar indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export declare const ProgressTrack: React.ForwardRefExoticComponent<Omit<ProgressTrackProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ProgressTrackState extends ProgressRootState {}
export interface ProgressTrackProps extends BaseUIComponentProps<'div', ProgressTrackState> {}
export declare namespace ProgressTrack {
  type State = ProgressTrackState;
  type Props = ProgressTrackProps;
}