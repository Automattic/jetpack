import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export declare const SelectPortal: React.ForwardRefExoticComponent<Omit<SelectPortalProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface SelectPortalState {}
export interface SelectPortalProps extends BaseUIComponentProps<'div', SelectPortalState> {
  /**
   * A parent element to render the portal element into.
   */
  container?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}
export declare namespace SelectPortal {
  type State = SelectPortalState;
  type Props = SelectPortalProps;
}