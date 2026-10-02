import * as React from 'react';
import type { BaseUIComponentProps, Orientation } from "../internals/types.js";
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
export declare const Separator: React.ForwardRefExoticComponent<Omit<SeparatorProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SeparatorProps extends BaseUIComponentProps<'div', SeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}
export interface SeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}
export declare namespace Separator {
  type Props = SeparatorProps;
  type State = SeparatorState;
}