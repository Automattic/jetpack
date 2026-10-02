import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An icon that indicates that the trigger button opens a select popup.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectIcon: React.ForwardRefExoticComponent<Omit<SelectIconProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface SelectIconState {
  /**
   * Whether the select popup is currently open.
   */
  open: boolean;
}
export interface SelectIconProps extends BaseUIComponentProps<'span', SelectIconState> {}
export declare namespace SelectIcon {
  type State = SelectIconState;
  type Props = SelectIconProps;
}