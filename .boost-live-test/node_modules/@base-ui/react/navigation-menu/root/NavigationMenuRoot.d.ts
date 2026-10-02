import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.js";
import { REASONS } from "../../internals/reasons.js";
/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export declare const NavigationMenuRoot: {
  <Value = any>(props: NavigationMenuRoot.Props<Value>): React.JSX.Element;
};
export interface NavigationMenuRootState {
  /**
   * If `true`, the popup is open.
   */
  open: boolean;
  /**
   * Whether the navigation menu is nested.
   */
  nested: boolean;
}
export interface NavigationMenuRootProps<Value = any> extends BaseUIComponentProps<'nav', NavigationMenuRootState> {
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<NavigationMenuRoot.Actions | null> | undefined;
  /**
   * Event handler called after any animations complete when the navigation menu is closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * The controlled value of the navigation menu item that should be currently open.
   * When non-nullish, the menu will be open. When nullish, the menu will be closed.
   *
   * To render an uncontrolled navigation menu, use the `defaultValue` prop instead.
   * @default null
   */
  value?: Value | null | undefined;
  /**
   * The uncontrolled value of the item that should be initially selected.
   *
   * To render a controlled navigation menu, use the `value` prop instead.
   * @default null
   */
  defaultValue?: Value | null | undefined;
  /**
   * Callback fired when the value changes.
   */
  onValueChange?: ((value: Value | null, eventDetails: NavigationMenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * How long to wait before opening the navigation popup. Specified in milliseconds.
   * @default 50
   */
  delay?: number | undefined;
  /**
   * How long to wait before closing the navigation popup. Specified in milliseconds.
   * @default 50
   */
  closeDelay?: number | undefined;
  /**
   * The orientation of the navigation menu.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical' | undefined;
}
export interface NavigationMenuRootActions {
  unmount: () => void;
}
export type NavigationMenuRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.triggerHover | typeof REASONS.outsidePress | typeof REASONS.listNavigation | typeof REASONS.focusOut | typeof REASONS.escapeKey | typeof REASONS.linkPress | typeof REASONS.none;
export type NavigationMenuRootChangeEventDetails = BaseUIChangeEventDetails<NavigationMenuRoot.ChangeEventReason>;
export declare namespace NavigationMenuRoot {
  type State = NavigationMenuRootState;
  type Props<TValue = any> = NavigationMenuRootProps<TValue>;
  type Value<TValue = any> = TValue | null;
  type Actions = NavigationMenuRootActions;
  type ChangeEventReason = NavigationMenuRootChangeEventReason;
  type ChangeEventDetails = NavigationMenuRootChangeEventDetails;
}