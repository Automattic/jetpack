import * as React from 'react';
import { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { BaseUIComponentProps } from "../../internals/types.js";
import type { Side, Align } from "../../internals/useAnchorPositioning.js";
import type { TransitionStatus } from "../../internals/useTransitionStatus.js";
/**
 * A container for the list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxPopup: React.ForwardRefExoticComponent<Omit<ComboboxPopupProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxPopupState {
  /**
   * Whether the component is open.
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether there are no items to display.
   */
  empty: boolean;
}
export interface ComboboxPopupProps extends BaseUIComponentProps<'div', ComboboxPopupState> {
  /**
   * Determines the element to focus when the popup is opened.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (first tabbable element or popup).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  initialFocus?: boolean | React.RefObject<HTMLElement | null> | ((openType: InteractionType) => void | boolean | HTMLElement | null) | undefined;
  /**
   * Determines the element to focus when the popup is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?: boolean | React.RefObject<HTMLElement | null> | ((closeType: InteractionType) => void | boolean | HTMLElement | null) | undefined;
}
export declare namespace ComboboxPopup {
  type State = ComboboxPopupState;
  type Props = ComboboxPopupProps;
}