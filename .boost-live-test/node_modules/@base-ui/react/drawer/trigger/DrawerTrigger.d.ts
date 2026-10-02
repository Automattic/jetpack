import type * as React from 'react';
import type { DrawerHandle } from "../handle.js";
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * A button that opens the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerTrigger: DrawerTrigger;
export interface DrawerTrigger {
  <Payload>(componentProps: DrawerTriggerProps<Payload> & React.RefAttributes<HTMLElement>): React.JSX.Element;
}
export interface DrawerTriggerProps<Payload = unknown> extends NativeButtonProps, BaseUIComponentProps<'button', DrawerTriggerState> {
  /**
   * A handle to associate the trigger with a drawer.
   * Can be created with the Drawer.createHandle() method.
   */
  handle?: DrawerHandle<Payload> | undefined;
  /**
   * A payload to pass to the drawer when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * ID of the trigger. In addition to being forwarded to the rendered element,
   * it is also used to specify the active trigger for drawers in controlled mode (with the Drawer.Root `triggerId` prop).
   */
  id?: string | undefined;
}
export interface DrawerTriggerState {
  /**
   * Whether the trigger is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the drawer is currently open and was opened by this trigger.
   */
  open: boolean;
}
export declare namespace DrawerTrigger {
  type Props<Payload = unknown> = DrawerTriggerProps<Payload>;
  type State = DrawerTriggerState;
}