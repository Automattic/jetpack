import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { ToolbarRootState } from "../root/ToolbarRoot.js";
/**
 * Groups several toolbar items or toggles.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export declare const ToolbarGroup: React.ForwardRefExoticComponent<Omit<ToolbarGroupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToolbarGroupState extends ToolbarRootState {}
export interface ToolbarGroupProps extends BaseUIComponentProps<'div', ToolbarGroupState> {
  /**
   * When `true` all toolbar items in the group are disabled.
   * @default false
   */
  disabled?: boolean | undefined;
}
export declare namespace ToolbarGroup {
  type State = ToolbarGroupState;
  type Props = ToolbarGroupProps;
}