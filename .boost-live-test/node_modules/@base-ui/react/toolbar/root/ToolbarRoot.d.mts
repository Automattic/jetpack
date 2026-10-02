import * as React from 'react';
import { BaseUIComponentProps, Orientation as BaseOrientation } from "../../internals/types.mjs";
/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export declare const ToolbarRoot: React.ForwardRefExoticComponent<Omit<ToolbarRootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ToolbarRootItemMetadata {
  disabled: boolean;
  focusableWhenDisabled: boolean;
}
export type ToolbarRootOrientation = BaseOrientation;
export interface ToolbarRootState {
  /**
   * Whether the component is disabled.
   */
  disabled: boolean;
  /**
   * The component orientation.
   */
  orientation: ToolbarRoot.Orientation;
}
export interface ToolbarRootProps extends BaseUIComponentProps<'div', ToolbarRootState> {
  disabled?: boolean | undefined;
  /**
   * The orientation of the toolbar.
   * @default 'horizontal'
   */
  orientation?: ToolbarRoot.Orientation | undefined;
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
   *
   * @default true
   */
  loopFocus?: boolean | undefined;
}
export declare namespace ToolbarRoot {
  type ItemMetadata = ToolbarRootItemMetadata;
  type Orientation = ToolbarRootOrientation;
  type State = ToolbarRootState;
  type Props = ToolbarRootProps;
}