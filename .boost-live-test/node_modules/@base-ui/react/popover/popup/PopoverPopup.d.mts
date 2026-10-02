import * as React from 'react';
import { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { Side, Align } from "../../internals/useAnchorPositioning.mjs";
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { TransitionStatus } from "../../internals/useTransitionStatus.mjs";
/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export declare const PopoverPopup: React.ForwardRefExoticComponent<Omit<PopoverPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PopoverPopupState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether transitions should be skipped.
   */
  instant: 'dismiss' | 'click' | 'focus' | 'trigger-change' | undefined;
}
export interface PopoverPopupProps extends BaseUIComponentProps<'div', PopoverPopupState> {
  /**
   * Determines the element to focus when the popover is opened.
   * By default, focus moves to the first tabbable element inside the popup, except when the popover
   * is opened by touch — then the popup itself is focused to avoid opening the virtual keyboard.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or popup).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, `null` to fall back to the default behavior, or `false`/`undefined` to do nothing.
   */
  initialFocus?: boolean | React.RefObject<HTMLElement | null> | ((openType: InteractionType) => void | boolean | HTMLElement | null) | undefined;
  /**
   * Determines the element to focus when the popover is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, `null` to fall back to the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?: boolean | React.RefObject<HTMLElement | null> | ((closeType: InteractionType) => void | boolean | HTMLElement | null) | undefined;
}
export declare namespace PopoverPopup {
  type State = PopoverPopupState;
  type Props = PopoverPopupProps;
}