import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
import type { ToolbarRoot } from "../root/ToolbarRoot.js";
/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export declare const ToolbarLink: React.ForwardRefExoticComponent<Omit<ToolbarLinkProps, "ref"> & React.RefAttributes<HTMLAnchorElement>>;
export interface ToolbarLinkState {
  /**
   * The component orientation.
   */
  orientation: ToolbarRoot.Orientation;
}
export interface ToolbarLinkProps extends BaseUIComponentProps<'a', ToolbarLinkState, React.ComponentPropsWithRef<'a'>> {}
export declare namespace ToolbarLink {
  type State = ToolbarLinkState;
  type Props = ToolbarLinkProps;
}