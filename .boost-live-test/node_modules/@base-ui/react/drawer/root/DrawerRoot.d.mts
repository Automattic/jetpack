import * as React from 'react';
import { type DrawerSwipeDirection, type DrawerSnapPoint } from "./DrawerRootContext.mjs";
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import type { DrawerHandle } from "../handle.mjs";
import type { PayloadChildRenderFunction } from "../../utils/popups/index.mjs";
/**
 * Groups all parts of the drawer.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare function DrawerRoot<Payload = unknown>(props: DrawerRoot.Props<Payload>): React.JSX.Element;
export interface DrawerRootState {}
export interface DrawerRootProps<Payload = unknown> {
  /**
   * Whether the drawer is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the drawer is initially open.
   *
   * To render a controlled drawer, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Determines if the drawer enters a modal state when open.
   * - `true`: user interaction is limited to just the drawer: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the drawer, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   * @default true
   */
  modal?: boolean | 'trap-focus' | undefined;
  /**
   * Event handler called when the drawer is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: DrawerRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the drawer is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * Whether to prevent the drawer from closing on outside presses.
   * For non-modal drawers, this also prevents the drawer from closing when focus moves outside of it.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Manually unmounts the drawer.
   * Call this after any externally controlled closing animation finishes.
   * - `close`: Closes the drawer imperatively when called.
   */
  actionsRef?: React.RefObject<DrawerRoot.Actions | null> | undefined;
  /**
   * A handle to associate the drawer with a trigger.
   * If specified, allows detached triggers to control the drawer's open state.
   * Can be created with the Drawer.createHandle() method.
   */
  handle?: DrawerHandle<Payload> | undefined;
  /**
   * ID of the trigger that the drawer is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled drawer.
   * There's no need to specify this prop when the drawer is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the drawer is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open drawer.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the drawer.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  /**
   * The swipe direction used to dismiss the drawer.
   * @default 'down'
   */
  swipeDirection?: DrawerSwipeDirection | undefined;
  /**
   * Snap points used to position the drawer.
   * Use numbers between 0 and 1 to represent fractions of the viewport height,
   * numbers greater than 1 as pixel values, or strings in `px`/`rem` units
   * (for example, `'148px'` or `'30rem'`).
   */
  snapPoints?: DrawerSnapPoint[] | undefined;
  /**
   * Disables velocity-based snap skipping so drag distance determines the next snap point.
   * @default false
   */
  snapToSequentialPoints?: boolean | undefined;
  /**
   * The currently active snap point. Use with `onSnapPointChange` to control the snap point.
   */
  snapPoint?: DrawerSnapPoint | null | undefined;
  /**
   * The initial snap point value when uncontrolled.
   */
  defaultSnapPoint?: DrawerSnapPoint | null | undefined;
  /**
   * Callback fired when the snap point changes.
   */
  onSnapPointChange?: ((snapPoint: DrawerSnapPoint | null, eventDetails: DrawerRoot.SnapPointChangeEventDetails) => void) | undefined;
}
export interface DrawerRootActions {
  unmount: () => void;
  close: () => void;
}
export type DrawerRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.outsidePress | typeof REASONS.escapeKey | typeof REASONS.closeWatcher | typeof REASONS.closePress | typeof REASONS.focusOut | typeof REASONS.imperativeAction | typeof REASONS.swipe | typeof REASONS.none;
export type DrawerRootChangeEventDetails = BaseUIChangeEventDetails<DrawerRoot.ChangeEventReason> & {
  preventUnmountOnClose(): void;
};
export type DrawerRootSnapPointChangeEventReason = DrawerRootChangeEventReason;
export type DrawerRootSnapPointChangeEventDetails = BaseUIChangeEventDetails<DrawerRootSnapPointChangeEventReason>;
export declare namespace DrawerRoot {
  type State = DrawerRootState;
  type Props<Payload = unknown> = DrawerRootProps<Payload>;
  type Actions = DrawerRootActions;
  type ChangeEventReason = DrawerRootChangeEventReason;
  type ChangeEventDetails = DrawerRootChangeEventDetails;
  type SnapPointChangeEventReason = DrawerRootSnapPointChangeEventReason;
  type SnapPointChangeEventDetails = DrawerRootSnapPointChangeEventDetails;
  type SnapPoint = DrawerSnapPoint;
}