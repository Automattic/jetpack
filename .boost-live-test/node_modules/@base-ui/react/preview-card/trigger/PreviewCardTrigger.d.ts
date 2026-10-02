import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { PreviewCardHandle } from "../store/PreviewCardHandle.js";
/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardTrigger: PreviewCardTrigger;
export interface PreviewCardTrigger {
  <Payload>(componentProps: PreviewCardTrigger.Props<Payload> & React.RefAttributes<HTMLElement>): React.JSX.Element;
}
export interface PreviewCardTriggerState {
  /**
   * Whether the preview card is currently open and was opened by this trigger.
   */
  open: boolean;
}
export interface PreviewCardTriggerProps<Payload = unknown> extends BaseUIComponentProps<'a', PreviewCardTriggerState, React.ComponentPropsWithRef<'a'>> {
  /**
   * A handle to associate the trigger with a preview card.
   */
  handle?: PreviewCardHandle<Payload> | undefined;
  /**
   * A payload to pass to the preview card when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * How long to wait before the preview card opens. Specified in milliseconds.
   * @default 600
   */
  delay?: number | undefined;
  /**
   * How long to wait before closing the preview card. Specified in milliseconds.
   * @default 300
   */
  closeDelay?: number | undefined;
}
export declare namespace PreviewCardTrigger {
  type State = PreviewCardTriggerState;
  type Props<Payload = unknown> = PreviewCardTriggerProps<Payload>;
}