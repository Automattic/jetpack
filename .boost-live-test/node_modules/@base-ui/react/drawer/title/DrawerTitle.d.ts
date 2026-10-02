import type * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A heading that labels the drawer.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerTitle: DrawerTitle;
export interface DrawerTitleProps extends BaseUIComponentProps<'h2', DrawerTitleState> {}
export interface DrawerTitleState {}
export interface DrawerTitle {
  (componentProps: DrawerTitleProps): React.JSX.Element;
}
export declare namespace DrawerTitle {
  type Props = DrawerTitleProps;
  type State = DrawerTitleState;
}