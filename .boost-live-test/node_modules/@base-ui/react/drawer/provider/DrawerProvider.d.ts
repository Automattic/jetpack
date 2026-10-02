import * as React from 'react';
/**
 * Provides a shared context for coordinating global Drawer UI, such as indent/background effects based on whether any Drawer is open.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare function DrawerProvider(props: DrawerProvider.Props): React.JSX.Element;
export interface DrawerProviderState {}
export interface DrawerProviderProps {
  children?: React.ReactNode;
}
export declare namespace DrawerProvider {
  type State = DrawerProviderState;
  type Props = DrawerProviderProps;
}