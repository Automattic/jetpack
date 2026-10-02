import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A wrapper element intended to contain your app's main UI.
 * Applies `data-active` when any drawer within the nearest `<Drawer.Provider>` is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerIndent: React.ForwardRefExoticComponent<Omit<DrawerIndentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerIndentState {
  /**
   * Whether any drawer within the nearest <Drawer.Provider> is open.
   */
  active: boolean;
}
export interface DrawerIndentProps extends BaseUIComponentProps<'div', DrawerIndentState> {}
export declare namespace DrawerIndent {
  type State = DrawerIndentState;
  type Props = DrawerIndentProps;
}