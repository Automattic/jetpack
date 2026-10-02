import * as React from 'react';
import type { Side, Align } from "../../internals/useAnchorPositioning.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Displays an element positioned against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxArrow: React.ForwardRefExoticComponent<Omit<ComboboxArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxArrowState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}
export interface ComboboxArrowProps extends BaseUIComponentProps<'div', ComboboxArrowState> {}
export declare namespace ComboboxArrow {
  type State = ComboboxArrowState;
  type Props = ComboboxArrowProps;
}