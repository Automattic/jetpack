import * as React from 'react';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
import { type DrawerSwipeDirection } from "../root/DrawerRootContext.js";
/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerPopup: React.ForwardRefExoticComponent<Omit<DrawerPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerPopupProps extends BaseUIComponentProps<'div', DrawerPopupState> {
  /**
   * Determines the element to focus when the drawer is opened.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or popup).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  initialFocus?: boolean | React.RefObject<HTMLElement | null> | ((openType: InteractionType) => boolean | HTMLElement | null | void) | undefined;
  /**
   * Determines the element to focus when the drawer is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?: boolean | React.RefObject<HTMLElement | null> | ((closeType: InteractionType) => boolean | HTMLElement | null | void) | undefined;
}
export interface DrawerPopupState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the active snap point is the full-height expanded state.
   */
  expanded: boolean;
  /**
   * Whether the drawer is nested within a parent drawer.
   */
  nested: boolean;
  /**
   * Whether the drawer has nested drawers open.
   */
  nestedDrawerOpen: boolean;
  /**
   * Whether a nested drawer is currently being swiped.
   */
  nestedDrawerSwiping: boolean;
  /**
   * The swipe direction used to dismiss the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
  /**
   * Whether the drawer is being swiped.
   */
  swiping: boolean;
}
export declare namespace DrawerPopup {
  type Props = DrawerPopupProps;
  type State = DrawerPopupState;
}