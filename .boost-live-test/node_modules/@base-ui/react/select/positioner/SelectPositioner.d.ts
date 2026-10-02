import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import { type Align, type Side, type UseAnchorPositioningSharedParameters } from "../../internals/useAnchorPositioning.js";
/**
 * Positions the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectPositioner: React.ForwardRefExoticComponent<Omit<SelectPositionerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectPositionerState {
  /**
   * Whether the component is open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side | 'none';
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
}
export interface SelectPositionerProps extends UseAnchorPositioningSharedParameters, BaseUIComponentProps<'div', SelectPositionerState> {
  /**
   * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.
   * @default true
   */
  alignItemWithTrigger?: boolean | undefined;
}
export declare namespace SelectPositioner {
  type State = SelectPositionerState;
  type Props = SelectPositionerProps;
}