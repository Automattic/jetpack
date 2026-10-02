import * as React from 'react';
import { Menu } from "../../menu/index.mjs";
import type { BaseUIChangeEventDetails } from "../../types/index.mjs";
import type { MenuRoot } from "../../menu/root/MenuRoot.mjs";
/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export declare function ContextMenuRoot(props: ContextMenuRoot.Props): React.JSX.Element;
export interface ContextMenuRootState {}
export interface ContextMenuRootProps extends Omit<Menu.Root.Props, 'handle' | 'triggerId' | 'defaultTriggerId' | 'modal' | 'openOnHover' | 'delay' | 'closeDelay' | 'closeParentOnEsc' | 'onOpenChange' | 'children'> {
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: ContextMenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * @ignore
   * @deprecated This prop has no effect on Context Menu.
   */
  closeParentOnEsc?: Menu.Root.Props['closeParentOnEsc'] | undefined;
  children?: React.ReactNode | undefined;
}
export type ContextMenuRootActions = MenuRoot.Actions;
export type ContextMenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type ContextMenuRootChangeEventDetails = BaseUIChangeEventDetails<ContextMenuRoot.ChangeEventReason>;
export declare namespace ContextMenuRoot {
  type State = ContextMenuRootState;
  type Props = ContextMenuRootProps;
  type Actions = ContextMenuRootActions;
  type ChangeEventReason = ContextMenuRootChangeEventReason;
  type ChangeEventDetails = ContextMenuRootChangeEventDetails;
}