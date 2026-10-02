import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.mjs";
import type { TabsRoot } from "../root/TabsRoot.mjs";
/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export declare const TabsTab: React.ForwardRefExoticComponent<Omit<TabsTabProps, "ref"> & React.RefAttributes<HTMLElement>>;
export type TabsTabValue = any | null;
export type TabsTabActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';
export interface TabsTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export interface TabsTabSize {
  width: number;
  height: number;
}
export interface TabsTabMetadata {
  disabled: boolean;
  id: string | undefined;
  value: TabsTab.Value | undefined;
}
export interface TabsTabState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the component is active.
   */
  active: boolean;
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}
export interface TabsTabProps extends NativeButtonProps, BaseUIComponentProps<'button', TabsTabState> {
  /**
   * The value of the Tab.
   */
  value: TabsTab.Value;
  /**
   * Whether the Tab is disabled.
   *
   * If a first Tab on a `<Tabs.List>` is disabled, it won't initially be selected.
   * Instead, the next enabled Tab will be selected.
   * However, it does not work like this during server-side rendering, as it is not known
   * during pre-rendering which Tabs are disabled.
   * To work around it, ensure that `defaultValue` or `value` on `<Tabs.Root>` is set to an enabled Tab's value.
   */
  disabled?: boolean | undefined;
}
export declare namespace TabsTab {
  type Value = TabsTabValue;
  type ActivationDirection = TabsTabActivationDirection;
  type Position = TabsTabPosition;
  type Size = TabsTabSize;
  type Metadata = TabsTabMetadata;
  type State = TabsTabState;
  type Props = TabsTabProps;
}