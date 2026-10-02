import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { NumberFieldRootState } from "../root/NumberFieldRoot.js";
/**
 * A custom element to display instead of the native cursor while using the scrub area.
 * Renders a `<span>` element.
 *
 * This component uses the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API), which may prompt the browser to display a related notification. It is disabled
 * in Safari to avoid a layout shift that this notification causes there.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export declare const NumberFieldScrubAreaCursor: React.ForwardRefExoticComponent<Omit<NumberFieldScrubAreaCursorProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface NumberFieldScrubAreaCursorState extends NumberFieldRootState {}
export interface NumberFieldScrubAreaCursorProps extends BaseUIComponentProps<'span', NumberFieldScrubAreaCursorState> {}
export declare namespace NumberFieldScrubAreaCursor {
  type State = NumberFieldScrubAreaCursorState;
  type Props = NumberFieldScrubAreaCursorProps;
}