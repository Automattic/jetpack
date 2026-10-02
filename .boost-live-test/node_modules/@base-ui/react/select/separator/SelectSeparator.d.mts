import type * as React from 'react';
import type { BaseUIComponentProps, Orientation } from "../../internals/types.mjs";
export interface SelectSeparatorProps extends BaseUIComponentProps<'div', SelectSeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}
export interface SelectSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}
/**
 * A visual separator between items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectSeparator: React.ForwardRefExoticComponent<SelectSeparatorProps & React.RefAttributes<HTMLDivElement>>;
export declare namespace SelectSeparator {
  type Props = SelectSeparatorProps;
  type State = SelectSeparatorState;
}