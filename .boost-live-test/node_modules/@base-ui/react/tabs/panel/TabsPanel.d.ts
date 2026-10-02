import * as React from 'react';
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TabsRootState } from "../root/TabsRoot.js";
import type { TabsTab } from "../tab/TabsTab.js";
/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export declare const TabsPanel: React.ForwardRefExoticComponent<Omit<TabsPanelProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface TabsPanelMetadata {
  id?: string | undefined;
  value: TabsTab.Value;
}
export interface TabsPanelState extends TabsRootState {
  /**
   * Whether the component is hidden.
   */
  hidden: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface TabsPanelProps extends BaseUIComponentProps<'div', TabsPanelState> {
  /**
   * The value of the TabPanel. It will be shown when the Tab with the corresponding value is active.
   */
  value: TabsTab.Value;
  /**
   * Whether to keep the HTML element in the DOM while the panel is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace TabsPanel {
  type Metadata = TabsPanelMetadata;
  type State = TabsPanelState;
  type Props = TabsPanelProps;
}