import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
import type { ToolbarRootState } from "../root/ToolbarRoot.js";
/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export declare const ToolbarButton: React.ForwardRefExoticComponent<Omit<ToolbarButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface ToolbarButtonState extends ToolbarRootState {
  /**
   * Whether the component is disabled.
   */
  disabled: boolean;
  /**
   * Whether the component remains focusable when disabled.
   */
  focusable: boolean;
}
export interface ToolbarButtonProps extends NativeButtonProps, BaseUIComponentProps<'button', ToolbarButtonState> {
  /**
   * When `true` the item is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * When `true` the item remains focusable when disabled.
   * @default true
   */
  focusableWhenDisabled?: boolean | undefined;
}
export declare namespace ToolbarButton {
  type State = ToolbarButtonState;
  type Props = ToolbarButtonProps;
}