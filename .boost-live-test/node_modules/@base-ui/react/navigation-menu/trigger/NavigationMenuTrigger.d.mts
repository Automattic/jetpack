import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
/**
 * Opens the navigation menu popup when hovered or clicked, revealing the
 * associated content.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuTrigger: React.ForwardRefExoticComponent<Omit<NavigationMenuTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface NavigationMenuTriggerState {
  /**
   * If `true`, the popup is open and the item is active.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}
export interface NavigationMenuTriggerProps extends NativeButtonProps, BaseUIComponentProps<'button', NavigationMenuTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}
export declare namespace NavigationMenuTrigger {
  type State = NavigationMenuTriggerState;
  type Props = NavigationMenuTriggerProps;
}