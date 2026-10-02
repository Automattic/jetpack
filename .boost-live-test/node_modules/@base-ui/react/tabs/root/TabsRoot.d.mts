import * as React from 'react';
import type { BaseUIComponentProps, Orientation as BaseOrientation } from "../../internals/types.mjs";
import type { TabsTab } from "../tab/TabsTab.mjs";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export declare const TabsRoot: React.ForwardRefExoticComponent<Omit<TabsRootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export type TabsRootOrientation = BaseOrientation;
export interface TabsRootState {
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}
export interface TabsRootProps extends BaseUIComponentProps<'div', TabsRootState> {
  /**
   * The value of the currently active `Tab`. Use when the component is controlled.
   * When the value is `null`, no Tab will be active.
   */
  value?: TabsTab.Value | undefined;
  /**
   * The default value. Use when the component is not controlled.
   * When the value is `null`, no Tab will be active.
   * @default 0
   */
  defaultValue?: TabsTab.Value | undefined;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: TabsRoot.Orientation | undefined;
  /**
   * Callback invoked when new value is being set.
   *
   * The event `reason` is `'none'` for user-initiated changes, such as a click
   * or keyboard navigation; `'initial'` for the first automatic selection or
   * fallback in uncontrolled roots when `defaultValue` is omitted or
   * `undefined`, including when the implicit initial value is disabled or
   * missing; `'disabled'` for automatic fallback when the selected tab becomes
   * disabled in uncontrolled roots; or `'missing'` for automatic fallback when
   * the selected tab is removed, or when an explicit `defaultValue` never
   * matches a mounted tab in uncontrolled roots.
   *
   * For automatic changes, the selected value can be `null` when no enabled Tab
   * is available as a fallback.
   *
   * Automatic changes cannot be canceled; calling `eventDetails.cancel()` for
   * `'initial'`, `'disabled'`, or `'missing'` has no effect.
   */
  onValueChange?: ((value: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => void) | undefined;
}
export type TabsRootChangeEventReason = typeof REASONS.none | typeof REASONS.disabled | typeof REASONS.missing | typeof REASONS.initial;
export type TabsRootChangeEventDetails = BaseUIChangeEventDetails<TabsRoot.ChangeEventReason, {
  activationDirection: TabsTab.ActivationDirection;
}>;
export declare namespace TabsRoot {
  type State = TabsRootState;
  type Props = TabsRootProps;
  type Orientation = TabsRootOrientation;
  type ChangeEventReason = TabsRootChangeEventReason;
  type ChangeEventDetails = TabsRootChangeEventDetails;
}