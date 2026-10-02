import type * as React from 'react';
import type { BaseUIComponentProps, Orientation } from "../../internals/types.js";
export interface ComboboxSeparatorProps extends BaseUIComponentProps<'div', ComboboxSeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}
export interface ComboboxSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}
/**
 * A visual separator between items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxSeparator: React.ForwardRefExoticComponent<ComboboxSeparatorProps & React.RefAttributes<HTMLDivElement>>;
export declare namespace ComboboxSeparator {
  type Props = ComboboxSeparatorProps;
  type State = ComboboxSeparatorState;
}