import type * as React from 'react';
import type { BaseUIComponentProps, Orientation } from "../../internals/types.mjs";
export interface AutocompleteSeparatorProps extends BaseUIComponentProps<'div', AutocompleteSeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}
export interface AutocompleteSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}
/**
 * A visual separator between items or groups.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export declare const AutocompleteSeparator: React.ForwardRefExoticComponent<AutocompleteSeparatorProps & React.RefAttributes<HTMLDivElement>>;
export declare namespace AutocompleteSeparator {
  type Props = AutocompleteSeparatorProps;
  type State = AutocompleteSeparatorState;
}