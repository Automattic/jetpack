import type * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../../internals/types.js";
/**
 * A button that closes the drawer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerClose: DrawerClose;
export interface DrawerCloseProps extends NativeButtonProps, BaseUIComponentProps<'button', DrawerCloseState> {}
export interface DrawerCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}
export interface DrawerClose {
  (componentProps: DrawerCloseProps): React.JSX.Element;
}
export declare namespace DrawerClose {
  type Props = DrawerCloseProps;
  type State = DrawerCloseState;
}