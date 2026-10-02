import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerContent: React.ForwardRefExoticComponent<Omit<DrawerContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerContentProps extends BaseUIComponentProps<'div', DrawerContentState> {}
export interface DrawerContentState {}
export declare namespace DrawerContent {
  type Props = DrawerContentProps;
  type State = DrawerContentState;
}