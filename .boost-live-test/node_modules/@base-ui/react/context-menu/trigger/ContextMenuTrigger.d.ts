import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export declare const ContextMenuTrigger: React.ForwardRefExoticComponent<Omit<ContextMenuTriggerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ContextMenuTriggerState {
  /**
   * Whether the context menu is currently open.
   */
  open: boolean;
}
export interface ContextMenuTriggerProps extends BaseUIComponentProps<'div', ContextMenuTriggerState> {}
export declare namespace ContextMenuTrigger {
  type State = ContextMenuTriggerState;
  type Props = ContextMenuTriggerProps;
}