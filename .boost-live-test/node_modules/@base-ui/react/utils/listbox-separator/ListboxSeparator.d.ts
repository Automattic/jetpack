import type { BaseUIComponentProps, Orientation } from "../../internals/types.js";
export interface ListboxSeparatorProps extends BaseUIComponentProps<'div', ListboxSeparatorState> {
  /**
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
}
export interface ListboxSeparatorState {
  /**
   * The orientation of the separator.
   */
  orientation: Orientation;
}
export declare namespace ListboxSeparator {
  type Props = ListboxSeparatorProps;
  type State = ListboxSeparatorState;
}