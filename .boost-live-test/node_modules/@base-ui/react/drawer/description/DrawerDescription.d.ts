import type * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A paragraph with additional information about the drawer.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerDescription: DrawerDescription;
export interface DrawerDescriptionProps extends BaseUIComponentProps<'p', DrawerDescriptionState> {}
export interface DrawerDescriptionState {}
export interface DrawerDescription {
  (componentProps: DrawerDescriptionProps): React.JSX.Element;
}
export declare namespace DrawerDescription {
  type Props = DrawerDescriptionProps;
  type State = DrawerDescriptionState;
}