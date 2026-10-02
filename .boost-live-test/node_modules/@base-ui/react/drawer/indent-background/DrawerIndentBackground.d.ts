import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An element placed before `<Drawer.Indent>` to render a background layer that can be styled based on whether any drawer is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerIndentBackground: React.ForwardRefExoticComponent<Omit<DrawerIndentBackgroundProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface DrawerIndentBackgroundState {
  /**
   * Whether any drawer within the nearest <Drawer.Provider> is open.
   */
  active: boolean;
}
export interface DrawerIndentBackgroundProps extends BaseUIComponentProps<'div', DrawerIndentBackgroundState> {}
export declare namespace DrawerIndentBackground {
  type State = DrawerIndentBackgroundState;
  type Props = DrawerIndentBackgroundProps;
}