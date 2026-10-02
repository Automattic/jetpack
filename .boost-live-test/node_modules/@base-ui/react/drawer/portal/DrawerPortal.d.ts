import type * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export declare const DrawerPortal: DrawerPortal;
export interface DrawerPortalState {}
export interface DrawerPortalProps extends BaseUIComponentProps<'div', DrawerPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * A parent element to render the portal element into.
   */
  container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}
export interface DrawerPortal {
  (componentProps: DrawerPortalProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element | null;
}
export declare namespace DrawerPortal {
  type Props = DrawerPortalProps;
  type State = DrawerPortalState;
}