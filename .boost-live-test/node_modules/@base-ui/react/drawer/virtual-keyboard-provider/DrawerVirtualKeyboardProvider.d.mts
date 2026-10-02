import * as React from 'react';
/**
 * Provides keyboard-aware focus and scroll handling for bottom-sheet drawers with form fields.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare function DrawerVirtualKeyboardProvider(props: DrawerVirtualKeyboardProvider.Props): React.JSX.Element;
export interface DrawerVirtualKeyboardProviderState {}
export interface DrawerVirtualKeyboardProviderProps {
  children?: React.ReactNode;
}
export declare namespace DrawerVirtualKeyboardProvider {
  type State = DrawerVirtualKeyboardProviderState;
  type Props = DrawerVirtualKeyboardProviderProps;
}