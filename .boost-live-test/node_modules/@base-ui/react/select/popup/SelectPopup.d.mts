import * as React from 'react';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { BaseUIComponentProps } from "../../internals/types.mjs";
import type { Side, Align } from "../../internals/useAnchorPositioning.mjs";
import type { TransitionStatus } from "../../internals/useTransitionStatus.mjs";
/**
 * A container for the select list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectPopup: React.ForwardRefExoticComponent<Omit<SelectPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectPopupProps extends BaseUIComponentProps<'div', SelectPopupState> {
  children?: React.ReactNode;
  /**
   * Determines the element to focus when the select popup is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?: boolean | React.RefObject<HTMLElement | null> | ((closeType: InteractionType) => boolean | HTMLElement | null | void) | undefined;
}
export interface SelectPopupState {
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side | 'none';
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the component is open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export declare namespace SelectPopup {
  type Props = SelectPopupProps;
  type State = SelectPopupState;
}