import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
import { type CollapsibleRootState } from "../root/CollapsibleRoot.js";
/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export declare const CollapsibleTrigger: React.ForwardRefExoticComponent<Omit<CollapsibleTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export interface CollapsibleTriggerState extends CollapsibleRootState {}
export interface CollapsibleTriggerProps extends NativeButtonProps, BaseUIComponentProps<'button', CollapsibleTriggerState> {}
export declare namespace CollapsibleTrigger {
  type State = CollapsibleTriggerState;
  type Props = CollapsibleTriggerProps;
}