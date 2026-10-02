import * as React from 'react';
import { type BaseUIComponentProps } from "../../internals/types.js";
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export declare const PreviewCardPortal: React.ForwardRefExoticComponent<Omit<PreviewCardPortalProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface PreviewCardPortalState {}
export interface PreviewCardPortalProps extends BaseUIComponentProps<'div', PreviewCardPortalState> {
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
export declare namespace PreviewCardPortal {
  type State = PreviewCardPortalState;
  type Props = PreviewCardPortalProps;
}