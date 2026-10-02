import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
import { MenuHandle } from "../store/MenuHandle.mjs";
/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export declare const MenuTrigger: MenuTrigger;
export interface MenuTrigger {
  <Payload>(componentProps: MenuTriggerProps<Payload> & React.RefAttributes<HTMLElement>): React.JSX.Element;
}
export interface MenuTriggerProps<Payload = unknown> extends NativeButtonProps, BaseUIComponentProps<'button', MenuTriggerState> {
  children?: React.ReactNode;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A handle to associate the trigger with a menu.
   */
  handle?: MenuHandle<Payload> | undefined;
  /**
   * A payload to pass to the menu when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * How long to wait before the menu may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 100
   */
  delay?: number | undefined;
  /**
   * How long to wait before closing the menu that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay?: number | undefined;
  /**
   * Whether the menu should also open when the trigger is hovered.
   */
  openOnHover?: boolean | undefined;
}
export interface MenuTriggerState {
  /**
   * Whether the menu is currently open and was opened by this trigger.
   */
  open: boolean;
  /**
   * Whether the trigger is disabled.
   */
  disabled: boolean;
}
export declare namespace MenuTrigger {
  type Props<Payload = unknown> = MenuTriggerProps<Payload>;
  type State = MenuTriggerState;
}