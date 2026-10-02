import type { BaseUIComponentProps } from "../../internals/types.js";
import { Side } from "../../internals/useAnchorPositioning.js";
import { type TransitionStatus } from "../../internals/useTransitionStatus.js";
export interface SelectScrollArrowState {
  /**
   * The direction of the element.
   */
  direction: 'up' | 'down';
  /**
   * Whether the element is visible.
   */
  visible: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side | 'none';
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}
export interface SelectScrollArrowProps extends BaseUIComponentProps<'div', SelectScrollArrowState> {
  direction: 'up' | 'down';
  /**
   * Whether to keep the HTML element in the DOM while the select popup is not scrollable.
   * @default false
   */
  keepMounted?: boolean | undefined;
}
export declare namespace SelectScrollArrow {
  type State = SelectScrollArrowState;
  type Props = SelectScrollArrowProps;
}