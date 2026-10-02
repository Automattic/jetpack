import * as React from 'react';
import type { Orientation } from "../../internals/types.mjs";
import { Separator, type SeparatorState } from "../../separator/index.mjs";
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export declare const ToolbarSeparator: React.ForwardRefExoticComponent<Omit<ToolbarSeparatorProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToolbarSeparatorState extends SeparatorState {}
export interface ToolbarSeparatorProps extends Separator.Props {
  /**
   * The orientation of the separator. Defaults to the opposite of the toolbar's
   * orientation, so a horizontal toolbar renders vertical separators.
   */
  orientation?: Orientation | undefined;
}
export declare namespace ToolbarSeparator {
  type State = ToolbarSeparatorState;
  type Props = ToolbarSeparatorProps;
}