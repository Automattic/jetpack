import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { NumberFieldRootState } from "../root/NumberFieldRoot.js";
/**
 * An interactive area where the user can click and drag to change the field value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export declare const NumberFieldScrubArea: React.ForwardRefExoticComponent<Omit<NumberFieldScrubAreaProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
export interface NumberFieldScrubAreaState extends NumberFieldRootState {}
export interface NumberFieldScrubAreaProps extends BaseUIComponentProps<'span', NumberFieldScrubAreaState> {
  /**
   * Cursor movement direction in the scrub area.
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical' | undefined;
  /**
   * Determines how many pixels the cursor must move before the value changes.
   * A higher value will make scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity?: number | undefined;
  /**
   * If specified, determines the distance that the cursor may move from the center
   * of the scrub area before it will loop back around.
   */
  teleportDistance?: number | undefined;
}
export declare namespace NumberFieldScrubArea {
  type State = NumberFieldScrubAreaState;
  type Props = NumberFieldScrubAreaProps;
}