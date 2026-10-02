import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TabsRoot, TabsRootState } from "../root/TabsRoot.js";
import type { TabsTab } from "../tab/TabsTab.js";
/**
 * A visual indicator that can be styled to match the position of the currently active tab.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export declare const TabsIndicator: React.ForwardRefExoticComponent<Omit<TabsIndicatorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface TabsIndicatorState extends TabsRootState {
  /**
   * The active tab position.
   */
  activeTabPosition: TabsTab.Position | null;
  /**
   * The active tab size.
   */
  activeTabSize: TabsTab.Size | null;
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
}
export interface TabsIndicatorProps extends BaseUIComponentProps<'span', TabsIndicatorState> {
  /**
   * Whether to render itself before React hydrates.
   * This minimizes the time that the indicator isn't visible after server-side rendering.
   * @default false
   */
  renderBeforeHydration?: boolean | undefined;
}
export declare namespace TabsIndicator {
  type State = TabsIndicatorState;
  type Props = TabsIndicatorProps;
}