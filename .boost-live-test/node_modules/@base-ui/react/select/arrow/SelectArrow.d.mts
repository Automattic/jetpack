import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { Align, Side } from "../../internals/useAnchorPositioning.mjs";
/**
 * Displays an element positioned against the select popup anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectArrow: React.ForwardRefExoticComponent<Omit<SelectArrowProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectArrowState {
  /**
   * Whether the select popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side | 'none';
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}
export interface SelectArrowProps extends BaseUIComponentProps<'div', SelectArrowState> {}
export declare namespace SelectArrow {
  type State = SelectArrowState;
  type Props = SelectArrowProps;
}