import * as React from 'react';
import { type BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails.js";
import { REASONS } from "../../internals/reasons.js";
import { PayloadChildRenderFunction } from "../../utils/popups/index.js";
import { PreviewCardHandle } from "../store/PreviewCardHandle.js";
/**
 * Groups all parts of the preview card.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardRoot: <Payload>(props: PreviewCardRoot.Props<Payload>) => React.JSX.Element;
export interface PreviewCardRootState {}
export interface PreviewCardRootProps<Payload = unknown> {
  /**
   * Whether the preview card is initially open.
   *
   * To render a controlled preview card, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Whether the preview card is currently open.
   */
  open?: boolean | undefined;
  /**
   * Event handler called when the preview card is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the preview card is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Unmounts the preview card popup.
   * - `close`: Closes the preview card imperatively when called.
   */
  actionsRef?: React.RefObject<PreviewCardRoot.Actions | null> | undefined;
  /**
   * A handle to associate the preview card with a trigger.
   * If specified, allows external triggers to control the card's open state.
   * Can be created with the PreviewCard.createHandle() method.
   */
  handle?: PreviewCardHandle<Payload> | undefined;
  /**
   * The content of the preview card.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  /**
   * ID of the trigger that the preview card is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled preview card.
   * There's no need to specify this prop when the preview card is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the preview card is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open preview card.
   */
  defaultTriggerId?: string | null | undefined;
}
export interface PreviewCardRootActions {
  unmount: () => void;
  close: () => void;
}
export type PreviewCardRootChangeEventReason = typeof REASONS.triggerHover | typeof REASONS.triggerFocus | typeof REASONS.triggerPress | typeof REASONS.outsidePress | typeof REASONS.escapeKey | typeof REASONS.imperativeAction | typeof REASONS.none;
export type PreviewCardRootChangeEventDetails = BaseUIChangeEventDetails<PreviewCardRoot.ChangeEventReason> & {
  preventUnmountOnClose(): void;
};
export declare namespace PreviewCardRoot {
  type State = PreviewCardRootState;
  type Props<Payload = unknown> = PreviewCardRootProps<Payload>;
  type Actions = PreviewCardRootActions;
  type ChangeEventReason = PreviewCardRootChangeEventReason;
  type ChangeEventDetails = PreviewCardRootChangeEventDetails;
}